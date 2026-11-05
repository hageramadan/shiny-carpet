const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const fs = require("node:fs/promises");
const path = require("node:path");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3107";
const dimensions = [
  [1, 1],
  [1, 1.5],
  [1, 2],
  [1, 3],
  [2, 2],
  [2, 3],
  [2, 4],
  [2.5, 3.5],
  [3, 3],
  [3, 4],
  [3, 5],
  [4, 4],
  [4, 5],
  [4, 6],
  [4, 7],
  [4, 5.5],
];
const product = {
  id: 11,
  name: "سجاد بوليستر وحرير صناعي",
  description:
    "نقدم خدمة غسيل سجاد بوليستر بجودة عالية واحترافية، باستخدام أحدث المعدات والتقنيات لضمان نظافة وجودة السجاد.",
  category: { id: 16, name: "غسيل سجاد" },
  has_sizes: 1,
  min_price_before_discount: 10,
  price_per_unit: 10,
  images: "https://admin.shinycarpet-sa.com/storage/products/layout-preview.png",
  sizes: dimensions.map(([length, width], i) => ({
    id: 673 + i,
    length,
    width,
    price_before_discount: length * width * 10,
  })),
};
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const data =
        pathname === "/api/products/11"
          ? product
          : pathname === "/api/settings"
            ? {}
            : [];
      await route.fulfill({
        json: { success: true, result: true, data },
        headers: { "access-control-allow-origin": "*" },
      });
    });
    await page.route("**/_next/image?**", (route) =>
      new URL(route.request().url()).searchParams
        .get("url")
        ?.includes("layout-preview.png")
        ? route.fulfill({
            path: path.resolve("public/images/carpet1.png"),
            contentType: "image/png",
          })
        : route.continue(),
    );
    for (const width of [390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(base + "/products/11");
      const name = page.getByRole("heading", { name: product.name, exact: true });
      await name.waitFor();
      await page.getByText(product.description, { exact: true }).waitFor();
      assert.equal(await page.getByRole("contentinfo").count(), 0);
      assert.equal(
        await page.getByRole("navigation", { name: "مسار التصفح" }).count(),
        0,
      );
      assert.equal(await page.getByText("الإجمالي", { exact: true }).count(), 0);
      assert.equal(await page.locator("main img").count(), 1);
      const imageBox = await page.locator("main img").boundingBox();
      const formBox = await page.locator("main form").boundingBox();
      if (width < 1024) {
        assert.ok(imageBox.y + imageBox.height <= formBox.y);
      } else {
        assert.ok(formBox.x + formBox.width <= imageBox.x);
        assert.ok(
          imageBox.y < formBox.y + formBox.height &&
            imageBox.y + imageBox.height > formBox.y,
        );
      }
      const options = page.getByRole("radio");
      assert.equal(await options.count(), 17);
      const boxes = await Promise.all(
        [0, 1, 2, 3].map((i) => options.nth(i).locator("..").boundingBox()),
      );
      assert.ok(boxes.every((box) => Math.abs(box.y - boxes[0].y) < 2));
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      );
      await page.getByText("1 × 2", { exact: true }).click();
      await page.getByRole("button", { name: "زيادة الكمية", exact: true }).click();
      assert.ok(
        (
          await page
            .getByRole("button", { name: "أضف إلى السلة", exact: true })
            .innerText()
        ).includes("٤٠"),
      );
      if (process.env.PRODUCT_SCREENSHOT_DIR) {
        await fs.mkdir(process.env.PRODUCT_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(process.env.PRODUCT_SCREENSHOT_DIR, `product-${width}.png`),
          fullPage: true,
        });
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: app-style product layout, four-column sizes, responsive widths, selected-size totals and quantity controls",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
