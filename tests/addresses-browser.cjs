const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3107";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      geolocation: { latitude: 32.0444, longitude: 35.2357 },
      permissions: ["geolocation"],
    });
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("address-test-seeded")) {
        sessionStorage.setItem("address-test-seeded", "1");
        localStorage.setItem(
          "shiny-carpet-demo-v1",
          JSON.stringify({
            addresses: [{ id: "legacy", label: "عنوان قديم" }],
            orders: [],
          }),
        );
      }
    });
    const row = {
      id: 5,
      title: "العمل",
      street: "شارع النصر",
      building_number: "12",
      floor: "3",
      apartment: "10",
      details: "بجوار المسجد",
      governorate_name: "القاهرة",
      city_name: "المعادي",
      lat: 32.0444,
      lng: 35.2357,
      notes: "افتح لما توصل",
      is_default: false,
    };
    let rows = [row],
      failLoad = true,
      failDelete = true,
      expire = false,
      failRefresh = false;
    const calls = [],
      errors = [];
    await context.route("**://*.tile.openstreetmap.org/**", (route) => route.abort());
    await context.route("**/api/locations?**", (route) =>
      route.fulfill({
        json: {
          places: [
            {
              id: "fixture",
              label: "موقع الاختبار",
              lat: 32.0444,
              lng: 35.2357,
              region: "القاهرة",
              city: "المعادي",
              street: "شارع النصر",
              building: "12",
              country: "مصر",
              postalCode: "",
            },
          ],
        },
      }),
    );
    await context.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const request = route.request(),
        path = new URL(request.url()).pathname,
        method = request.method();
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PUT,DELETE",
        "access-control-allow-headers": "content-type,authorization,accept-language",
      };
      const respond = (body, status = 200) =>
        route.fulfill({ status, json: body, headers });
      if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/categories") return respond({ success: true, data: [] });
      assert.equal(request.headers().authorization, "Bearer fixture-address-token");
      assert.equal(request.headers()["accept-language"], "ar");
      calls.push({ path, method, body: request.postData() });
      if (path === "/api/cart")
        return respond({
          success: true,
          data: {
            cart_items: [
              {
                id: 24,
                quantity: 1,
                price: 100,
                length: null,
                width: null,
                number_of_person: 1,
                product: { id: 11, name: "منتج الاختبار", images: [] },
                product_size: null,
              },
            ],
            cart_subtotal: 100,
            vat_percentage: 14,
            vat_amount: 14,
            cart_total: 114,
          },
        });
      if (path === "/api/count")
        return respond({ success: true, data: { item_count: 1 } });
      if (path === "/api/profile")
        return respond({
          status: "success",
          data: {
            id: 1,
            name: "حساب الاختبار",
            phone: "1012345678",
            country_code: "+20",
            image: null,
          },
        });
      if (path === "/api/addresses" && method === "GET") {
        if (expire) return respond({ message: "Unauthenticated" }, 401);
        if (failLoad) {
          failLoad = false;
          return respond({ message: "تعذر تحميل العناوين" }, 503);
        }
        if (failRefresh) {
          failRefresh = false;
          return respond({ message: "تعذر التحميل" }, 503);
        }
        return respond({ result: true, data: { addresses: rows } });
      }
      if (path === "/api/addresses/5" && method === "PUT") {
        assert.equal(request.headers()["content-type"], "application/json");
        const data = request.postDataJSON();
        assert.equal(data.floor, "4");
        assert.equal(data.governorate_name, "القاهرة");
        assert.equal(data.city_name, "المعادي");
        assert.equal(data.governorate_id, undefined);
        assert.equal(data.notes, "ملاحظة جديدة");
        rows = rows.map((row) =>
          row.id === 5 ? { ...row, title: data.title, notes: data.notes } : row,
        );
        return respond({ result: true, data: { address: rows[0] } });
      }
      if (path === "/api/addresses" && method === "POST") {
        const data = request.postDataJSON();
        assert.equal(data.title, "البيت");
        assert.equal(data.governorate_id, 1);
        assert.equal(data.area_id, 1);
        assert.equal(data.district_id, 10);
        assert.equal(data.lat, 32.0444);
        assert.equal(data.lng, 35.2357);
        assert.equal(data.building_number, "12");
        assert.equal(data.notes, "ملاحظات البيت");
        assert.equal(data.is_default, undefined);
        const created = { ...row, id: 6, title: data.title, notes: data.notes };
        rows.push(created);
        return respond({ result: true, data: { address: created } });
      }
      if (path === "/api/addresses/5" && method === "DELETE") {
        if (failDelete) {
          failDelete = false;
          return respond({ message: "تعذر حذف العنوان" }, 422);
        }
        rows = rows.filter((row) => row.id !== 5);
        failRefresh = true;
        return respond({ result: true, data: [] });
      }
      throw new Error("Unexpected fixture request " + method + " " + path);
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + "/addresses");
    await page.getByRole("link", { name: "سجّل الدخول لعرض عناوينك" }).waitFor();
    assert.equal(calls.length, 0);
    await page.evaluate(() => {
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-address-token",
          profile: { name: "حساب الاختبار", phone: "+201012345678", email: "" },
        }),
      );
      window.dispatchEvent(new Event("shiny-auth-session-change"));
    });
    await page.getByRole("alert").filter({ hasText: "تعذر تحميل العناوين" }).waitFor();
    await page.getByRole("button", { name: "إعادة المحاولة" }).click();
    await page.getByRole("heading", { name: "العمل", exact: true }).waitFor();
    assert.equal(await page.getByText("عنوان قديم", { exact: true }).count(), 0);
    assert.equal(await page.getByText("العنوان الافتراضي", { exact: true }).count(), 0);
    await page.getByRole("link", { name: "تعديل عنوان العمل" }).click();
    await page.getByLabel("الدور", { exact: true }).fill("4");
    await page.getByLabel("اسم العنوان", { exact: true }).fill("عنوان محدث");
    await page.getByLabel("ملاحظات", { exact: true }).fill("ملاحظة جديدة");
    await page.getByRole("button", { name: "حفظ التغييرات" }).click();
    await page.waitForURL(base + "/addresses");
    await page.getByRole("heading", { name: "عنوان محدث", exact: true }).waitFor();
    await page
      .getByRole("article")
      .getByText(/الدور 3/)
      .waitFor();
    await page.goto(base + "/checkout");
    await page.getByRole("link", { name: "+ إضافة عنوان", exact: true }).click();
    await page.getByRole("button", { name: "استخدم موقعي الحالي" }).click();
    await page.getByText("موقع الاختبار", { exact: true }).waitFor();
    await page.getByLabel("اسم العنوان", { exact: true }).fill("البيت");
    await page.getByLabel("ملاحظات", { exact: true }).fill("ملاحظات البيت");
    await page.getByRole("button", { name: "حفظ العنوان", exact: true }).click();
    await page.waitForURL(base + "/checkout?address=6");
    await page.getByText("البيت", { exact: true }).waitFor();
    await page.goto(base + "/addresses");
    await page.getByRole("button", { name: "حذف عنوان عنوان محدث" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(calls.filter((call) => call.method === "DELETE").length, 0);
    await dialog.getByRole("button", { name: "إلغاء", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "حذف عنوان عنوان محدث" }).click();
    await dialog.getByRole("button", { name: "تأكيد الحذف" }).click();
    await dialog.getByRole("alert").filter({ hasText: "تعذر حذف العنوان" }).waitFor();
    assert.equal(rows.length, 2);
    await dialog.getByRole("button", { name: "تأكيد الحذف" }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.getByRole("alert").filter({ hasText: "تم تنفيذ العملية" }).waitFor();
    const deletes = calls.filter((call) => call.method === "DELETE").length;
    await page.getByRole("button", { name: "إعادة المحاولة" }).click();
    await page.getByRole("heading", { name: "البيت", exact: true }).waitFor();
    assert.equal(calls.filter((call) => call.method === "DELETE").length, deletes);
    await page.goto(base + "/profile");
    await page.getByRole("heading", { name: "البيت", exact: true }).waitFor();
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("shiny-carpet-demo-v1")).addresses,
      ),
      undefined,
    );
    expire = true;
    await page.goto(base + "/addresses");
    await page.getByRole("link", { name: "سجّل الدخول لعرض عناوينك" }).waitFor();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("shiny-carpet-auth-session")),
      null,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: addresses API list/retry, ignored local records, PUT server values, create with temporary IDs and coordinates, checkout selection, deletion cancel/failure/recovery, profile sync and expired session",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
