const assert = require("node:assert/strict");
const { test } = require("node:test");
process.env.AUTH_OTP_DB_PATH = ":memory:";
process.env.MORA_SMS_API_KEY = "fixture-sms-secret";
process.env.BACKEND_AUTH_VERIFY_CODE = "123456";
const { sendOtp, verifyOtp } = require("../lib/auth/otp-server.ts");
const { POST } = require("../app/api/auth/otp/route.ts");
const input = (last) => ({ phone: `10123456${last}`, country_code: "+20" });
function provider(t) {
  let code;
  const backend = [];
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    if (String(url).startsWith("https://mora-sa.com/api/v1/sendsms?")) {
      const params = new URL(url).searchParams;
      assert.equal(options.method, "GET");
      assert.equal(options.body, undefined);
      assert.equal(params.get("api_key"), "fixture-sms-secret");
      assert.equal(params.get("username"), "ShinyCarpet");
      assert.equal(params.get("sender"), "ShinyCarpet");
      assert.ok(!params.get("numbers").startsWith("+"));
      code = params.get("message").match(/\b\d{6}\b/)[0];
      return Response.json({
        status: { code: 200, error: false },
        data: { code: "100", ref_id: 1 },
      });
    }
    assert.ok(url.endsWith("/auth/verify"));
    backend.push(JSON.parse(options.body));
    assert.equal(backend.at(-1).code, "123456");
    return Response.json({
      result: true,
      data: {
        user: { name: "اختبار", phone: backend.at(-1).phone, country_code: "+20" },
        token: "fixture-session-token",
      },
    });
  });
  return { code: () => code, backend, mock };
}

test("server generates an SMS code and calls backend verify only after a correct, phone-bound, single-use match", async (t) => {
  const sms = provider(t),
    phone = input("01");
  const sent = await sendOtp(phone, "test-1");
  assert.match(sms.code(), /^\d{6}$/);
  assert.deepEqual(Object.keys(sent).sort(), ["id", "message"]);
  assert.ok(!JSON.stringify(sent).includes(sms.code()));
  await assert.rejects(
    verifyOtp({ ...input("02"), code: sms.code() }, sent.id),
    (e) => e.status === 422,
  );
  const wrong = sms.code() === "000000" ? "111111" : "000000";
  await assert.rejects(
    verifyOtp({ ...phone, code: wrong }, sent.id),
    (e) => e.status === 422,
  );
  assert.equal(sms.backend.length, 0);
  const result = await verifyOtp({ ...phone, code: sms.code() }, sent.id);
  assert.equal(result.data.token, "fixture-session-token");
  assert.equal(sms.backend.length, 1);
  await assert.rejects(
    verifyOtp({ ...phone, code: sms.code() }, sent.id),
    (e) => e.status === 422,
  );
  assert.equal(sms.backend.length, 1);
});

test("five incorrect attempts invalidate a code", async (t) => {
  const sms = provider(t),
    phone = input("03");
  const sent = await sendOtp(phone, "test-2");
  const code = sms.code(),
    wrong = code === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++)
    await assert.rejects(
      verifyOtp({ ...phone, code: wrong }, sent.id),
      (e) => e.status === 422,
    );
  await assert.rejects(verifyOtp({ ...phone, code }, sent.id), (e) => e.status === 422);
  assert.equal(sms.backend.length, 0);
});

test("resend has a server cooldown, replaces the old code, and expires after five minutes", async (t) => {
  const sms = provider(t),
    phone = input("04");
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const old = await sendOtp(phone, "test-3");
  const oldCode = sms.code();
  await assert.rejects(sendOtp(phone, "test-3"), (e) => e.status === 429);
  now += 61_000;
  const next = await sendOtp(phone, "test-3");
  const code = sms.code();
  await assert.rejects(
    verifyOtp({ ...phone, code: oldCode }, old.id),
    (e) => e.status === 422,
  );
  now += 301_000;
  await assert.rejects(verifyOtp({ ...phone, code }, next.id), (e) => e.status === 422);
  assert.equal(sms.backend.length, 0);
});

test("SMS provider rejection never creates a usable challenge or leaks provider credentials", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      status: { code: 200, error: false },
      data: { code: 105, message: "fixture-sms-secret" },
    }),
  );
  await assert.rejects(
    sendOtp(input("05"), "test-4"),
    (error) =>
      error.status === 502 && !JSON.stringify(error).includes("fixture-sms-secret"),
  );
});

test("OTP route rejects foreign origins and keeps the challenge ID in an HttpOnly cookie", async (t) => {
  const sms = provider(t),
    phone = input("06");
  const req = (body, origin = "http://localhost:3000", cookie = "") =>
    new Request("http://localhost:3000/api/auth/otp", {
      method: "POST",
      headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await POST(req({ action: "send", ...phone }, "https://other.example"))).status,
    403,
  );
  assert.equal(sms.mock.mock.callCount(), 0);
  const sent = await POST(req({ action: "send", ...phone }));
  assert.equal(sent.status, 200);
  const cookie = sent.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=strict/i);
  assert.ok(!JSON.stringify(await sent.json()).includes(sms.code()));
  const verified = await POST(
    req(
      { action: "verify", ...phone, code: sms.code() },
      undefined,
      cookie.split(";")[0],
    ),
  );
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).data.token, "fixture-session-token");
  assert.match(verified.headers.get("set-cookie"), /Max-Age=0/);
});

test("HTTP and envelope success alone never count as SMS acceptance, and known rejection codes stay useful", async (t) => {
  const cases = [
    { body: { status: { code: 200, error: false }, data: {} }, message: "تعذر إرسال" },
    {
      body: { status: { code: 200, error: true }, data: { code: 100 } },
      message: "تعذر إرسال",
    },
    {
      body: { status: { code: 401, error: false }, data: { code: 100 } },
      message: "تعذر إرسال",
    },
    {
      body: { status: { code: 200, error: false }, data: { code: "108" } },
      message: "رفضت رقم الهاتف",
    },
    {
      body: { status: { code: 200, error: false }, data: { code: 117 } },
      message: "لم تستقبل نص",
    },
  ];
  let body;
  t.mock.method(globalThis, "fetch", async () => Response.json(body));
  for (const [index, scenario] of cases.entries()) {
    body = scenario.body;
    await assert.rejects(
      sendOtp(input(String(20 + index)), "test-envelope"),
      (error) => error.status === 502 && error.details.message.includes(scenario.message),
    );
  }
});
