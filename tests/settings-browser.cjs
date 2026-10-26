const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3000";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let calls = 0,
      fail = true,
      empty = false;
    const origin = "https://admin.shinycarpet-sa.com/storage/images/upload/settings/";
    const settings = {
      name: "tawajood",
      email: "info@tawajood.com",
      phone: "+201024848723",
      address: "Cairo - Egypt",
      facebook: "https://www.facebook.com/",
      instagram: "https://www.instagram.com/",
      snapchat: "https://www.snapchat.com/",
      tik_tok: "https://www.tiktok.com/",
      pinterest: null,
      fav_icon: origin + "fav_icon.png",
      light_logo: origin + "API-LOGO.png",
      dark_logo: origin + "API-DARK-LOGO.png",
      default_user: origin + "default.png",
      no_data_icon: origin + "fav.png",
      login_background: "login_background.png",
      privacy_policy: "Privacy Policy <script>window.policyInjected=true</script>",
      terms_and_conditions: "Terms and Conditions",
    };
    await context.route("https://admin.shinycarpet-sa.com/api/**", async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname;
      const headers = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET",
        "access-control-allow-headers": "accept-language",
      };
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/settings") {
        calls++;
        assert.equal(req.method(), "GET");
        assert.equal(req.headers().authorization, undefined);
        if (fail) {
          fail = false;
          return route.fulfill({
            status: 503,
            json: { message: "unavailable" },
            headers,
          });
        }
        return route.fulfill({
          json: { result: true, data: empty ? {} : settings },
          headers,
        });
      }
      return route.fulfill({ json: { success: true, data: [] }, headers });
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/privacy-policy");
    await page.getByText("تعذر تحميل بيانات التواصل.").waitFor();
    await page.locator("footer").getByRole("button", { name: "إعادة المحاولة" }).click();
    await page.getByText(settings.privacy_policy, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.policyInjected), undefined);
    const footer = page.locator("footer");
    assert.equal(
      await footer
        .getByRole("link", { name: "Facebook", exact: true })
        .getAttribute("href"),
      settings.facebook,
    );
    assert.equal(
      await footer.getByRole("link", { name: "Pinterest", exact: true }).count(),
      0,
    );
    assert.equal(await footer.locator('a[href="tel:+201024848723"]').count(), 1);
    assert.equal(await footer.locator('a[href="mailto:info@tawajood.com"]').count(), 1);
    assert.equal(await footer.getByText("Cairo - Egypt").count(), 1);
    assert.equal(await footer.getByText("hello@shinycarpet.com").count(), 0);
    assert.equal(await page.locator('img[src*="API-LOGO"]').count(), 0);
    assert.ok((await footer.locator("img").getAttribute("src")).includes("logo1.png"));
    await footer.getByRole("link", { name: "الشروط والأحكام", exact: true }).click();
    await page.getByText("Terms and Conditions", { exact: true }).waitFor();
    assert.equal(calls, 2);
    await page.waitForFunction(() =>
      document.querySelector('link[rel="shortcut icon"]').href.includes("fav_icon.png"),
    );
    await page.goto(base + "/register");
    await page.getByRole("heading", { name: "إنشاء حساب", exact: true }).waitFor();
    await page.waitForFunction(() =>
      document
        .querySelector("main section")
        .style.backgroundImage.includes("login_background.png"),
    );
    assert.ok(
      (await page.getByRole("link", { name: "سياسة الخصوصية", exact: true }).count()) >=
        1,
    );
    empty = true;
    await page.reload();
    await page.getByRole("heading", { name: "إنشاء حساب", exact: true }).waitFor();
    await page.waitForFunction(
      () => !document.querySelector("main section").style.backgroundImage,
    );
    assert.equal(await page.locator('footer a[href^="tel:"]').count(), 0);
    assert.equal(await page.locator('footer a[aria-label="Facebook"]').count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: public settings, shared request, retry, contact/social links, safe policies, navigation, favicon, auth background, null fields, old logo and mobile layout.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
