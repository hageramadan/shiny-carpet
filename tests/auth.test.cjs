const assert = require("node:assert/strict");
const { test } = require("node:test");
const { apiPhone } = require("../lib/phone.ts");
const {
  authInput,
  parseAuthResult,
  authErrorMessage,
  AUTH_ACTIONS,
} = require("../lib/auth/contracts.ts");
const { ApiError, ApiResponseError, requestJson } = require("../lib/api/client.ts");
const {
  authRequest,
  authenticatedApiRequest,
  fetchSession,
} = require("../lib/auth/client.ts");
const {
  clearAuthSession,
  readAuthSession,
  AUTH_SESSION_KEY,
} = require("../lib/auth/session.ts");

function browserSession(t) {
  const previous = globalThis.window;
  const values = new Map();
  const temporary = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => temporary.get(key) ?? null,
      setItem: (key, value) => temporary.set(key, value),
      removeItem: (key) => temporary.delete(key),
    },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
    dispatchEvent: () => true,
  };
  clearAuthSession();
  t.after(() => {
    clearAuthSession();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });
  return values;
}
const user = {
  id: 4,
  name: "حساب الاختبار",
  phone: "1012345678",
  country_code: "+20",
  is_active: true,
};
const success = (data) => ({ result: true, errNum: 200, message: "تمت العملية", data });

test("international phones split into a national number and a separate calling code", () => {
  assert.deepEqual(apiPhone("+201012345678"), {
    phone: "1012345678",
    country_code: "+20",
  });
  assert.deepEqual(apiPhone("+٩٦٦ ٥٥١٢٣٤٥٦٧"), {
    phone: "551234567",
    country_code: "+966",
  });
  assert.throws(() => apiPhone("+20"), RangeError);
});

test("register and pending login do not invent an authenticated token", () => {
  const registered = parseAuthResult(
    "register",
    success({ user: { ...user, is_active: false } }),
  );
  assert.equal(registered.token, undefined);
  assert.equal(registered.user.phone, "+201012345678");
  const pending = parseAuthResult("login", {
    status: "pending_verification",
    message: "تم الإرسال",
    user,
  });
  assert.equal(pending.token, undefined);
  assert.equal(pending.user.name, user.name);
});

test("verified sessions require the backend's successful response, user and token", () => {
  const result = parseAuthResult(
    "verify",
    success({ user, token: "fixture-only-token" }),
  );
  assert.equal(result.token, "fixture-only-token");
  assert.equal(result.user.phone, "+201012345678");
  assert.throws(() => parseAuthResult("verify", success({ user })), ApiResponseError);
  assert.throws(
    () =>
      parseAuthResult("verify", {
        result: false,
        errNum: 422,
        message: "الرمز غير صحيح",
        data: { token: "fixture-only-token", user },
      }),
    (error) => error instanceof ApiError && error.status === 422,
  );
});

test("only the five requested auth operations remain and empty success data is supported", () => {
  assert.deepEqual(AUTH_ACTIONS, ["register", "login", "verify", "logout", "resend"]);
  assert.equal(parseAuthResult("logout", success([])).message, "تمت العملية");
  assert.equal(parseAuthResult("resend", success([])).token, undefined);
});

test("verification accepts a token nested inside data.user without copying it into profile", async (t) => {
  const storage = browserSession(t);
  const body = success({ user: { ...user, token: "fixture-only-nested-token" } });
  const result = parseAuthResult("verify", body);
  assert.equal(result.token, "fixture-only-nested-token");
  assert.equal(result.user.phone, "+201012345678");
  assert.equal(result.user.token, undefined);
  t.mock.method(globalThis, "fetch", async () => Response.json(body));
  const reply = await authRequest("verify", {
    phone: user.phone,
    country_code: user.country_code,
    code: "123456",
  });
  assert.equal(reply.profile.name, user.name);
  assert.equal(
    JSON.parse(storage.get(AUTH_SESSION_KEY)).token,
    "fixture-only-nested-token",
  );
  assert.equal(readAuthSession().profile.token, undefined);
  assert.throws(
    () =>
      parseAuthResult("verify", success({ user: { ...user, token: "invalid token" } })),
    ApiResponseError,
  );
});

test("authentication payloads whitelist fields and validate names, phone numbers and OTP format", () => {
  const phone = { phone: "1012345678", country_code: "+20" };
  assert.deepEqual(
    authInput("login", { ...phone, token: "ignored", name: "ignored" }),
    phone,
  );
  assert.deepEqual(authInput("register", { ...phone, name: "  حساب الاختبار  " }), {
    ...phone,
    name: "حساب الاختبار",
  });
  assert.deepEqual(authInput("verify", { ...phone, code: "123456" }), {
    ...phone,
    code: "123456",
  });
  for (const code of ["12345", "1234567", "abcdef", 123456]) {
    assert.throws(() => authInput("verify", { ...phone, code }), ApiError);
  }
  assert.throws(() => authInput("register", { ...phone, name: " " }), ApiError);
  assert.throws(
    () => authInput("login", { phone: "+201012345678", country_code: "+20" }),
    ApiError,
  );
});

test("auth transport uses Arabic and a supplied bearer token without changing public calls", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "http://localhost:4109/api/auth/logout");
    assert.equal(options.headers["Accept-Language"], "ar");
    assert.equal(options.headers.Authorization, "Bearer fixture-only-token");
    return Response.json(success([]));
  });
  await requestJson("/auth/logout", {
    method: "POST",
    body: {},
    token: "fixture-only-token",
    baseUrl: "http://localhost:4109/api",
  });
  assert.equal(mock.mock.callCount(), 1);
});

test("safe validation errors remain useful without showing framework exception details", () => {
  assert.equal(
    authErrorMessage(new ApiError(422, { errors: { phone: ["رقم غير صحيح"] } })),
    "رقم غير صحيح",
  );
  assert.equal(
    authErrorMessage(
      new ApiError(500, {
        exception: "FrameworkException",
        message: "private diagnostic",
      }),
    ),
    "تعذر إتمام العملية. حاول مرة أخرى.",
  );
});

test("browser auth calls the backend directly and saves a verified token for protected requests", async (t) => {
  const storage = browserSession(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.ok(url.startsWith("https://admin.shinycarpet-sa.com/api/"));
    assert.equal(options.headers["Accept-Language"], "ar");
    if (url.endsWith("/auth/verify"))
      return Response.json(success({ user, token: "fixture-only-token" }));
    if (url.endsWith("/auth/login"))
      return Response.json({ status: "pending_verification", user });
    if (url.endsWith("/auth/register")) return Response.json(success({ user }));
    return Response.json(success([]));
  });
  const input = { phone: "1012345678", country_code: "+20" };
  await authRequest("register", { ...input, name: user.name });
  assert.equal(readAuthSession(), null);
  await authRequest("login", input);
  await authRequest("resend", input);
  await authRequest("verify", { ...input, code: "123456" });
  assert.equal(JSON.parse(storage.get(AUTH_SESSION_KEY)).token, "fixture-only-token");
  assert.equal(window.sessionStorage.getItem(AUTH_SESSION_KEY), null);
  assert.equal((await fetchSession()).phone, "+201012345678");
  await authenticatedApiRequest("/cart");
  assert.equal(calls.at(-1).options.headers.Authorization, "Bearer fixture-only-token");
  await authRequest("logout", {});
  assert.equal(calls.at(-1).url, "https://admin.shinycarpet-sa.com/api/auth/logout");
  assert.equal(calls.at(-1).options.headers.Authorization, "Bearer fixture-only-token");
  assert.equal(readAuthSession(), null);
  assert.equal(storage.has(AUTH_SESSION_KEY), false);
  assert.ok(calls.every((call) => !call.url.startsWith("/api/")));
});

test("a failed logout keeps the session, while an expired token clears it", async (t) => {
  browserSession(t);
  const mock = t.mock.method(globalThis, "fetch", async () =>
    Response.json(success({ user, token: "fixture-only-token" })),
  );
  await authRequest("verify", {
    phone: "1012345678",
    country_code: "+20",
    code: "123456",
  });
  mock.mock.mockImplementation(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(authRequest("logout", {}), TypeError);
  assert.ok(readAuthSession());
  mock.mock.mockImplementation(async () =>
    Response.json({ message: "Unauthenticated" }, { status: 401 }),
  );
  await assert.rejects(
    authenticatedApiRequest("/cart"),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(readAuthSession(), null);
});
