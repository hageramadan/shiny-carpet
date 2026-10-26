const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseSettings, fetchSettings } = require("../lib/api/settings.ts");
const { ApiError, ApiResponseError } = require("../lib/api/client.ts");
test("settings use the result envelope and omit invalid/empty links and contact values", () => {
  const s = parseSettings({
    result: true,
    data: {
      name: "tawajood",
      email: "info@tawajood.com",
      phone: "+201024848723",
      facebook: "https://www.facebook.com/",
      instagram: "javascript:alert(1)",
      pinterest: null,
      light_logo: "https://evil.example/logo.png",
      login_background: "login_background.png",
      privacy_policy: "<script>unsafe()</script>",
    },
  });
  assert.equal(s.name, "tawajood");
  assert.equal(s.phone, "+201024848723");
  assert.equal(s.facebook, "https://www.facebook.com/");
  assert.equal(s.instagram, undefined);
  assert.equal(s.pinterest, undefined);
  assert.equal(s.lightLogo, undefined);
  assert.equal(
    s.loginBackground,
    "https://admin.shinycarpet-sa.com/storage/images/upload/settings/login_background.png",
  );
  assert.equal(s.privacyPolicy, "<script>unsafe()</script>");
  assert.deepEqual(parseSettings({ result: true, data: {} }).phone, undefined);
  assert.throws(() => parseSettings({ result: false, message: "failed" }), ApiError);
  assert.throws(() => parseSettings({ result: true, data: [] }), ApiResponseError);
  const invalid = parseSettings({
    result: true,
    data: {
      phone: "javascript:123",
      email: "x@test.com?subject=malicious",
      fav_icon: "../../profile/x.png",
    },
  });
  assert.equal(invalid.phone, undefined);
  assert.equal(invalid.favicon, undefined);
});
test("GET settings is public, uncached, Arabic and abortable", async (t) => {
  const previous = global.fetch;
  t.after(() => (global.fetch = previous));
  const controller = new AbortController();
  global.fetch = async (url, options) => {
    assert.ok(url.endsWith("/settings"));
    assert.equal(options.method, "GET");
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.headers["Accept-Language"], "ar");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal);
    return new Response(
      JSON.stringify({ result: true, data: { email: "info@tawajood.com" } }),
      { headers: { "content-type": "application/json" } },
    );
  };
  assert.equal((await fetchSettings(controller.signal)).email, "info@tawajood.com");
});
