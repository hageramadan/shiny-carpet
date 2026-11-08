const assert = require("node:assert/strict");
const { test } = require("node:test");
const { getLocale, translateText, translateValue } = require("../lib/i18n/index.ts");
const { requestJson } = require("../lib/api/client.ts");
test("English translates dynamic UI labels, keeps complete word boundaries, and defaults to Arabic", (t) => {
  assert.equal(getLocale(), "ar");
  assert.equal(translateText("١٬٥٠٠٫٥ ر.س", "en"), "1,500.5 SAR");
  assert.equal(translateText("2 أشخاص", "en"), "2 people");
  assert.equal(translateText("ضريبة القيمة المضافة (15%)", "en"), "VAT (15%)");
  assert.equal(translateText("2 × 3 م", "en"), "2 × 3 m");
  assert.equal(translateText("السلة، ٣ قطع", "en"), "Cart, 3 items");
  assert.equal(translateText("إعادة المحاولة", "ar"), "إعادة المحاولة");
  assert.equal(translateText("constructor", "en"), "constructor");
  assert.equal(translateText("منصور", "en"), "منصور");
  const value = { name: "محمد" };
  assert.equal(translateValue(value, "en"), value);
});
test("all transports send selected language for public, protected and multipart requests", async (t) => {
  const previous = global.document;
  global.document = {
    cookie: "shiny-carpet-language=en",
    documentElement: { lang: "en" },
  };
  t.after(() => {
    if (previous === undefined) delete global.document;
    else global.document = previous;
  });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(options);
    return Response.json({ success: true, data: [] });
  });
  await requestJson("/categories", { method: "GET" });
  await requestJson("/orders", {
    method: "POST",
    token: "fixture",
    body: { note: "example" },
  });
  const multipart = new FormData();
  multipart.set("quantity", "2");
  await requestJson("/cart/item/1", {
    method: "POST",
    body: multipart,
    token: "fixture",
  });
  assert.ok(calls.every((call) => call.headers["Accept-Language"] === "en"));
  assert.equal(calls[1].headers.Authorization, "Bearer fixture");
  assert.equal(calls[2].headers["Content-Type"], undefined);
  await requestJson("/auth/verify", { method: "POST", locale: "ar", body: {} });
  assert.equal(calls[3].headers["Accept-Language"], "ar");
  global.document.cookie = "shiny-carpet-language=ar";
  await requestJson("/categories", { method: "GET" });
  assert.equal(calls[4].headers["Accept-Language"], "ar");
});
