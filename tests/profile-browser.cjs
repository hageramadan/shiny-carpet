const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.AUTH_TEST_APP_URL || "http://localhost:3107";
async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    let releaseProfile, releaseAddresses;
    let profileGate = new Promise((resolve) => {
      releaseProfile = resolve;
    });
    let addressesGate = new Promise((resolve) => {
      releaseAddresses = resolve;
    });
    await context.route("https://admin.shinycarpet-sa.com/api/settings", (route) =>
      route.fulfill({
        json: { result: true, data: {} },
        headers: { "access-control-allow-origin": "*" },
      }),
    );
    await context.route(
      "https://admin.shinycarpet-sa.com/api/addresses",
      async (route) => {
        await addressesGate;
        return route.fulfill({
          json: { result: true, data: { addresses: [] } },
          headers: { "access-control-allow-origin": "*" },
        });
      },
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
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("profile-test-seeded")) {
        sessionStorage.setItem("profile-test-seeded", "1");
        localStorage.setItem(
          "shiny-carpet-auth-session",
          JSON.stringify({
            token: "fixture-profile-token",
            profile: { name: "اسم قديم", phone: "+201012345678", email: "" },
          }),
        );
      }
    });
    let user = {
      name: "اسم من الخادم",
      phone: "1012345678",
      country_code: "+20",
      image: null,
    };
    const calls = [],
      errors = [];
    await context.route(
      "https://admin.shinycarpet-sa.com/api/profile**",
      async (route) => {
        const request = route.request(),
          headers = request.headers(),
          method = request.method();
        const cors = {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,DELETE",
          "access-control-allow-headers": "content-type,authorization,accept-language",
        };
        if (method === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
        calls.push({ method, url: request.url() });
        assert.equal(headers.authorization, "Bearer fixture-profile-token");
        assert.equal(headers["accept-language"], "ar");
        if (method === "GET") {
          await profileGate;
          return route.fulfill({
            json: { status: "success", data: user },
            headers: cors,
          });
        }
        if (method === "DELETE")
          return route.fulfill({
            json: { status: "success", message: "تم الحذف" },
            headers: cors,
          });
        if (request.url().endsWith("/verify")) {
          const data = request.postDataJSON();
          assert.equal(data.phone, "1112345678");
          assert.equal(data.country_code, "+20");
          if (data.code !== "123456")
            return route.fulfill({
              status: 422,
              json: { result: false, message: "الرمز غير صحيح" },
              headers: cors,
            });
          return route.fulfill({ json: { result: true, data: { user } }, headers: cors });
        }
        assert.ok(headers["content-type"].startsWith("multipart/form-data; boundary="));
        const body = request.postDataBuffer().toString("utf8");
        if (!body.includes('name="image";')) {
          assert.ok(body.includes("1012345678"));
          user = { ...user, name: "اسم محدث" };
          return route.fulfill({ json: { result: true, data: { user } }, headers: cors });
        }
        assert.ok(body.includes('name="image"; filename="avatar.png"'));
        assert.ok(body.includes("1112345678"));
        assert.ok(body.includes("+20"));
        user = { ...user, name: "اسم محدث", phone: "1112345678" };
        return route.fulfill({
          json: { result: true, message: "OTP sent", data: { user } },
          headers: cors,
        });
      },
    );
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(base + "/profile");
    const spinner = page.getByRole("status", {
      name: "جاري تحميل بيانات الحساب",
      exact: true,
    });
    await spinner.waitFor();
    await page.getByRole("navigation", { name: "قائمة الحساب" }).waitFor();
    assert.equal(await spinner.locator(".animate-spin").count(), 1);
    assert.equal(await page.getByLabel("الاسم", { exact: true }).count(), 0);
    await page.evaluate(() => {
      window.sidebarBeforeLoad = document.querySelector("main aside");
    });
    assert.equal(
      await page
        .locator("main aside")
        .evaluate((el) => getComputedStyle(el.parentElement).position),
      "sticky",
    );
    releaseProfile();
    await page
      .getByText(
        "أهلًا اسم من الخادم، يمكنك تحديث بياناتك وإدارة طلباتك وعناوينك من هنا.",
      )
      .waitFor();
    assert.equal(await spinner.isVisible(), true);
    releaseAddresses();
    await spinner.waitFor({ state: "hidden" });
    assert.equal(
      await page.evaluate(
        () => window.sidebarBeforeLoad === document.querySelector("main aside"),
      ),
      true,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("الاسم", { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel("الاسم", { exact: true }).inputValue(),
      "اسم من الخادم",
    );
    await page.getByLabel("الاسم", { exact: true }).fill("اسم محدث");
    await page.getByRole("button", { name: "حفظ المعلومات", exact: true }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "تم تحديث الملف الشخصي بنجاح." })
      .waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.getByLabel("رقم الهاتف", { exact: true }).fill("1112345678");
    assert.equal(await page.getByText("الصورة الشخصية", { exact: true }).count(), 0);
    const chooserPromise = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "تغيير صورة الملف الشخصي", exact: true })
      .click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("fixture image"),
    });
    await page.getByRole("status").filter({ hasText: "لحفظ الصورة" }).waitFor();
    assert.ok(
      await page.locator("aside img").evaluate((image) => image.src.startsWith("blob:")),
    );
    await page.getByRole("button", { name: "حفظ المعلومات", exact: true }).click();
    await page.getByRole("heading", { name: "تأكيد رقم الهاتف الجديد" }).waitFor();
    const dialog = page.getByRole("dialog", { name: "تأكيد رقم الهاتف الجديد" });
    await dialog.waitFor();
    await page.getByLabel("الرقم 1 من رمز التحقق", { exact: true }).waitFor();
    await page.getByRole("button", { name: "إغلاق نافذة التحقق" }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "استكمال تأكيد رقم الهاتف" }).click();
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "استكمال تأكيد رقم الهاتف" }).click();
    await dialog.waitFor();
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("shiny-carpet-auth-session")).profile.phone,
      ),
      "+201012345678",
    );
    await page.reload();
    await page.getByRole("heading", { name: "تأكيد رقم الهاتف الجديد" }).waitFor();
    await page.getByLabel("الرقم 1 من رمز التحقق", { exact: true }).fill("000000");
    await page.getByRole("button", { name: "تأكيد رقم الهاتف", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "الرمز غير صحيح" }).waitFor();
    await page.getByLabel("الرقم 1 من رمز التحقق", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "تأكيد رقم الهاتف", exact: true }).click();
    await page
      .getByRole("heading", { name: "تأكيد رقم الهاتف الجديد" })
      .waitFor({ state: "hidden" });
    await page
      .getByRole("status")
      .filter({ hasText: "تم تحديث الملف الشخصي وتأكيد رقم الهاتف بنجاح." })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("shiny-carpet-auth-session")).profile.phone,
      ),
      "+201112345678",
    );
    await page.getByRole("button", { name: "حذف الحساب", exact: true }).click();
    assert.ok(!calls.some((call) => call.method === "DELETE"));
    await page.getByRole("button", { name: "إلغاء", exact: true }).click();
    await page.getByRole("button", { name: "حذف الحساب", exact: true }).click();
    await page.getByRole("button", { name: "تأكيد حذف الحساب", exact: true }).click();
    await page.waitForURL("**/login");
    assert.equal(
      await page.evaluate(() => localStorage.getItem("shiny-carpet-auth-session")),
      null,
    );
    assert.ok(calls.some((call) => call.method === "DELETE"));
    assert.deepEqual(errors, []);
    console.log(
      "PASS: profile loading, multipart upload, persistent phone verification, OTP errors, deletion confirmation and session cleanup",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
