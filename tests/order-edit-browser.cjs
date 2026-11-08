const assert = require("node:assert/strict");
const fs = require("node:fs/promises"),
  path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
const money = (value) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value) + " ر.س";
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }),
      calls = [],
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() =>
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-edit",
          profile: { name: "حساب الاختبار", phone: "+201012345678", email: "" },
        }),
      ),
    );
    const products = [
      {
        id: 11,
        name: "سجاد الاختبار",
        description: "وصف السجاد",
        category: { id: 16, name: "غسيل سجاد" },
        has_sizes: 1,
        min_price_before_discount: 60,
        price_per_unit: 10,
        images: [],
        sizes: [
          { id: 74, length: 2, width: 3, price_before_discount: 60 },
          { id: 75, length: 3, width: 4, price_before_discount: 120 },
        ],
      },
      {
        id: 71,
        name: "سجاد إضافي",
        description: "خدمة إضافية",
        category: { id: 16, name: "غسيل سجاد" },
        has_sizes: 1,
        min_price_before_discount: 20,
        price_per_unit: 10,
        images: [],
        sizes: [{ id: 174, length: 1, width: 2, price_before_discount: 20 }],
      },
    ];
    let rowId = 526,
      failQuantity = true,
      failPhotos = true,
      failRead = false,
      photoWrites = 0;
    const order = {
      id: 369,
      status: "ordered",
      can_edit: true,
      is_received: false,
      user_paid: false,
      created_at: "2026-11-08 10:00:00",
      phone: "+966551234567",
      address: {
        id: 19,
        title: "البيت",
        street: "شارع الاختبار",
        building_number: "5",
        city: { name: "الرياض" },
      },
      note: "الملاحظة الأصلية",
      coupon_code: null,
      discount: 0,
      delivery_fee: 10,
      items: [
        {
          id: 524,
          quantity: 1,
          price: 60,
          length: 2,
          width: 3,
          product: { id: 11, name: "سجاد الاختبار", images: [] },
          product_size: { id: 74 },
        },
        {
          id: 525,
          quantity: 1,
          price: 25,
          length: null,
          width: null,
          product: { id: 47, name: "لباد الاختبار", images: [] },
          product_size: null,
        },
      ],
      order_images: [
        "https://admin.shinycarpet-sa.com/storage/order_images/original.png",
      ],
    };
    function snapshot() {
      const subtotal = order.items.reduce((sum, row) => sum + row.price, 0),
        tax = Math.round((subtotal - order.discount) * 15) / 100;
      return {
        ...order,
        subtotal,
        vat_amount: tax,
        total: subtotal - order.discount + tax + order.delivery_fee,
      };
    }
    function field(req, name) {
      const text = req.postDataBuffer()?.toString("utf8") ?? "";
      return text.match(new RegExp('name="' + name + '"\\r\\n\\r\\n([^]*?)\\r\\n'))?.[1];
    }
    await page.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        p = url.pathname,
        m = req.method(),
        lang = req.headers()["accept-language"];
      const respond = (data, status = 200) =>
        route.fulfill({
          status,
          json: {
            success: status === 200,
            result: status === 200,
            data,
            ...(status !== 200 ? { message: data.message } : {}),
          },
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
            "access-control-allow-headers": "content-type,authorization,accept-language",
          },
        });
      if (m === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,PUT,DELETE",
            "access-control-allow-headers": "content-type,authorization,accept-language",
          },
        });
      calls.push({ p, m, body: req.postData() });
      if (p === "/api/settings") return respond({});
      if (p === "/api/categories")
        return respond([
          { id: 16, name: lang === "en" ? "Carpet cleaning" : "غسيل سجاد", image: null },
        ]);
      if (p === "/api/products/category/16") return respond(products);
      if (/^\/api\/products\/\d+$/.test(p))
        return respond(
          products.find((product) => product.id === Number(p.split("/").pop())),
        );
      assert.equal(req.headers().authorization, "Bearer fixture-edit");
      assert.ok(["ar", "en"].includes(lang));
      if (p === "/api/count") return respond({ item_count: 0 });
      if (p === "/api/cart")
        return respond({
          cart_items: [],
          cart_subtotal: 0,
          vat_percentage: 15,
          vat_amount: 0,
          cart_total: 0,
        });
      if (p === "/api/addresses") return respond({ addresses: [] });
      if (p === "/api/orders") return respond([snapshot()]);
      if (p === "/api/orders/369" && m === "GET") {
        if (failRead) {
          failRead = false;
          return respond({ message: "فشل تحديث العرض للاختبار" }, 503);
        }
        return respond(snapshot());
      }
      if (p === "/api/orders/369/items" && m === "POST") {
        const input = req.postDataJSON();
        assert.equal(input._method, "put");
        assert.equal(input.product_id, 71);
        assert.equal(input.product_size_id, 174);
        assert.equal(input.length, undefined);
        assert.equal(input.width, undefined);
        assert.equal(input.quantity, 1);
        order.items.push({
          id: rowId++,
          quantity: 1,
          price: 20,
          length: 1,
          width: 2,
          product: { id: 71, name: "سجاد إضافي", images: [] },
          product_size: { id: 174 },
        });
        return respond({});
      }
      const match = p.match(/^\/api\/orders\/369\/items\/(\d+)$/);
      if (match) {
        const id = Number(match[1]);
        const row = order.items.find((item) => item.id === id);
        assert.ok(row);
        if (m === "DELETE") {
          assert.equal(req.postData(), null);
          order.items = order.items.filter((item) => item.id !== id);
          return respond({});
        }
        assert.equal(m, "POST");
        assert.equal(field(req, "_method"), "put");
        if (field(req, "product_size_id")) {
          assert.ok(!field(req, "length"));
          assert.ok(!field(req, "width"));
        }
        if (field(req, "length")) assert.ok(!field(req, "product_size_id"));
        assert.ok(
          req.headers()["content-type"].startsWith("multipart/form-data; boundary="),
        );
        if (failQuantity) {
          failQuantity = false;
          return respond({ message: "تعذر حفظ الكمية للاختبار" }, 422);
        }
        const unit = row.price / row.quantity;
        row.quantity = Number(field(req, "quantity"));
        row.price = unit * row.quantity;
        if (field(req, "length")) {
          row.length = Number(field(req, "length"));
          row.width = Number(field(req, "width"));
          row.product_size = null;
          row.price = row.length * row.width * 10 * row.quantity;
        }
        return respond({});
      }
      if (p === "/api/orders/369/update-coupon") {
        assert.equal(m, "POST");
        const code = req.postDataJSON().coupon_code;
        if (code === "BAD") return respond({ message: "الكوبون غير صالح للاختبار" }, 422);
        assert.equal(code, "GOOD");
        order.coupon_code = code;
        order.discount = 10;
        return respond({});
      }
      if (p === "/api/orders/369/images") {
        assert.equal(m, "POST");
        assert.equal(field(req, "_method"), "put");
        photoWrites++;
        assert.ok(req.postData().includes('name="images[]"'));
        assert.equal(field(req, "note"), "ملاحظة التعديل");
        if (failPhotos) {
          failPhotos = false;
          return respond({ message: "فشل حفظ الصور للاختبار" }, 422);
        }
        order.note = field(req, "note");
        order.order_images.push(
          "https://admin.shinycarpet-sa.com/storage/order_images/new.png",
        );
        failRead = true;
        return respond({});
      }
      if (p === "/api/orders/369/cancel") {
        assert.equal(m, "POST");
        order.status = "cancelled";
        return respond(snapshot());
      }
      throw Error("Unexpected request " + m + " " + p);
    });
    await page.route("**/storage/order_images/**", (route) =>
      route.fulfill({
        path: path.resolve("public/images/carpet1.png"),
        contentType: "image/png",
      }),
    );
    await page.goto(base + "/orders");
    await page.getByRole("link", { name: "تعديل الطلب 369", exact: true }).waitFor();
    await page.goto(base + "/order-confirmation?order=369");
    // The confirmation route may use a different query field; the tracking entry is canonical.
    await page.goto(base + "/tracking?order=369");
    await page.getByRole("link", { name: "تعديل الطلب", exact: true }).click();
    await page.waitForURL("**/orders/369/edit");
    const line = (name) =>
      page
        .getByRole("article")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await line("سجاد الاختبار").waitFor();
    const screenshotDir = process.env.ORDER_EDIT_SCREENSHOT_DIR;
    if (screenshotDir) {
      await fs.mkdir(screenshotDir, { recursive: true });
      await page.screenshot({
        path: path.join(screenshotDir, "items-mobile.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: path.join(screenshotDir, "items-desktop.png"),
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await line("سجاد الاختبار")
      .getByRole("button", { name: "زيادة الكمية", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "تعذر حفظ الكمية للاختبار" })
      .waitFor();
    assert.equal(order.items[0].quantity, 1);
    await line("سجاد الاختبار")
      .getByRole("button", { name: "زيادة الكمية", exact: true })
      .click();
    await page
      .locator("aside")
      .getByText(money(snapshot().total), { exact: true })
      .waitFor();
    assert.equal(order.items[0].quantity, 2);
    await line("سجاد الاختبار")
      .getByRole("button", { name: "تعديل المنتج", exact: true })
      .click();
    await page.getByRole("button", { name: "حفظ تعديل المنتج", exact: true }).click();
    await line("سجاد الاختبار").waitFor();
    await line("سجاد الاختبار")
      .getByRole("button", { name: "تعديل المنتج", exact: true })
      .click();
    await page.getByText("مقاس آخر", { exact: true }).click();
    await page.getByLabel("الطول", { exact: true }).fill("3");
    await page.getByLabel("العرض", { exact: true }).fill("4");
    await page.getByRole("button", { name: "حفظ تعديل المنتج", exact: true }).click();
    await line("سجاد الاختبار").waitFor();
    assert.equal(order.items[0].width, 4);
    await page.getByRole("button", { name: "إضافة منتج", exact: true }).click();
    await page.getByRole("button", { name: /سجاد إضافي/ }).click();
    await page.getByRole("button", { name: "إضافة إلى الطلب", exact: true }).click();
    await line("سجاد إضافي").waitFor();
    assert.equal(order.items.length, 3);
    await line("لباد الاختبار").getByRole("button", { name: "حذف", exact: true }).click();
    const deleteDialog = page.getByRole("alertdialog", { name: "تأكيد حذف المنتج" });
    await deleteDialog
      .getByRole("heading", { name: "هل تريد الحذف؟", exact: true })
      .waitFor();
    assert.equal(await deleteDialog.evaluate((dialog) => dialog.matches(":modal")), true);
    const deletesBeforeCancel = calls.filter((call) => call.m === "DELETE").length;
    await deleteDialog.getByRole("button", { name: "إلغاء", exact: true }).click();
    await deleteDialog.waitFor({ state: "detached" });
    assert.equal(calls.filter((call) => call.m === "DELETE").length, deletesBeforeCancel);
    await line("لباد الاختبار").getByRole("button", { name: "حذف", exact: true }).click();
    await deleteDialog.waitFor();
    await page.keyboard.press("Escape");
    await deleteDialog.waitFor({ state: "detached" });
    await line("لباد الاختبار").getByRole("button", { name: "حذف", exact: true }).click();
    await page
      .getByRole("alertdialog", { name: "تأكيد حذف المنتج" })
      .getByRole("button", { name: "تأكيد الحذف" })
      .click();
    await line("لباد الاختبار").waitFor({ state: "detached" });
    assert.equal(order.items.length, 2);
    await page.getByRole("button", { name: "التالي", exact: true }).click();
    if (screenshotDir) {
      await page.screenshot({
        path: path.join(screenshotDir, "review-mobile.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: path.join(screenshotDir, "review-desktop.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
    }
    await page.getByLabel("كود الخصم", { exact: true }).fill("BAD");
    await page.getByRole("button", { name: "تفعيل", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "الكوبون غير صالح للاختبار" })
      .waitFor();
    await page.getByLabel("كود الخصم", { exact: true }).fill("GOOD");
    await page.getByRole("button", { name: "تفعيل", exact: true }).click();
    await page
      .locator("aside")
      .getByText(money(snapshot().total), { exact: true })
      .waitFor();
    assert.equal(order.coupon_code, "GOOD");
    await page.getByLabel("ملاحظات الطلب", { exact: true }).fill("ملاحظة التعديل");
    await page
      .getByLabel("اختيار صور الطلب", { exact: true })
      .setInputFiles(path.resolve("public/images/carpet1.png"));
    await page.getByRole("button", { name: "حفظ التعديلات", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "فشل حفظ الصور للاختبار" }).waitFor();
    assert.equal(
      await page.getByLabel("ملاحظات الطلب", { exact: true }).inputValue(),
      "ملاحظة التعديل",
    );
    await page.getByRole("button", { name: "حفظ التعديلات", exact: true }).click();
    await page
      .getByRole("button", { name: "إعادة تحميل بيانات الطلب", exact: true })
      .waitFor();
    assert.equal(photoWrites, 2);
    await page
      .getByRole("button", { name: "إعادة تحميل بيانات الطلب", exact: true })
      .click();
    await page
      .getByRole("button", { name: "إعادة تحميل بيانات الطلب", exact: true })
      .waitFor({ state: "detached" });
    assert.equal(photoWrites, 2);
    await page.getByRole("button", { name: "حفظ التعديلات", exact: true }).click();
    await page.waitForURL("**/tracking?order=369");
    await page.getByText("ملاحظة التعديل", { exact: true }).waitFor();
    assert.equal(order.order_images.length, 2);
    assert.equal(photoWrites, 2);
    await page.getByRole("link", { name: "تعديل الطلب", exact: true }).click();
    await line("سجاد الاختبار").waitFor();
    order.status = "picked_up_from_customer";
    const writes = calls.filter((call) =>
      ["PUT", "POST", "DELETE"].includes(call.m),
    ).length;
    await line("سجاد الاختبار")
      .getByRole("button", { name: "زيادة الكمية", exact: true })
      .click();
    await page
      .getByText("لم يعد تعديل هذا الطلب متاحًا. راجع حالته من صفحة التفاصيل.", {
        exact: true,
      })
      .waitFor();
    assert.equal(
      calls.filter((call) => ["PUT", "POST", "DELETE"].includes(call.m)).length,
      writes,
    );
    await page.goto(base + "/orders");
    await page.getByRole("link", { name: "عرض تفاصيل الطلب 369" }).waitFor();
    assert.equal(await page.getByRole("link", { name: "تعديل الطلب 369" }).count(), 0);
    order.status = "confirmed";
    await page.goto(base + "/orders/369/edit");
    await page.getByRole("button", { name: "إلغاء الطلب", exact: true }).click();
    await page
      .getByRole("alertdialog", { name: "تأكيد إلغاء الطلب" })
      .getByRole("button", { name: "تأكيد إلغاء الطلب", exact: true })
      .click();
    await page.waitForURL("**/tracking?order=369");
    assert.equal(order.status, "cancelled");
    assert.equal(
      await page.getByRole("link", { name: "تعديل الطلب", exact: true }).count(),
      0,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: edit eligibility, quantity failure/retry, custom dimensions, add to order, delete row IDs, coupon validation, append photos/notes, refresh-only recovery, pickup race and cancellation",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
