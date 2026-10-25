const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3107";
const provider = "http://127.0.0.1:4109";
async function main() {
  await fetch(`${provider}/__reset`, { method: "POST" });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route("https://admin.shinycarpet-sa.com/api/addresses", (route) =>
      route.fulfill({
        json: { result: true, data: { addresses: [] } },
        headers: { "access-control-allow-origin": "*" },
      }),
    );
    await context.route("https://admin.shinycarpet-sa.com/api/cart", (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            cart_items: [],
            cart_subtotal: 0,
            vat_percentage: 14,
            vat_amount: 0,
            cart_total: 0,
          },
        },
        headers: { "access-control-allow-origin": "*" },
      }),
    );
    await context.route("https://admin.shinycarpet-sa.com/api/count", (route) =>
      route.fulfill({
        json: { success: true, data: { item_count: 0 } },
        headers: { "access-control-allow-origin": "*" },
      }),
    );
    const urls = [],
      errors = [];
    let failLogout = false;
    await context.route("https://admin.shinycarpet-sa.com/api/profile", async (route) => {
      const egypt = route.request().headers().authorization?.endsWith("-4");
      await route.fulfill({
        json: {
          status: "success",
          data: {
            name: "حساب الاختبار",
            phone: egypt ? "1012345678" : "551234567",
            country_code: egypt ? "+20" : "+966",
            image: null,
          },
        },
        headers: { "access-control-allow-origin": "*" },
      });
    });
    await context.route("**/api/auth/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      assert.equal(url.origin, "https://admin.shinycarpet-sa.com");
      const cors = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST",
        "access-control-allow-headers": "content-type,authorization,accept-language",
      };
      if (request.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: cors });
      urls.push(url.href);
      if (url.pathname.endsWith("/logout") && failLogout) {
        failLogout = false;
        return route.fulfill({
          status: 503,
          json: { message: "تعذر تسجيل الخروج مؤقتًا" },
          headers: cors,
        });
      }
      const original = request.headers();
      const headers = {};
      for (const key of ["content-type", "authorization", "accept-language"])
        if (original[key]) headers[key] = original[key];
      const response = await context.request.post(provider + url.pathname, {
        data: request.postData(),
        headers,
      });
      await route.fulfill({ response, headers: { ...response.headers(), ...cors } });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/login");
    const phone = page.getByLabel("رقم الهاتف", { exact: true });
    await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "يرجى إدخال رقم الهاتف." }).waitFor();
    await phone.fill("123");
    await phone.blur();
    await page.getByRole("alert").filter({ hasText: "للدولة المختارة" }).waitFor();
    await phone.fill("abc");
    assert.equal(await phone.inputValue(), "");
    assert.equal(urls.length, 0);
    console.log(
      "PASS: required, digits-only and country length validation block invalid requests",
    );
    await page.goto(base + "/register");
    await page.getByLabel("الاسم", { exact: true }).fill("حساب التسجيل");
    await page.getByLabel("رقم الهاتف", { exact: true }).fill("551234567");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "إنشاء حساب", exact: true }).click();
    await page.waitForURL("**/verify-otp");
    const session = () =>
      page.evaluate(() => localStorage.getItem("shiny-carpet-auth-session"));
    assert.equal(await session(), null);
    await page.getByLabel("الرقم 1 من رمز التحقق", { exact: true }).fill("000000");
    await page.getByRole("button", { name: "تحقق ومتابعة", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "الرمز غير صحيح" }).waitFor();
    assert.equal(await session(), null);
    await page.evaluate(() => {
      const key = "shiny-carpet-auth-challenge";
      const draft = JSON.parse(sessionStorage.getItem(key));
      draft.issuedAt = Date.now() - 61000;
      sessionStorage.setItem(key, JSON.stringify(draft));
    });
    await page.reload();
    await page.getByRole("button", { name: "إعادة إرسال الرمز", exact: true }).click();
    await page.getByText("تمت إعادة إرسال رمز التحقق", { exact: true }).waitFor();
    await page.getByLabel("الرقم 1 من رمز التحقق", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "تحقق ومتابعة", exact: true }).click();
    await page.waitForURL("**/profile");
    await page
      .getByRole("status")
      .filter({ hasText: "تم تسجيل الدخول بنجاح." })
      .waitFor();
    assert.ok((await session()).includes("fixture-only-"));
    assert.equal(
      await page.evaluate(() => sessionStorage.getItem("shiny-carpet-auth-session")),
      null,
    );
    const otherTab = await context.newPage();
    await otherTab.goto(base + "/profile");
    await otherTab.getByRole("button", { name: "تسجيل الخروج", exact: true }).waitFor();
    assert.equal(
      await otherTab.evaluate(() => sessionStorage.getItem("shiny-carpet-auth-session")),
      null,
    );
    await page.reload();
    const logoutCount = urls.filter((url) => url.endsWith("/logout")).length;
    await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
    const logoutDialog = page.getByRole("dialog", { name: "تسجيل الخروج", exact: true });
    await logoutDialog.waitFor();
    assert.equal(urls.filter((url) => url.endsWith("/logout")).length, logoutCount);
    await logoutDialog.getByRole("button", { name: "لا، البقاء في الحساب" }).click();
    await logoutDialog.waitFor({ state: "hidden" });
    assert.ok(await session());
    assert.equal(urls.filter((url) => url.endsWith("/logout")).length, logoutCount);
    failLogout = true;
    await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
    await logoutDialog.getByRole("button", { name: "نعم، تسجيل الخروج" }).click();
    await logoutDialog
      .getByRole("alert")
      .filter({ hasText: "تعذر تسجيل الخروج مؤقتًا" })
      .waitFor();
    assert.ok(await session());
    await logoutDialog.getByRole("button", { name: "نعم، تسجيل الخروج" }).click();
    await page.waitForURL(base + "/");
    await page
      .getByRole("status")
      .filter({ hasText: "تم تسجيل الخروج بنجاح." })
      .waitFor();
    assert.equal(await session(), null);
    await otherTab
      .getByRole("heading", { name: "مرحبًا بك في حسابك", exact: true })
      .waitFor();
    await otherTab.close();
    assert.equal(
      await page.getByRole("link", { name: "حسابي", exact: true }).getAttribute("href"),
      "/login",
    );
    assert.equal(
      await page.getByRole("button", { name: "تسجيل الخروج", exact: true }).count(),
      0,
    );
    await page.goto(base + "/login");
    await page.getByRole("button", { name: /الدولة/ }).click();
    await page.getByRole("menuitemradio", { name: /مصر/ }).click();
    await page.getByLabel("رقم الهاتف", { exact: true }).fill("1012345678");
    await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
    await page.waitForURL("**/verify-otp");
    const requests = await (await fetch(provider + "/__requests")).json();
    for (const action of ["register", "login", "verify", "resend", "logout"])
      assert.ok(urls.includes("https://admin.shinycarpet-sa.com/api/auth/" + action));
    assert.ok(requests.every((request) => request.arabic));
    assert.ok(
      requests.some((request) => request.action === "logout" && request.authorized),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: direct backend URLs, Arabic headers, OTP, resend, session refresh and bearer logout",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
