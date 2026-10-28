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
      { ...original, lat: null, lng: null },
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
        const body = request.postDataJSON();
        assert.equal(Object.hasOwn(body, "lat"), false);
        assert.equal(Object.hasOwn(body, "lng"), false);
        const row = { ...original, ...body, lat: null, lng: null, id: 99 };
        rows = [row];
        return send({ result: true, data: { address: row } });
      }
      return send({ message: "Unexpected fixture path: " + path }, 404);
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const submit = page.getByRole("button", { name: "إتمام الطلب", exact: true });
    async function assertNoMap() {
      assert.equal(await page.locator(".leaflet-container").count(), 0);
      assert.equal(
        await page
          .getByRole("button", { name: "استخدم موقعي الحالي", exact: true })
          .count(),
        0,
      );
    }
    await page.goto(base + "/checkout");
    await page.getByText("المنزل", { exact: true }).waitFor();
    assert.equal(await submit.isEnabled(), true);
    await assertNoMap();
    await page.getByRole("button", { name: "تغيير / تعديل", exact: true }).click();
    await page.getByRole("radio", { name: /العمل/ }).check();
    assert.equal(await submit.isEnabled(), true);
    await assertNoMap();
    rows = [];
    await page.reload();
    await page.getByLabel("اسم العنوان", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "اختر عنوان الاستلام أولًا", exact: true })
        .isDisabled(),
      true,
    );
    await assertNoMap();
    for (const [field, name] of [
      ["المحافظة / المنطقة", /الرياض/],
      ["المدينة", /العليا/],
    ]) {
      await page.getByRole("button", { name: field, exact: true }).click();
      await page.getByRole("menuitemradio", { name }).click();
    }
    await page.getByLabel("اسم العنوان", { exact: true }).fill("عنوان بدون خريطة");
    await page.getByLabel("اسم الشارع", { exact: true }).fill("شارع الاختبار");
    await page.getByLabel("رقم المبنى", { exact: true }).fill("12");
    await page.getByRole("button", { name: "حفظ العنوان", exact: true }).click();
    await page.getByText("عنوان بدون خريطة", { exact: true }).waitFor();
    assert.equal(page.url(), base + "/checkout");
    assert.equal(await submit.isEnabled(), true);
    await assertNoMap();
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
    }
    await page.goto(base + "/addresses/new?next=%2Fcheckout");
    const mapHeading = page.getByRole("heading", { name: "تحديد الموقع", exact: true });
    const detailsHeading = page.getByRole("heading", {
      name: "تفاصيل العنوان",
      exact: true,
    });
    await mapHeading.waitFor();
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const mapBox = await mapHeading.boundingBox();
      const detailsBox = await detailsHeading.boundingBox();
      if (width < 1024)
        assert.ok(
          mapBox.y < detailsBox.y,
          "Map appears before address details on mobile",
        );
      else
        assert.ok(
          detailsBox.x > mapBox.x,
          "Address details remain on the right on desktop",
        );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: checkout has no map, accepts saved addresses without coordinates, switches addresses, and creates an address without selecting a location.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
