const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    let categories = [
      "غسيل السجاد",
      "غسيل البطانيات واللحفافات",
      "غسيل الستاير",
      "غسيل اللباد",
      "غسيل الزل",
    ].map((name, i) => ({ id: 104 + i * 101, name, image: null }));
    let categoryReads = 0,
      fail = true;
    const productRequests = [],
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://admin.shinycarpet-sa.com/api/**", (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const respond = (data, status = 200) =>
        route.fulfill({
          status,
          json: { result: true, success: status === 200, data },
          headers: { "access-control-allow-origin": "*" },
        });
      if (pathname === "/api/settings") return respond({});
      if (pathname === "/api/categories") {
        categoryReads++;
        if (fail) {
          fail = false;
          return respond({}, 503);
        }
        return respond(categories);
      }
      const match = pathname.match(/^\/api\/products\/category\/(\d+)$/);
      if (match) {
        const id = Number(match[1]);
        productRequests.push(id);
        const category = categories.find((c) => c.id === id);
        assert.ok(category);
        return respond([
          {
            id: 1000 + id,
            name: "منتج " + category.name,
            category,
            description: "وصف المنتج",
            has_sizes: 0,
            price: 20,
            images: [],
          },
        ]);
      }
      return respond([]);
    });
    await page.goto(base + "/login");
    await page.locator('[aria-label="جاري تحميل الموقع"]').waitFor({ state: "detached" });
    assert.equal(categoryReads, 0);
    const menu = () =>
      page.getByRole("navigation", { name: "التنقل الرئيسي", exact: true });
    const open = () =>
      page.getByRole("button", { name: "فتح القائمة", exact: true }).click();
    await open();
    await menu().getByRole("alert").waitFor();
    await menu().getByRole("button", { name: "إعادة المحاولة", exact: true }).click();
    await menu().getByRole("link", { name: categories[0].name, exact: true }).waitFor();
    assert.deepEqual(await menu().getByRole("link").allTextContents(), [
      "الرئيسية",
      ...categories.map((c) => c.name),
      "طلباتي",
    ]);
    const readsAfterLoad = categoryReads;
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Escape");
      await open();
      await menu().getByRole("link", { name: categories[0].name, exact: true }).waitFor();
      assert.equal(await menu().getByRole("status").count(), 0);
      assert.equal(categoryReads, readsAfterLoad);
    }
    for (const category of categories) {
      if (!(await menu().isVisible())) await open();
      const link = menu().getByRole("link", { name: category.name, exact: true });
      await link.waitFor();
      assert.equal(await link.getAttribute("href"), "/products?category=" + category.id);
      await link.click();
      await page.waitForURL(
        (url) =>
          url.pathname === "/products" &&
          url.searchParams.get("category") === String(category.id),
      );
      await page
        .getByRole("heading", { name: "منتج " + category.name, exact: true })
        .waitFor();
      assert.equal(await menu().isVisible(), false);
      assert.equal(await page.getByRole("article").count(), 1);
    }
    assert.deepEqual(
      [...new Set(productRequests)],
      categories.map((c) => c.id),
    );
    categories = [...categories, { id: 999, name: "خدمة جديدة من API", image: null }];
    await open();
    await menu().getByRole("link", { name: categories[0].name, exact: true }).waitFor();
    assert.equal(
      await menu().getByRole("link", { name: "خدمة جديدة من API", exact: true }).count(),
      0,
    );
    await page.reload();
    await open();
    await menu().getByRole("link", { name: "خدمة جديدة من API", exact: true }).waitFor();
    await menu().getByRole("link", { name: "طلباتي", exact: true }).click();
    await page.waitForURL("**/orders");
    assert.equal(await menu().isVisible(), false);
    categories = [];
    await page.reload();
    await open();
    await menu().getByText("لا توجد خدمات متاحة حاليًا.", { exact: true }).waitFor();
    assert.equal(
      await menu().getByRole("link", { name: "طلباتي", exact: true }).count(),
      1,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: API-driven mobile service names/IDs, error retry, matching products, close-on-select, cached reopen without requests/loading, refresh, empty state and My orders",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
