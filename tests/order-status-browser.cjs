const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
// Status/flag combinations from the supplied orders response; no customer data.
const rows = [
  { id: 541, status: "paid", user_paid: true, is_received: false, is_rated: false },
  ...[540, 539, 538, 537, 536].map((id) => ({
    id,
    status: "ordered",
    user_paid: false,
    is_received: false,
    is_rated: false,
  })),
  { id: 519, status: "paid", user_paid: true, is_received: true, is_rated: false },
  { id: 518, status: "paid", user_paid: true, is_received: false, is_rated: false },
  { id: 503, status: "paid", user_paid: true, is_received: false, is_rated: false },
  { id: 502, status: "paid", user_paid: true, is_received: true, is_rated: true },
].map((row) => ({
  ...row,
  subtotal: "1.00",
  vat_amount: "0.15",
  total: "1.15",
  created_at: "2026-10-31 00:09:41",
  items: [],
  order_images: [],
}));
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() =>
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "fixture-order-status",
          profile: { name: "حساب", phone: "+201012345678", email: "" },
        }),
      ),
    );
    await context.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const request = route.request(),
        pathname = new URL(request.url()).pathname;
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST",
        "access-control-allow-headers": "content-type,authorization,accept-language",
      };
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      let json = { success: true, data: [] };
      if (pathname === "/api/settings") json = { result: true, data: {} };
      if (pathname === "/api/orders") json = { success: true, data: rows };
      if (pathname.startsWith("/api/orders/"))
        json = {
          success: true,
          data: rows.find((row) => String(row.id) === pathname.split("/").at(-1)),
        };
      if (pathname === "/api/count") json = { success: true, data: { item_count: 0 } };
      return route.fulfill({ headers, json });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const id of [541, 519, 518, 503, 502, 540]) {
      await page.goto(base + "/tracking?order=" + id);
      const region = page.getByRole("region", { name: "مراحل الطلب" });
      await region.waitFor();
      assert.equal(
        await region.locator('[aria-current="step"] h3').innerText(),
        id === 540 ? "تم استلام الطلب" : "تم التسليم",
      );
      await page.waitForFunction(() => {
        const region = document.querySelector('[aria-label="مراحل الطلب"]');
        const box = region.getBoundingClientRect();
        const step = region
          .querySelector('[aria-current="step"]')
          .getBoundingClientRect();
        return step.left >= box.left - 1 && step.right <= box.right + 1;
      });
      if (id !== 540) {
        await page
          .locator("#order-status-title")
          .locator("..")
          .getByRole("status")
          .getByText("تم التسليم", { exact: true })
          .waitFor();
        assert.equal(
          await page.getByRole("button", { name: "تقييم الطلب", exact: true }).count(),
          id === 502 ? 0 : 1,
        );
      }
    }
    await page.goto(base + "/orders");
    await page.getByRole("heading", { name: /كل الطلبات/ }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "كل الطلبات", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(await page.locator("article").count(), 10);
    for (const row of rows)
      assert.equal(
        await page
          .getByRole("link", { name: "عرض تفاصيل الطلب " + row.id, exact: true })
          .count(),
        1,
      );
    await page.getByRole("button", { name: "الطلبات الحالية", exact: true }).click();
    await page.getByRole("link", { name: "عرض تفاصيل الطلب 540", exact: true }).waitFor();
    assert.equal(await page.locator("article").count(), 5);
    assert.equal(
      await page.getByRole("link", { name: "عرض تفاصيل الطلب 541", exact: true }).count(),
      0,
    );
    await page.getByRole("button", { name: "الطلبات السابقة", exact: true }).click();
    await page.getByRole("link", { name: "عرض تفاصيل الطلب 541", exact: true }).waitFor();
    assert.equal(await page.locator("article").count(), 5);
    assert.equal(
      await page.locator("article").getByText("تم التسليم", { exact: true }).count(),
      5,
    );
    await page.getByRole("button", { name: "كل الطلبات", exact: true }).click();
    await page.getByRole("heading", { name: /كل الطلبات/ }).waitFor();
    assert.equal(await page.locator("article").count(), 10);
    await page.goto(base + "/tracking?order=541");
    await page.getByRole("region", { name: "مراحل الطلب" }).waitFor();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => {
      const region = document.querySelector('[aria-label="مراحل الطلب"]');
      const box = region.getBoundingClientRect(),
        step = region.querySelector('[aria-current="step"]').getBoundingClientRect();
      return step.left >= box.left - 1 && step.right <= box.right + 1;
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: supplied order statuses, paid labels and tabs, rating flags, mobile current-stage visibility and viewport resize.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
