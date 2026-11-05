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
    const otherProducts = ["البطانيات", "الزل", "ستاير", "لباد"].map((name, i) => ({
      id: 12 + i,
      name,
      description: name,
      category: { id: 17 + i, name },
      has_sizes: i === 0 ? 1 : 0,
      price: 20,
      min_price_before_discount: 20,
      images: [],
      sizes: i === 0 ? [{ id: 678, name: "شخصين", price_before_discount: 20 }] : [],
    }));
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
      if (path === "/api/areas") return respond({ result: true, data: [] });
      if (path === "/api/settings") return respond({ result: true, data: {} });
      calls.push({ path, method, body: request.postData() });
      if (path === "/api/categories") return respond({ success: true, data: [] });
      const otherProduct = otherProducts.find((p) => path === "/api/products/" + p.id);
      if (otherProduct) return respond({ success: true, data: otherProduct });
      if (otherProducts.some((p) => path === "/api/products/category/" + p.category.id))
        return respond({ success: true, data: [] });
      if (path === "/api/cart/add" && request.postDataJSON().product_id !== 11) {
        const input = request.postDataJSON();
        const p = otherProducts.find((p) => p.id === input.product_id);
        assert.ok(p);
        assert.equal(input.length, undefined);
        assert.equal(input.width, undefined);
        const row = {
          id: id++,
          quantity: input.quantity,
          price: 20 * input.quantity,
          length: null,
          width: null,
          number_of_person: p.id === 12 ? 2 : null,
          product: { id: p.id, name: p.name, images: [] },
          product_size: input.product_size_id ? { id: input.product_size_id } : null,
        };
        items.push(row);
        return respond({ success: true, data: { ...totals(), added_item: row } });
      }
      if (path === "/api/products/11") return respond({ success: true, data: product });
      if (path === "/api/products/category/16")
        return respond({
          success: true,
          data: [
            product,
            {
              ...product,
              id: 99,
              name: "سجاد مشابه",
              description: "وصف المنتج القادم من API",
            },
          ],
        });
      if (path === "/api/products/11/custom")
        return respond({ success: true, data: { price: 400 } });
      assert.equal(request.headers().authorization, "Bearer fixture-cart-token", path);
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
      if (/^\/api\/cart\/\d+$/.test(path) && method === "DELETE") {
        const rowId = Number(path.split("/").pop());
        items = items.filter((item) => item.id !== rowId);
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
    await page.getByRole("heading", { name: product.name, exact: true }).waitFor();
    await page.locator("main p").filter({ hasText: product.description }).waitFor();
    assert.equal(
      await page.getByRole("heading", { name: "منتجات من نفس الخدمة" }).count(),
      0,
    );
    assert.equal(await page.getByRole("contentinfo").count(), 0);
    await page.getByRole("button", { name: "أضف إلى السلة", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "تمت إضافة القطعة" }).waitFor();
    await page.getByRole("button", { name: "تمت الإضافة — أضف منتج آخر" }).waitFor();
    assert.equal(await page.getByText("3 × 5 متر", { exact: true }).count(), 0);
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
    await page.getByText("مقاس آخر", { exact: true }).click();
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
      .press("Enter");
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
    await page.getByRole("button", { name: "حذف سجاد الاختبار من السلة" }).click();
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
    for (const p of otherProducts) {
      await page.goto(base + "/products/" + p.id);
      await page.getByRole("heading", { name: p.name, exact: true }).waitFor();
      assert.equal(await page.getByText("مقاس آخر", { exact: true }).count(), 0);
      if (p.has_sizes) await page.getByText("شخصين", { exact: true }).waitFor();
      await page.getByRole("button", { name: "أضف إلى السلة", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "يمكنك زيادة العدد" }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: "زيادة الكمية", exact: true }).count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: "أضف إلى السلة", exact: true }).count(),
        0,
      );
      await page.reload();
      await page.getByRole("status").filter({ hasText: "يمكنك زيادة العدد" }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: "أضف إلى السلة", exact: true }).count(),
        0,
      );
    }
    expire = true;
    await page.goto(base + "/cart");
    await page
      .getByText("سجّل الدخول لعرض سلتك وإضافة المنتجات.", { exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("shiny-carpet-auth-session")),
      null,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: guest gating, ignored legacy cart, fixed/custom API adds, authoritative line prices, quantity failure/retry, row IDs, removal, count, refresh-only recovery and expired-session cleanup, minimal product details and single-add controls in other categories",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
