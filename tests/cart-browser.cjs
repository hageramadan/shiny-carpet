const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3107";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("cart-test-seeded")) {
        sessionStorage.setItem("cart-test-seeded", "1");
        localStorage.setItem(
          "shiny-carpet-demo-v1",
          JSON.stringify({
            cart: [{ id: "carpet", quantity: 9, size: 1 }],
            profile: { name: "حساب افتراضي" },
            addresses: [],
            orders: [],
          }),
        );
      }
    });
    const product = {
      id: 11,
      name: "سجاد الاختبار",
      description: "سجاد",
      category: { id: 16, name: "غسيل سجاد" },
      has_sizes: 1,
      has_discount: false,
      min_price_before_discount: "1500",
      price_per_unit: "100",
      images: [],
      sizes: [
        {
          id: 673,
          size_type: "meter",
          price_before_discount: 1500,
          length: "3.00",
          width: "5.00",
        },
      ],
    };
    let items = [],
      id = 24,
      failQuantity = true,
      failCartRead = false,
      expire = false;
    let releaseCartRefresh;
    let cartRefreshStarted;
    const calls = [],
      errors = [];
    const totals = () => {
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      return {
        cart_subtotal: subtotal,
        vat_percentage: "14.00",
        vat_amount: subtotal * 0.14,
        cart_total: subtotal * 1.14,
      };
    };
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
      const respond = (body, status = 200) =>
        route.fulfill({ status, json: body, headers });
      if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/settings") return respond({ result: true, data: {} });
      calls.push({ path, method, body: request.postData() });
      if (path === "/api/categories") return respond({ success: true, data: [] });
      if (path === "/api/products/11") return respond({ success: true, data: product });
      if (path === "/api/products/category/16")
        return respond({ success: true, data: [product] });
      if (path === "/api/products/11/custom")
        return respond({ success: true, data: { price: 400 } });
      assert.equal(request.headers().authorization, "Bearer fixture-cart-token");
      assert.equal(request.headers()["accept-language"], "ar");
      if (path === "/api/addresses")
        return respond({ result: true, data: { addresses: [] } });
      if (path === "/api/count")
        return respond({ success: true, data: { item_count: items.length } });
      if (path === "/api/cart" && method === "GET") {
        if (releaseCartRefresh) {
          cartRefreshStarted();
          await releaseCartRefresh;
          releaseCartRefresh = null;
        }
        if (expire) return respond({ message: "Unauthenticated" }, 401);
        if (failCartRead) {
          failCartRead = false;
          return respond({ message: "فشل تحميل السلة" }, 503);
        }
        return respond({ success: true, data: { ...totals(), cart_items: items } });
      }
      if (path === "/api/cart/add") {
        const input = request.postDataJSON();
        assert.equal(input.product_id, 11);
        assert.equal(input.quantity, 1);
        if (input.product_size_id) {
          assert.equal(input.product_size_id, 673);
          assert.equal(input.length, 3);
          assert.equal(input.width, 5);
        } else {
          assert.equal(input.length, 2);
          assert.equal(input.width, 2);
          failCartRead = true;
        }
        const item = {
          id: id++,
          quantity: 1,
          price: input.product_size_id ? 1500 : 400,
          length: input.length,
          width: input.width,
          number_of_person: null,
          product: {
            id: 11,
            name: product.name,
            description: "سجاد",
            images: [],
            price_per_unit: "100",
          },
          product_size: input.product_size_id
            ? { id: 673, size_type: "meter", length: "3.00", width: "5.00" }
            : null,
        };
        items.push(item);
        return respond({ success: true, data: { ...totals(), added_item: item } });
      }
      if (path === "/api/cart/item/24") {
        assert.ok(
          request.headers()["content-type"].startsWith("multipart/form-data; boundary="),
        );
        assert.ok(request.postData().includes("\r\n2\r\n"));
        if (failQuantity) {
          failQuantity = false;
          return respond({ message: "تعذر تحديث الكمية" }, 422);
        }
        items = items.map((item) =>
          item.id === 24 ? { ...item, quantity: 2, price: 3000 } : item,
        );
        return respond({ success: true, data: { ...totals(), updated_item: items[0] } });
      }
      if (path === "/api/cart/24" && method === "DELETE") {
        items = items.filter((item) => item.id !== 24);
        return respond({ success: true });
      }
      if (path === "/api/cart" && method === "DELETE") {
        items = [];
        return respond({ success: true });
      }
      throw new Error("Unexpected fixture request " + method + " " + path);
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/cart");
    await page
      .getByText("سجّل الدخول لعرض سلتك وإضافة المنتجات.", { exact: true })
      .waitFor();
    assert.equal(calls.filter((call) => call.path.startsWith("/api/cart")).length, 0);
    await page.evaluate(() => {
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-cart-token",
          profile: { name: "حساب الاختبار", phone: "+201012345678", email: "" },
        }),
      );
      window.dispatchEvent(new Event("shiny-auth-session-change"));
    });
    await page.getByRole("heading", { name: "سلتك فارغة" }).waitFor();
    assert.equal(await page.getByText("سجاد يدوي", { exact: true }).count(), 0);
    await page.goto(base + "/products/11");
    await page.getByRole("button", { name: "أضف إلى السلة", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "تمت إضافة القطعة" }).waitFor();
    await page.goto(base + "/cart");
    await page.getByRole("button", { name: "زيادة كمية سجاد الاختبار" }).click();
    await page.getByRole("alert").filter({ hasText: "تعذر تحديث الكمية" }).waitFor();
    assert.equal(items[0].quantity, 1);
    let releaseRefresh;
    const refreshStarted = new Promise((resolve) => {
      cartRefreshStarted = resolve;
    });
    releaseCartRefresh = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    await page.getByRole("button", { name: "زيادة كمية سجاد الاختبار" }).click();
    await refreshStarted;
    assert.equal(await page.getByRole("article").count(), 1);
    assert.equal(await page.getByText("جاري تحميل السلة…", { exact: true }).count(), 0);
    assert.equal(
      await page.getByRole("article").getByText("١٬٥٠٠ ر.س", { exact: true }).count(),
      1,
    );
    assert.equal(
      await page.getByRole("button", { name: "زيادة كمية سجاد الاختبار" }).isDisabled(),
      true,
    );
    releaseRefresh();
    await page.getByRole("article").getByText("٣٬٠٠٠ ر.س", { exact: true }).waitFor();
    assert.equal(
      await page.getByRole("link", { name: "السلة، 1 قطع", exact: true }).count(),
      1,
    );
    await page.goto(base + "/checkout");
    await page.getByRole("button", { name: "اختر عنوان الاستلام أولًا" }).waitFor();
    assert.equal(await page.getByText("DEMO10", { exact: false }).count(), 0);
    await page.goto(base + "/products/11");
    await page.getByText("مقاس مخصص", { exact: true }).click();
    await page.getByLabel("الطول", { exact: true }).fill("2");
    await page.getByLabel("العرض", { exact: true }).fill("2");
    await page
      .getByRole("button", { name: "احسب السعر وأضف إلى السلة", exact: true })
      .click();
    await page.getByRole("status").filter({ hasText: "تمت إضافة القطعة" }).waitFor();
    const adds = calls.filter((call) => call.path === "/api/cart/add").length;
    await page
      .getByRole("status")
      .filter({ hasText: "تمت إضافة القطعة" })
      .getByRole("link", { name: "عرض السلة", exact: true })
      .click();
    await page.getByRole("alert").filter({ hasText: "تم تنفيذ العملية" }).waitFor();
    await page.getByRole("button", { name: "إعادة المحاولة" }).click();
    await page
      .getByRole("button", { name: "حذف سجاد الاختبار من السلة" })
      .first()
      .waitFor();
    assert.equal(calls.filter((call) => call.path === "/api/cart/add").length, adds);
    assert.equal(
      await page.getByRole("link", { name: "السلة، 2 قطع", exact: true }).count(),
      1,
    );
    await page
      .getByRole("button", { name: "حذف سجاد الاختبار من السلة" })
      .first()
      .click();
    await page.getByRole("article").getByText("٤٠٠ ر.س", { exact: true }).waitFor();
    assert.equal(items.length, 1);
    assert.equal(items[0].id, 25);
    await page.reload();
    await page.getByRole("button", { name: "إفراغ السلة" }).click();
    await page.getByRole("heading", { name: "سلتك فارغة" }).waitFor();
    assert.equal(
      await page.getByRole("link", { name: "السلة، 0 قطع", exact: true }).count(),
      1,
    );
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("shiny-carpet-demo-v1")).cart[0].quantity,
      ),
      9,
    );
    expire = true;
    await page.reload();
    await page
      .getByText("سجّل الدخول لعرض سلتك وإضافة المنتجات.", { exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("shiny-carpet-auth-session")),
      null,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: guest gating, ignored legacy cart, fixed/custom API adds, authoritative line prices, quantity failure/retry, row IDs, clear, count, refresh-only recovery and expired-session cleanup",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
