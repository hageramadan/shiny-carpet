const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const fs = require("node:fs/promises");
const path = require("node:path");
const screenshotDir = process.env.LANGUAGE_SCREENSHOT_DIR;
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const calls = [],
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (
        m.type() === "error" &&
        /hydration|does not match|server rendered/i.test(m.text())
      )
        errors.push(m.text());
    });
    await page.route("https://admin.shinycarpet-sa.com/api/**", (route) => {
      const req = route.request(),
        lang = req.headers()["accept-language"],
        p = new URL(req.url()).pathname;
      calls.push({ p, lang });
      let data = [];
      if (p === "/api/settings") data = { name: "Shiny Carpet", phone: "+966551004559" };
      if (p === "/api/categories")
        data = [
          { id: 16, name: lang === "en" ? "Carpet cleaning" : "غسيل سجاد", image: null },
        ];
      if (p === "/api/products/category/16")
        data = [
          {
            id: 11,
            name: lang === "en" ? "Polyester carpet" : "سجاد بوليستر",
            description:
              lang === "en" ? "Professional carpet cleaning" : "غسيل السجاد باحترافية",
            category: { id: 16, name: lang === "en" ? "Carpet cleaning" : "غسيل سجاد" },
            has_sizes: 1,
            min_price_before_discount: 10,
            price_per_unit: 10,
            images: [],
            sizes: [{ id: 673, length: 1, width: 1, price_before_discount: 10 }],
          },
        ];
      return route.fulfill({
        json: { result: true, success: true, data },
        headers: { "access-control-allow-origin": "*" },
      });
    });
    await page.goto(base);
    await page
      .locator('[aria-label="Loading website"], [aria-label="جاري تحميل الموقع"]')
      .waitFor({ state: "detached" });
    await page.getByRole("button", { name: "اختيار اللغة", exact: true }).waitFor();
    const menu = await page
        .getByRole("button", { name: "فتح القائمة", exact: true })
        .boundingBox(),
      language = await page
        .getByRole("button", { name: "اختيار اللغة", exact: true })
        .boundingBox(),
      logo = await page.locator('header a[href="/#top"][aria-label]').boundingBox(),
      cart = await page.locator('header a[href="/cart"]').boundingBox(),
      account = await page.locator('header a[href="/login"]').boundingBox();
    assert.ok(
      menu.x > language.x && language.x > logo.x && logo.x > cart.x && cart.x > account.x,
    );
    assert.ok(Math.abs(logo.x + logo.width / 2 - 195) < 2);
    const pageTopBeforeLanguage = (await page.locator("main").boundingBox()).y;
    await page.getByRole("button", { name: "اختيار اللغة", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "العربية", exact: true }).waitFor();
    const pageTopWithLanguage = (await page.locator("main").boundingBox()).y;
    assert.ok(
      Math.abs(pageTopWithLanguage - pageTopBeforeLanguage) < 1,
      `Language menu moved page from ${pageTopBeforeLanguage} to ${pageTopWithLanguage}`,
    );
    await Promise.all([
      page.waitForNavigation(),
      page.getByRole("menuitemradio", { name: "English", exact: true }).click(),
    ]);
    await page.getByRole("button", { name: "Choose language", exact: true }).waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.equal(await page.locator("html").getAttribute("dir"), "ltr");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Carpet cleaning", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    if (screenshotDir) {
      await fs.mkdir(screenshotDir, { recursive: true });
      await page.screenshot({
        path: path.join(screenshotDir, "home-en-mobile.png"),
        fullPage: true,
      });
    }
    const untranslated = {};
    for (const url of [
      "/",
      "/products?category=16",
      "/cart",
      "/login",
      "/register",
      "/tracking",
      "/orders",
      "/profile",
      "/addresses",
      "/privacy-policy",
      "/terms-and-conditions",
    ]) {
      await page.goto(base + url);
      await page.locator('[aria-label="Loading website"]').waitFor({ state: "detached" });
      await page.locator("footer").waitFor();
      await page.waitForTimeout(150);
      untranslated[url] = await page.locator("body").evaluate((body) => {
        const found = [];
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const parent = node.parentElement;
          if (
            parent &&
            !parent.closest('script,style,[aria-hidden="true"]') &&
            parent.getClientRects().length &&
            /[\u0621-\u064a]/.test(node.textContent)
          )
            found.push(node.textContent.trim());
        }
        return [...new Set(found)];
      });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        url + " overflow",
      );
    }
    const englishProduct = {
      id: 11,
      name: "Polyester carpet",
      description: "Professional carpet cleaning",
      category: { id: 16, name: "Carpet cleaning" },
      has_sizes: 1,
      min_price_before_discount: 10,
      price_per_unit: 10,
      images: [],
      sizes: [{ id: 673, length: 1, width: 1, price_before_discount: 10 }],
    };
    await page.route("https://admin.shinycarpet-sa.com/api/products/11", (route) =>
      route.fulfill({
        json: { success: true, data: englishProduct },
        headers: { "access-control-allow-origin": "*" },
      }),
    );
    await page.goto(base + "/products/11");
    await page.getByRole("heading", { name: "Polyester carpet", exact: true }).waitFor();
    await page.getByText("Another size", { exact: true }).waitFor();
    const order = {
      id: 541,
      status: "paid",
      user_paid: true,
      is_rated: false,
      subtotal: 35,
      vat_amount: 5.25,
      total: 40.25,
      created_at: "2026-11-01 12:00:00",
      items: [],
    };
    const invoice = require("./fixtures/invoice.cjs")(541);
    invoice.data.invoice_meta.title = "Simplified tax invoice";
    invoice.data.items.forEach((item) => {
      item.product_name = "Carpet cleaning";
      item.specifications = "Size: 1 × 1";
    });
    invoice.data.customer.address = { full_address: "Riyadh" };
    await page.route("https://admin.shinycarpet-sa.com/api/orders/**", (route) => {
      calls.push({
        p: new URL(route.request().url()).pathname,
        lang: route.request().headers()["accept-language"],
      });
      assert.equal(route.request().headers().authorization, "Bearer language-session");
      return route.fulfill({
        json: new URL(route.request().url()).pathname.endsWith("/invoice")
          ? invoice
          : { success: true, data: order },
        headers: { "access-control-allow-origin": "*" },
      });
    });
    await page.evaluate(() => {
      localStorage.setItem(
        "shiny-carpet-auth-session",
        JSON.stringify({
          token: "language-session",
          profile: { name: "Test account", phone: "+201012345678", email: "" },
        }),
      );
      window.dispatchEvent(new Event("shiny-auth-session-change"));
    });
    await page.goto(base + "/tracking?order=541");
    await page
      .getByRole("heading", { name: "Your order is complete", exact: true })
      .waitFor();
    await page.getByRole("link", { name: "View invoice", exact: true }).click();
    await page.getByRole("heading", { name: "Invoice", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Customer details", exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Download invoice PDF", exact: true })
      .waitFor();
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      await page
        .locator('[aria-label="Loading website"], [aria-label="جاري تحميل الموقع"]')
        .waitFor({ state: "detached" });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "English header overflow at " + width,
      );
      if (width === 1440 && screenshotDir)
        await page.screenshot({
          path: path.join(screenshotDir, "home-en-desktop.png"),
          fullPage: false,
        });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    console.log("UNTRANSLATED", JSON.stringify(untranslated));
    for (const [url, texts] of Object.entries(untranslated))
      assert.deepEqual(
        texts.filter((text) => text !== "العربية"),
        [],
        url + " untranslated text",
      );
    assert.ok(calls.some((c) => c.lang === "en"));
    assert.ok(
      calls.slice(calls.findIndex((c) => c.lang === "en")).every((c) => c.lang === "en"),
    );
    assert.deepEqual(errors, []);
    await page.goto(base);
    await page
      .locator('[aria-label="Loading website"], [aria-label="جاري تحميل الموقع"]')
      .waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Choose language", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "English", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Choose language", exact: true }).click();
    await Promise.all([
      page.waitForNavigation(),
      page.getByRole("menuitemradio", { name: "العربية", exact: true }).click(),
    ]);
    assert.equal(await page.locator("html").getAttribute("lang"), "ar");
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    console.log(
      "PASS: mobile navbar order, centered logo, persisted site-wide language, API language and RTL/LTR",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
