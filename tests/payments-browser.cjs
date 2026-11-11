const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() =>
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-payment-token",
          profile: { name: "حساب", phone: "+201012345678", email: "" },
        }),
      ),
    );
    let status = "ordered",
      failCheckout = true,
      releaseCheckout;
    let checkoutGate = Promise.resolve();
    let verificationResult = "pending";
    let tamaraPaid = false;
    const tamaraCalls = [];
    const statusCalls = [];
    const calls = [],
      errors = [];
    await context.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname;
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST",
        "access-control-allow-headers": "authorization,content-type,accept-language",
      };
      const send = (json, code = 200) => route.fulfill({ json, status: code, headers });
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/settings") return send({ result: true, data: {} });
      assert.equal(request.headers().authorization, "Bearer fixture-payment-token");
      if (path === "/api/payment/tamara/success") {
        tamaraCalls.push(request.url());
        assert.equal(request.method(), "GET");
        assert.equal(
          new URL(request.url()).searchParams.get("order_reference_id"),
          "reference-532",
        );
        if (tamaraPaid) status = "paid";
        return send({
          result: true,
          errNum: 200,
          message: tamaraPaid ? "Payment successful" : "Pending",
          data: { order_id: 532 },
        });
      }
      if (path === "/api/orders/532")
        return send({
          success: true,
          data: {
            id: 532,
            status,
            created_at: "2026-10-27 11:00:00",
            subtotal: "35",
            vat_amount: "5.25",
            total: "40.25",
            items: [],
          },
        });
      if (path === "/api/payments/status") {
        statusCalls.push(request.postDataJSON());
        assert.equal(request.method(), "POST");
        assert.deepEqual(request.postDataJSON(), {
          order_id: 532,
          checkout_id: "fixture.prod01",
        });
        if (verificationResult === "paid") {
          status = "paid";
          return send({
            success: true,
            data: { payment_status: "paid", result_code: "000.000.000" },
          });
        }
        return send(
          {
            success: false,
            data: {
              payment_status: "failed",
              result_code:
                verificationResult === "pending" ? "000.200.000" : "800.100.100",
              result_description:
                verificationResult === "pending" ? "transaction pending" : "declined",
            },
          },
          422,
        );
      }
      if (path === "/api/payments/checkout") {
        calls.push(request.postDataJSON());
        assert.equal(request.method(), "POST");
        if (failCheckout) {
          failCheckout = false;
          return send({ message: "تعذر تجهيز الدفع للاختبار" }, 422);
        }
        await checkoutGate;
        return send({
          success: true,
          data: {
            checkout_id: "fixture.prod01",
            order_id: 532,
            amount: "40.25",
            currency: "SAR",
            payment_url: `https://${request.postDataJSON().payment_brand === "APPLEPAY" ? "eu-test" : "eu-prod"}.oppwa.com/v1/paymentWidgets.js?checkoutId=fixture.prod01`,
          },
        });
      }
      if (path === "/api/cart")
        return send({
          success: true,
          data: {
            cart_items: [],
            cart_subtotal: 0,
            vat_percentage: 14,
            vat_amount: 0,
            cart_total: 0,
          },
        });
      if (path === "/api/count") return send({ success: true, data: { item_count: 0 } });
      if (path === "/api/addresses")
        return send({ result: true, data: { addresses: [] } });
      if (path === "/api/categories") return send({ success: true, data: [] });
      return send({ message: path }, 404);
    });
    await context.route("https://{eu-prod,eu-test}.oppwa.com/**", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: "window.optionsAtWidgetLoad=window.wpwlOptions;const form=document.querySelector('.paymentWidgets');form.textContent='نموذج تجريبي للبوابة';const done=document.createElement('a');done.href=form.action;done.textContent='إتمام الاختبار';form.append(done);",
      }),
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    for (const value of [
      "ordered",
      "confirmed",
      "arrived_to_customer",
      "on_way_to_customer_again",
      "paid",
      "delivered_to_customer",
      "cancelled",
    ]) {
      status = value;
      await page.goto(base + "/tracking?order=532");
      await page.getByRole("heading", { name: "منتجات الطلب", exact: true }).waitFor();
      assert.equal(await page.getByRole("region", { name: "دفع قيمة الطلب" }).count(), 0);
    }
    status = "arrived_to_customer_again";
    await page.goto(base + "/tracking?order=532");
    const payment = page.getByRole("region", { name: "دفع قيمة الطلب" });
    await payment.waitFor();
    await page.locator('[aria-label="جاري تحميل الموقع"]').waitFor({ state: "hidden" });
    assert.equal(calls.length, 0);
    await payment.getByRole("button", { name: "متابعة الدفع", exact: true }).click();
    await payment
      .getByRole("alert")
      .filter({ hasText: "تعذر تجهيز الدفع للاختبار" })
      .waitFor();
    for (const [label, brand] of [
      ["مدى", "MADA"],
      ["Apple Pay", "APPLEPAY"],
      ["Visa", "VISA"],
      ["Mastercard", "MASTER"],
    ]) {
      await payment.getByRole("radio", { name: label, exact: true }).check();
      const before = calls.length;
      checkoutGate = new Promise((resolve) => {
        releaseCheckout = resolve;
      });
      await payment.getByRole("button", { name: "متابعة الدفع", exact: true }).click();
      await payment
        .getByRole("button", { name: "جاري تجهيز الدفع…", exact: true })
        .waitFor();
      assert.equal(
        await payment
          .getByRole("button", { name: "جاري تجهيز الدفع…", exact: true })
          .isDisabled(),
        true,
      );
      await page.waitForFunction(() => document.querySelector('[aria-busy="true"]'));
      releaseCheckout();
      const dialog = page.getByRole("dialog", { name: "دفع قيمة الطلب", exact: true });
      await dialog.waitFor();
      assert.equal(page.url(), base + "/tracking?order=532");
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
      await page
        .frameLocator('iframe[title="نموذج بوابة الدفع"]')
        .getByText("نموذج تجريبي للبوابة")
        .waitFor();
      assert.equal(calls.length, before + 1);
      assert.deepEqual(calls.at(-1), { order_id: 532, payment_brand: brand });
      const frame = page.frameLocator('iframe[title="نموذج بوابة الدفع"]');
      assert.equal(await frame.locator("form").getAttribute("data-brands"), brand);
      assert.equal(
        await frame.locator("form").getAttribute("action"),
        base + "/payment-result?order=532&checkout_id=fixture.prod01",
      );
      const widgetFrame = page.frames().find((frame) => frame.parentFrame());
      const options = await widgetFrame.evaluate(() => window.optionsAtWidgetLoad);
      if (brand === "APPLEPAY") {
        assert.deepEqual(options.applePay, {
          displayName: "Shiny Carpet",
          total: { label: "Shiny Carpet", amount: "40.25" },
        });
        await payment.getByText("لاستخدام Apple Pay،", { exact: false }).waitFor();
        assert.ok(
          (await frame.locator("script[src]").getAttribute("src")).startsWith(
            "https://eu-test.oppwa.com/",
          ),
        );
      } else {
        assert.equal(options.applePay, undefined);
      }
      assert.equal(status, "arrived_to_customer_again");
      if (brand === "MADA") {
        await dialog
          .getByRole("button", { name: "إغلاق نافذة الدفع", exact: true })
          .focus();
        await page.keyboard.press("Escape");
      } else {
        await dialog
          .getByRole("button", { name: "إغلاق نافذة الدفع", exact: true })
          .click();
      }
      await dialog.waitFor({ state: "hidden" });
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
    }
    const madaBox = await payment
      .getByRole("radio", { name: "مدى", exact: true })
      .boundingBox();
    const tamaraBox = await payment
      .getByRole("radio", { name: "تمارا", exact: true })
      .boundingBox();
    assert.ok(Math.abs(madaBox.y - tamaraBox.y) < 2);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    if (process.env.PAYMENT_SCREENSHOT)
      await payment.screenshot({ path: process.env.PAYMENT_SCREENSHOT });
    await page.goto(base + "/order-confirmation?order=532");
    await page.getByRole("region", { name: "دفع قيمة الطلب" }).waitFor();
    await page.goto(base + "/tracking?order=532");
    await payment.waitFor();
    await page.clock.install();
    await payment.getByRole("button", { name: "متابعة الدفع", exact: true }).click();
    await page.getByRole("dialog", { name: "دفع قيمة الطلب", exact: true }).waitFor();
    const resultFrame = page.frameLocator('iframe[title="نموذج بوابة الدفع"]');
    await resultFrame.getByText("نموذج تجريبي للبوابة", { exact: false }).waitFor();
    await resultFrame
      .locator("body")
      .evaluate(() =>
        parent.postMessage(
          { type: "shiny-payment-return", orderId: 532, checkoutId: "wrong-checkout" },
          parent.location.origin,
        ),
      );
    assert.equal(statusCalls.length, 0);
    await resultFrame.getByRole("link", { name: "إتمام الاختبار", exact: true }).click();
    await payment.getByRole("status").filter({ hasText: "الدفع قيد المعالجة" }).waitFor();
    assert.equal(statusCalls.length, 1);
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(page.url(), base + "/tracking?order=532");
    assert.equal(
      await payment
        .getByRole("button", { name: "متابعة الدفع", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      await payment
        .getByRole("button", { name: "إعادة التحقق بعد قليل", exact: true })
        .isDisabled(),
      true,
    );
    await page.clock.fastForward(31_000);
    verificationResult = "failed";
    await payment
      .getByRole("button", { name: "تحقق من حالة الدفع", exact: true })
      .click();
    await payment.getByRole("status").filter({ hasText: "لم تتم عملية الدفع" }).waitFor();
    assert.equal(statusCalls.length, 2);
    await payment.getByRole("button", { name: "متابعة الدفع", exact: true }).click();
    await page.getByRole("dialog", { name: "دفع قيمة الطلب", exact: true }).waitFor();
    verificationResult = "paid";
    await page
      .frameLocator('iframe[title="نموذج بوابة الدفع"]')
      .getByRole("link", { name: "إتمام الاختبار", exact: true })
      .click();
    await page.getByRole("status").filter({ hasText: "تم تأكيد الدفع بنجاح" }).waitFor();
    assert.equal(statusCalls.length, 3);
    assert.equal(status, "paid");
    await page.goto(
      base + "/tracking?order=532&resourcePath=%2Fv1%2Fcheckouts%2Ffixture%2Fpayment",
    );
    await page.getByRole("heading", { name: "منتجات الطلب", exact: true }).waitFor();
    assert.equal(await page.getByRole("region", { name: "دفع قيمة الطلب" }).count(), 0);
    status = "arrived_to_customer_again";
    verificationResult = "pending";
    await page.goto(base + "/payment-result?order=532&checkout_id=fixture.prod01");
    await page.waitForURL(base + "/tracking?order=532&checkout_id=fixture.prod01");
    await payment.getByRole("status").filter({ hasText: "الدفع قيد المعالجة" }).waitFor();
    assert.equal(statusCalls.length, 4);
    // The approved query alone cannot mark an unpaid order as paid.
    await page.goto(base + "/tracking?order=532&payment_status=approved");
    await page.getByRole("status").filter({ hasText: "في انتظار تأكيد الدفع" }).waitFor();
    await payment.waitFor();
    assert.equal(tamaraCalls.length, 0);
    assert.equal(statusCalls.length, 4);
    status = "paid";
    await page.getByRole("button", { name: "تحديث حالة الطلب", exact: true }).click();
    await page.getByRole("region", { name: "حالة الدفع", exact: true }).waitFor();
    assert.equal(await payment.count(), 0);
    // A saved Tamara reference triggers verification; pending stays unpaid.
    status = "arrived_to_customer_again";
    await page.evaluate(() =>
      sessionStorage.setItem("shiny-tamara:+201012345678:532", "reference-532"),
    );
    await page.goto(base + "/tracking?order=532&payment_status=approved");
    await payment
      .getByRole("status")
      .filter({ hasText: "لم يتم تأكيد نتيجة الدفع" })
      .waitFor();
    assert.equal(tamaraCalls.length, 1);
    await page.clock.fastForward(31_000);
    tamaraPaid = true;
    await payment.getByRole("button", { name: "تحقق من دفع تمارا", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "تم تأكيد الدفع بنجاح" }).waitFor();
    assert.equal(tamaraCalls.length, 2);
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("shiny-tamara:+201012345678:532")),
      null,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: payment flows, Tamara approved return with and without a saved reference, pending verification, manual refresh and backend-confirmed paid status.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
