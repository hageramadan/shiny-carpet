const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["geolocation"],
      geolocation: { latitude: 24.72, longitude: 46.68 },
    });
    await context.addInitScript(() =>
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-map-token",
          profile: { name: "حساب", phone: "+201012345678", email: "" },
        }),
      ),
    );
    const original = {
      id: 97,
      title: "المنزل",
      street: "شارع الاختبار",
      building_number: "12",
      floor: "2",
      apartment: "4",
      area_id: 22,
      governorate_id: 37,
      district_id: 105,
      governorate_name: "الرياض",
      city_name: "العليا",
      lat: 24.7136,
      lng: 46.6753,
      is_default: true,
    };
    let rows = [
      { ...original },
      { ...original, id: 98, title: "العمل", lat: 24.74, is_default: false },
    ];
    let failSave = true;
    const writes = [],
      errors = [];
    await context.route("https://tile.openstreetmap.org/**", (route) =>
      route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE9sAAAAASUVORK5CYII=",
          "base64",
        ),
      }),
    );
    await context.route("**/api/locations?**", (route) =>
      route.fulfill({
        json: {
          places: [
            {
              id: "fixture",
              label: "موقع الاختبار",
              lat: 24.72,
              lng: 46.68,
              street: "شارع جديد",
              building: "15",
              region: "الرياض",
              city: "العليا",
              country: "السعودية",
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
        "access-control-allow-methods": "GET,POST,PUT",
        "access-control-allow-headers": "content-type,authorization,accept-language",
      };
      const send = (json, status = 200) => route.fulfill({ json, status, headers });
      if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/settings") return send({ result: true, data: {} });
      if (path === "/api/count") return send({ success: true, data: { item_count: 1 } });
      if (path === "/api/cart")
        return send({
          success: true,
          data: {
            cart_items: [
              {
                id: 12,
                quantity: 1,
                price: "35",
                length: 1,
                width: 1,
                product: { id: 8, name: "سجاد الاختبار", images: [] },
                product_size: { id: 11 },
              },
            ],
            cart_subtotal: 35,
            vat_percentage: 15,
            vat_amount: 5.25,
            cart_total: 40.25,
          },
        });
      if (path === "/api/areas")
        return send({
          result: true,
          data: [
            {
              id: 22,
              name: "منطقة الاختبار",
              governorates: [
                { id: 37, name: "الرياض", districts: [{ id: 105, name: "العليا" }] },
              ],
            },
          ],
        });
      if (path === "/api/addresses" && method === "GET")
        return send({ result: true, data: { addresses: rows } });
      if (path === "/api/addresses/97" && method === "PUT") {
        const body = request.postDataJSON();
        writes.push(body);
        if (failSave) {
          failSave = false;
          return send({ result: false, message: "تعذر حفظ الموقع للاختبار" }, 422);
        }
        rows[0] = { ...rows[0], ...body };
        return send({ result: true, data: { address: rows[0] } });
      }
      if (path === "/api/addresses" && method === "POST") {
        const row = { ...original, ...request.postDataJSON(), id: 99 };
        rows = [row];
        return send({ result: true, data: { address: row } });
      }
      return send({ message: "Unexpected fixture path: " + path }, 404);
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const map = page.getByLabel(
      "خريطة اختيار الموقع. اضغط لتحديد نقطة، أو حرّك الخريطة ثم اختر مركزها.",
      { exact: true },
    );
    const submit = page.getByRole("button", { name: "إتمام الطلب", exact: true });
    await page.goto(base + "/checkout");
    await map.waitFor();
    await page.locator('[aria-label="جاري تحميل الموقع"]').waitFor({ state: "hidden" });
    await page.locator(".leaflet-marker-icon").waitFor();
    assert.equal(await submit.isEnabled(), true);
    await map.click({ position: { x: 65, y: 85 } });
    await page.getByRole("button", { name: "حفظ موقع الاستلام", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "أكد موقع الاستلام أولًا", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "إلغاء تغيير الموقع", exact: true }).click();
    assert.equal(await submit.isEnabled(), true);
    await page.getByRole("button", { name: "استخدم موقعي الحالي", exact: true }).click();
    await page.getByRole("button", { name: "حفظ موقع الاستلام", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "تعذر حفظ الموقع للاختبار" })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "أكد موقع الاستلام أولًا", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "حفظ موقع الاستلام", exact: true }).click();
    await page.getByText("تم حفظ موقع الاستلام.", { exact: true }).waitFor();
    assert.equal(await submit.isEnabled(), true);
    assert.equal(writes.length, 2);
    assert.equal(writes[1].lat, 24.72);
    assert.equal(writes[1].lng, 46.68);
    assert.equal(writes[1].street, original.street);
    await page.getByRole("button", { name: "تغيير / تعديل", exact: true }).click();
    await page.getByRole("radio", { name: /العمل/ }).check();
    await page.getByText("24.740000, 46.675300", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (process.env.CHECKOUT_MAP_SCREENSHOT)
      await page.screenshot({
        path: process.env.CHECKOUT_MAP_SCREENSHOT,
        fullPage: true,
      });
    rows = [];
    await page.reload();
    await page.getByLabel("اسم العنوان", { exact: true }).waitFor();
    await map.waitFor();
    await page.getByRole("button", { name: "استخدم موقعي الحالي", exact: true }).click();
    await page.getByText("موقع الاختبار", { exact: true }).waitFor();
    for (const [field, name] of [
      ["المحافظة / المنطقة", /الرياض/],
      ["المدينة", /العليا/],
    ]) {
      await page.getByRole("button", { name: field, exact: true }).click();
      await page.getByRole("menuitemradio", { name }).click();
    }
    await page.getByLabel("اسم العنوان", { exact: true }).fill("عنوان من إتمام الطلب");
    await page.getByRole("button", { name: "حفظ العنوان", exact: true }).click();
    await page.getByText("عنوان من إتمام الطلب", { exact: true }).waitFor();
    assert.equal(page.url(), base + "/checkout");
    assert.equal(await submit.isEnabled(), true);
    assert.equal(rows[0].lat, 24.72);
    rows = [{ ...original, area_id: null, governorate_id: null, district_id: null }];
    await page.reload();
    await map.waitFor();
    await page.getByRole("button", { name: "استخدم موقعي الحالي", exact: true }).click();
    await page
      .getByRole("button", { name: "استكمال بيانات العنوان لحفظ الموقع", exact: true })
      .click();
    await page.getByLabel("اسم العنوان", { exact: true }).waitFor();
    await page.getByText("24.720000, 46.680000", { exact: true }).waitFor();
    for (const [field, name] of [
      ["المحافظة / المنطقة", /الرياض/],
      ["المدينة", /العليا/],
    ]) {
      await page.getByRole("button", { name: field, exact: true }).click();
      await page.getByRole("menuitemradio", { name }).click();
    }
    await page.getByRole("button", { name: "حفظ التغييرات", exact: true }).click();
    await page.getByText("تم حفظ موقع الاستلام.", { exact: true }).waitFor();
    assert.equal(rows[0].lat, 24.72);
    assert.equal(rows[0].area_id, 22);
    assert.equal(await submit.isEnabled(), true);
    assert.equal(page.url(), base + "/checkout");
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: inline checkout map, point selection, cancel, geolocation, failed save and retry, persisted coordinates, address switching, mobile overflow, and inline address creation.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
