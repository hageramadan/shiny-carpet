const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-orders-token",
          profile: { name: "حساب", phone: "+201012345678", email: "" },
        }),
      );
      localStorage.setItem(
        "shiny-carpet-demo-v1",
        JSON.stringify({ orders: [{ id: "FAKE-ORDER" }] }),
      );
    });
    const item = {
      id: 12,
      quantity: 1,
      price: "800",
      length: 2,
      width: 4,
      product: { id: 8, name: "سجاد الاختبار", images: [] },
      product_size: { id: 11 },
    };
    const order = {
      id: 12,
      status: "ordered",
      subtotal: "800",
      vat_amount: "112",
      total: "912",
      created_at: "2025-07-27 11:59:21",
      items: [item],
      note: "ملاحظة الاختبار",
      order_images: [],
    };
    let created = false,
      failCreate = true,
      failCancel = true,
      cancelled = false;
    let detailStatus = "ordered";
    const calls = [],
      errors = [];
    await context.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        path = url.pathname,
        method = request.method();
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,DELETE",
        "access-control-allow-headers": "content-type,authorization,accept-language",
      };
      const respond = (data, status = 200) =>
        route.fulfill({ status, json: data, headers });
      const ok = (data) => respond({ success: true, data });
      if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/settings") return respond({ result: true, data: {} });
      calls.push({ path, method, body: request.postData(), search: url.search });
      if (path === "/api/categories") return ok([]);
      assert.equal(request.headers().authorization, "Bearer fixture-orders-token");
      if (path === "/api/count") return ok({ item_count: created ? 0 : 1 });
      if (path === "/api/cart")
        return ok({
          cart_items: created ? [] : [item],
          cart_subtotal: 800,
          vat_percentage: 14,
          vat_amount: 112,
          cart_total: 912,
        });
      if (path === "/api/addresses")
        return respond({
          result: true,
          data: {
            addresses: [
              {
                id: 97,
                title: "المنزل",
                street: "شارع الاختبار",
                building_number: "12",
                governorate_name: "الرياض",
                city_name: "الرياض",
                is_default: true,
              },
            ],
          },
        });
      if (path === "/api/cart/apply-coupon") {
        if (request.postData().includes("BAD"))
          return respond({ message: "الكود غير صالح" }, 422);
        return ok({
          cart_subtotal: 800,
          discount: 12,
          vat_percentage: 14,
          vat_amount: 110.32,
          cart_total: 898.32,
          coupon_code: "SERVER12",
        });
      }
      if (path === "/api/orders" && method === "POST") {
        const body = request.postData();
        assert.ok(body.includes('name="address_id"'));
        assert.ok(body.includes("97"));
        assert.ok(body.includes('name="images[]"; filename="rug.png"'));
        assert.ok(body.includes("SERVER12"));
        assert.ok(body.includes('name="note"'));
        assert.ok(!body.includes('name="date"'));
        if (failCreate) {
          failCreate = false;
          return respond({ message: "تعذر إنشاء الطلب للاختبار" }, 422);
        }
        created = true;
        return ok(order);
      }
      if (path === "/api/orders/12/cancel") {
        if (failCancel) {
          failCancel = false;
          return respond({ message: "تعذر الإلغاء للاختبار" }, 422);
        }
        cancelled = true;
        return ok({ ...order, status: "cancelled", items: undefined });
      }
      if (path === "/api/orders/12")
        return ok({ ...order, status: cancelled ? "cancelled" : detailStatus });
      if (path === "/api/orders" && !url.searchParams.has("status"))
        return ok([
          { ...order, id: 13, status: "processing", items: undefined },
          { ...order, id: 14, status: "ready_for_delivery", items: undefined },
          { ...order, id: 15, status: "delivered_to_customer", items: undefined },
          { ...order, id: 16, status: "cancelled", items: undefined },
        ]);
      if (path === "/api/orders")
        return ok(
          url.searchParams.get("status") === (cancelled ? "cancelled" : "ordered")
            ? [
                {
                  ...order,
                  status: cancelled ? "cancelled" : "ordered",
                  items: undefined,
                },
              ]
            : [],
        );
      return respond({ message: "Unexpected fixture path " + path }, 404);
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/checkout");
    await page.getByRole("button", { name: "إتمام الطلب", exact: true }).waitFor();
    await page.getByRole("textbox", { name: "كود الخصم", exact: true }).fill("BAD");
    await page.getByRole("button", { name: "تفعيل", exact: true }).click();
    await page.getByText("الكود غير صالح", { exact: true }).waitFor();
    await page.getByRole("textbox", { name: "كود الخصم", exact: true }).fill("SHINY20");
    await page.getByRole("button", { name: "تفعيل", exact: true }).click();
    await page.getByText("تم تطبيق الكود: SERVER12").waitFor();
    await page.getByRole("textbox", { name: /ملاحظات/ }).fill("ملاحظة الاختبار");
    await page.locator("input[type=file]").setInputFiles({
      name: "rug.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE9sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.getByRole("button", { name: "إتمام الطلب", exact: true }).click();
    await page.getByText("تعذر إنشاء الطلب للاختبار", { exact: true }).waitFor();
    await page.getByRole("button", { name: "إتمام الطلب", exact: true }).click();
    await page.waitForURL("**/order-confirmation?order=12");
    await page.getByText("تم استلام طلبك بنجاح", { exact: true }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "إلغاء الطلب", exact: true }).count(),
      0,
    );
    detailStatus = "delivered_to_customer";
    await page.reload();
    await page.getByText("تم التسليم للعميل", { exact: true }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "إلغاء الطلب", exact: true }).count(),
      0,
    );
    for (const [status, label] of [
      ["processing", "جاري تجهيز الاستلام"],
      ["laundry_received", "جاري التنظيف"],
      ["ready_for_delivery", "جاهز للتوصيل"],
      ["on_way_to_customer_again", "في الطريق إليك"],
      ["paid", "في الطريق إليك"],
    ]) {
      detailStatus = status;
      await page.reload();
      await page.getByRole("region", { name: "مراحل الطلب" }).waitFor();
      assert.equal(await page.locator('[aria-current="step"] h3').innerText(), label);
      assert.equal(
        await page.getByRole("button", { name: "إلغاء الطلب", exact: true }).count(),
        0,
      );
    }
    detailStatus = "confirmed";
    await page.reload();
    await page.getByRole("heading", { name: "منتجات الطلب" }).waitFor();
    await page.getByRole("region", { name: "مراحل الطلب" }).waitFor();
    assert.equal(
      await page
        .locator('[aria-current="step"]')
        .innerText()
        .then((text) => text.includes("جاري تجهيز الاستلام")),
      true,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
    );
    if (process.env.ORDERS_TIMELINE_SCREENSHOTS) {
      await page
        .locator('section[aria-labelledby="order-status-title"]')
        .screenshot({ path: "timeline-mobile.png" });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page
        .locator('section[aria-labelledby="order-status-title"]')
        .screenshot({ path: "timeline-desktop.png" });
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await page.getByRole("button", { name: "إلغاء الطلب", exact: true }).click();
    await page.getByText("تعذر الإلغاء للاختبار", { exact: true }).waitFor();
    await page.getByRole("button", { name: "إلغاء الطلب", exact: true }).click();
    await page.getByText("ملغي", { exact: true }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "إلغاء الطلب", exact: true }).count(),
      0,
    );
    await page.goto(base + "/orders");
    await page.getByRole("link", { name: "عرض تفاصيل الطلب 13", exact: true }).waitFor();
    assert.equal(
      await page.getByRole("link", { name: "عرض تفاصيل الطلب 14", exact: true }).count(),
      1,
    );
    assert.equal(
      await page.getByRole("link", { name: "عرض تفاصيل الطلب 15", exact: true }).count(),
      0,
    );
    assert.equal(
      await page.getByRole("link", { name: "عرض تفاصيل الطلب 16", exact: true }).count(),
      0,
    );
    await page.getByRole("button", { name: "الطلبات الملغاة", exact: true }).click();
    await page.getByRole("link", { name: "عرض تفاصيل الطلب 12" }).waitFor();
    assert.equal(await page.getByText("FAKE-ORDER").count(), 0);
    await page.getByRole("button", { name: "الطلبات السابقة", exact: true }).click();
    await page.getByText("جاري تحميل الطلبات…").waitFor({ state: "hidden" });
    assert.ok(calls.some((call) => call.search === "?status=delivered_to_customer"));
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Orders browser: coupon rejection/success, multipart upload, create retry, confirmation reload, cancellation retry, filters, legacy exclusion and mobile layout passed.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
