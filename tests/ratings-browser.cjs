const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const path = require("node:path");
const fs = require("node:fs/promises");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() =>
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-ratings-token",
          profile: { name: "حساب", phone: "+201012345678", email: "" },
        }),
      ),
    );
    let status = "paid",
      paid = true,
      rated = false,
      fail = true,
      release;
    const invoiceRequests = [];
    const calls = [],
      errors = [];
    const order = () => ({
      id: 541,
      status,
      user_paid: paid,
      is_rated: rated,
      is_received: false,
      subtotal: "1.00",
      vat_amount: "0.15",
      total: "1.15",
      created_at: "2026-10-31 00:09:41",
      items: [
        {
          id: 821,
          product: { id: 55, name: "غسيل زل", images: null },
          quantity: 1,
          price: 1,
          length: null,
          width: null,
          product_size: null,
        },
      ],
      order_images: [],
    });
    await context.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,DELETE",
        "access-control-allow-headers": "content-type,authorization,accept-language",
      };
      const respond = (json, code = 200) =>
        route.fulfill({ status: code, headers, json });
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (url.pathname === "/api/settings") return respond({ result: true, data: {} });
      if (/\/orders\/541\/(invoice|view|download)$/.test(url.pathname)) {
        invoiceRequests.push(url.pathname);
        assert.equal(url.pathname, "/api/orders/541/invoice");
        assert.equal(request.headers().authorization, "Bearer fixture-ratings-token");
        return respond(require("./fixtures/invoice.cjs")(541));
      }
      if (url.pathname === "/api/ratings") {
        assert.equal(request.headers().authorization, "Bearer fixture-ratings-token");
        const body = request.postDataJSON();
        calls.push(body);
        assert.deepEqual(body, { order_id: 541, rating: 4 });
        if (fail) {
          fail = false;
          return respond({ success: false, message: "تعذر حفظ التقييم للاختبار" }, 422);
        }
        await new Promise((resolve) => {
          release = resolve;
        });
        rated = true;
        return respond({ success: true, message: "Rating submitted successfully." }, 201);
      }
      if (url.pathname === "/api/orders/541")
        return respond({ success: true, data: order() });
      if (url.pathname === "/api/orders")
        return respond({ success: true, data: [order()] });
      if (url.pathname === "/api/count")
        return respond({ success: true, data: { item_count: 0 } });
      return respond({ success: true, data: [] });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/tracking?order=541");
    const rateButton = () =>
      page.getByRole("button", { name: "تقييم الطلب", exact: true });
    await page.getByRole("heading", { name: "تم إكمال طلبك بنجاح" }).waitFor();
    assert.equal(invoiceRequests.length, 0);
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "تحميل الفاتورة", exact: true }).click();
    const downloaded = await downloadEvent;
    assert.equal(downloaded.suggestedFilename(), "invoice-541.pdf");
    const pdfBytes = await fs.readFile(await downloaded.path());
    assert.equal(pdfBytes.subarray(0, 5).toString(), "%PDF-");
    assert.ok(pdfBytes.length > 10000);
    assert.ok(invoiceRequests.length > 0);
    assert.ok(invoiceRequests.every((url) => url === "/api/orders/541/invoice"));
    if (process.env.INVOICE_PDF_PATH)
      await downloaded.saveAs(process.env.INVOICE_PDF_PATH);
    assert.equal(await page.getByRole("dialog", { name: "فاتورة الطلب" }).count(), 0);
    for (const scenario of [
      { status: "confirmed", paid: true, rated: false },
      { status: "delivered_to_customer", paid: false, rated: false },
      { status: "paid", paid: true, rated: true },
    ]) {
      status = scenario.status;
      paid = scenario.paid;
      rated = scenario.rated;
      await page.reload();
      await page.getByRole("region", { name: "مراحل الطلب" }).waitFor();
      assert.equal(await rateButton().count(), 0);
      assert.equal(
        await page.getByRole("button", { name: "تحميل الفاتورة", exact: true }).count(),
        scenario.status === "paid" ? 1 : 0,
      );
    }
    status = "paid";
    paid = true;
    rated = false;
    await page.reload();
    await rateButton().click();
    const dialog = page.getByRole("dialog", { name: "كيف كانت تجربتك مع شايني كاربت؟" });
    await dialog.waitFor();
    assert.equal(await dialog.locator("textarea").count(), 0);
    await dialog.getByRole("button", { name: "إرسال التقييم", exact: true }).click();
    await dialog.getByText("اختر عدد النجوم أولًا علشان نقدر نسجل تقييمك.").waitFor();
    assert.equal(calls.length, 0);
    await dialog
      .locator("label")
      .filter({ has: page.locator('input[value="4"]') })
      .click();
    await dialog.getByText("جيد جدًا", { exact: true }).waitFor();
    if (process.env.RATING_SCREENSHOT_DIR) {
      await fs.mkdir(process.env.RATING_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({
        path: path.join(process.env.RATING_SCREENSHOT_DIR, "rating-desktop.png"),
      });
    }
    await dialog.getByRole("button", { name: "إرسال التقييم", exact: true }).click();
    await dialog.getByText("تعذر حفظ التقييم للاختبار").waitFor();
    assert.equal(
      await dialog.getByRole("radio", { name: "4 من 5 نجوم", exact: true }).isChecked(),
      true,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await dialog.evaluate((element) => element.scrollWidth > element.clientWidth),
      false,
    );
    if (process.env.RATING_SCREENSHOT_DIR)
      await page.screenshot({
        path: path.join(process.env.RATING_SCREENSHOT_DIR, "rating-mobile.png"),
      });
    await page.evaluate(() => {
      const form = document.querySelector("dialog form");
      form.requestSubmit();
      form.requestSubmit();
    });
    await dialog.getByRole("button", { name: "جاري إرسال التقييم…" }).waitFor();
    assert.equal(calls.length, 2);
    await page.keyboard.press("Escape");
    assert.equal(await dialog.isVisible(), true);
    assert.equal(
      await dialog.getByRole("button", { name: "إغلاق نافذة التقييم" }).isDisabled(),
      true,
    );
    release();
    await dialog.waitFor({ state: "hidden" });
    await page.getByText("شكرًا لك! تم إرسال تقييمك بنجاح.").waitFor();
    assert.equal(await rateButton().count(), 0);
    await page.reload();
    await page.getByText("تم تقييم الطلب", { exact: true }).waitFor();
    assert.equal(await rateButton().count(), 0);
    rated = false;
    await page.goto(base + "/orders");
    await page.getByRole("button", { name: "الطلبات السابقة", exact: true }).click();
    await rateButton().click();
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await rateButton().evaluate((element) => element === document.activeElement),
      true,
    );
    await page.goto(base + "/tracking?order=541");
    await page.getByRole("heading", { name: "تم إكمال طلبك بنجاح" }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (process.env.RATING_SCREENSHOT_DIR) {
      await page.screenshot({
        path: path.join(process.env.RATING_SCREENSHOT_DIR, "completion-mobile.png"),
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: path.join(process.env.RATING_SCREENSHOT_DIR, "completion-desktop.png"),
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: completion banner, invoice, rating eligibility, stars, validation, exact payload, retry, duplicate prevention, success, rated reload, list entry, keyboard and responsive layout.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
