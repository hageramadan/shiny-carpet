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
      area_id: 22,
      governorate_id: 37,
      district_id: 105,
      governorate_name: "القاهرة",
      city_name: "المعادي",
      lat: 32.0444,
      lng: 35.2357,
      notes: "افتح لما توصل",
      is_default: false,
    };
    let areasGate = Promise.resolve();
    let failAreas = true;
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
      if (path === "/api/areas" && failAreas) {
        failAreas = false;
        return respond({ message: "تعذر تحميل المناطق" }, 503);
      }
      if (path === "/api/areas") {
        await areasGate;
        return respond({
          result: true,
          data: [
            {
              id: 22,
              name: "منطقة الاختبار",
              governorates: [
                { id: 37, name: "القاهرة", districts: [{ id: 105, name: "المعادي" }] },
              ],
            },
            {
              id: 23,
              name: "منطقة أخرى",
              governorates: [
                { id: 38, name: "محافظة أخرى", districts: [{ id: 106, name: "حي آخر" }] },
              ],
            },
          ],
        });
      }
      if (path === "/api/settings") return respond({ result: true, data: {} });
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
        assert.equal(data.governorate_id, 37);
        assert.equal(data.area_id, 22);
        assert.equal(data.district_id, 105);
        assert.equal(data.governorate_name, undefined);
        assert.equal(data.notes, "ملاحظة جديدة");
        rows = rows.map((row) =>
          row.id === 5 ? { ...row, title: data.title, notes: data.notes } : row,
        );
        return respond({ result: true, data: { address: rows[0] } });
      }
      if (path === "/api/addresses" && method === "POST") {
        const data = request.postDataJSON();
        assert.equal(data.title, "البيت");
        assert.equal(data.governorate_id, 37);
        assert.equal(data.area_id, 22);
        assert.equal(data.district_id, 105);
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
    async function chooseLocation(label, id) {
      const names = {
        22: "منطقة الاختبار",
        23: "منطقة أخرى",
        37: "القاهرة",
        38: "محافظة أخرى",
        105: "المعادي",
      };
      await page.getByRole("button", { name: label, exact: true }).click();
      await page.getByRole("menuitemradio", { name: names[id], exact: false }).click();
    }
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
    await page.getByRole("button", { name: "إعادة تحميل المناطق", exact: true }).click();
    await chooseLocation("المدينة", "105");
    assert.equal(await page.locator('input[name="areaId"]').inputValue(), "22");
    assert.equal(await page.locator('input[name="governorateId"]').inputValue(), "37");
    assert.deepEqual(
      await page
        .locator("form")
        .first()
        .locator("label")
        .allTextContents()
        .then((labels) => labels.map((label) => label.trim())),
      [
        "اسم العنوان",
        "المحافظة / المنطقة",
        "المدينة",
        "اسم الشارع",
        "رقم المبنى",
        "الدور",
        "الشقة",
        "تفاصيل إضافية",
        "ملاحظات",
      ],
    );
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
    let releaseAreas;
    areasGate = new Promise((resolve) => {
      releaseAreas = resolve;
    });
    await page.getByRole("link", { name: "+ إضافة عنوان", exact: true }).click();
    const loading = page.getByRole("status", {
      name: "جاري تحميل بيانات العنوان",
      exact: true,
    });
    await loading.waitFor();
    assert.equal(await loading.locator(".animate-spin").count(), 1);
    assert.equal(await page.getByLabel("اسم العنوان", { exact: true }).count(), 0);
    assert.equal(
      await page.getByRole("button", { name: "استخدم موقعي الحالي" }).count(),
      0,
    );
    releaseAreas();
    await loading.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "استخدم موقعي الحالي" }).click();
    await page.getByText("موقع الاختبار", { exact: true }).waitFor();
    await chooseLocation("المحافظة / المنطقة", "37");
    await chooseLocation("المدينة", "105");
    await chooseLocation("المحافظة / المنطقة", "38");
    assert.equal(await page.locator('input[name="governorateId"]').inputValue(), "38");
    assert.equal(await page.locator('input[name="districtId"]').inputValue(), "");
    assert.equal(
      await page.getByRole("button", { name: "حفظ العنوان", exact: true }).isDisabled(),
      true,
    );
    await chooseLocation("المحافظة / المنطقة", "37");
    await chooseLocation("المدينة", "105");
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
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("shiny-carpet-demo-v1")).addresses,
      ),
      [{ id: "legacy", label: "عنوان قديم" }],
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
      "PASS: addresses API list/retry, ignored local records, PUT server values, API location dropdowns, dependent selection resets, create with selected IDs and coordinates, checkout selection, deletion cancel/failure/recovery, profile sync and expired session",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
