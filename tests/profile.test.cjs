const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  getProfile,
  updateProfile,
  verifyProfilePhone,
  deleteProfile,
  parseProfile,
  pendingProfilePhone,
} = require("../lib/profile.ts");
const {
  saveAuthSession,
  readAuthSession,
  clearAuthSession,
} = require("../lib/auth/session.ts");
const { ApiResponseError, ApiError } = require("../lib/api/client.ts");
const user = {
  name: "حساب الاختبار",
  phone: "1012345678",
  country_code: "+20",
  image: null,
};
const reply = (user) => ({ result: true, data: { user } });
function setup(t) {
  const previous = globalThis.window,
    previousStorage = globalThis.sessionStorage;
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const localValues = new Map();
  globalThis.window = {
    sessionStorage: storage,
    localStorage: {
      getItem: (key) => localValues.get(key) ?? null,
      setItem: (key, value) => localValues.set(key, value),
      removeItem: (key) => localValues.delete(key),
    },
    dispatchEvent: () => true,
  };
  globalThis.sessionStorage = storage;
  clearAuthSession();
  saveAuthSession({
    token: "fixture-profile-token",
    user: { name: user.name, phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
    if (previousStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previousStorage;
  });
}
test("profile parser accepts both documented envelopes and restricts avatar URLs", () => {
  assert.equal(parseProfile({ status: "success", data: user }).phone, "+201012345678");
  assert.equal(
    parseProfile(
      reply({ ...user, image: "https://admin.shinycarpet-sa.com/storage/profile/a.jpg" }),
    ).image,
    "https://admin.shinycarpet-sa.com/storage/profile/a.jpg",
  );
  assert.equal(
    parseProfile(reply({ ...user, image: "https://other.example/a.jpg" })).image,
    null,
  );
  assert.throws(() => parseProfile({ status: "success", data: [] }), ApiResponseError);
  assert.throws(() => parseProfile({ result: false, message: "خطأ" }), ApiError);
});
test("profile requests send Arabic and bearer; multipart upload preserves token and confirms new phone through dedicated endpoint", async (t) => {
  setup(t);
  const calls = [];
  let current = user;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.headers["Accept-Language"], "ar");
    assert.equal(options.headers.Authorization, "Bearer fixture-profile-token");
    assert.ok(url.startsWith("https://admin.shinycarpet-sa.com/api/profile"));
    if (options.method === "GET")
      return Response.json({ status: "success", data: current });
    if (url.endsWith("/verify")) return Response.json(reply(current));
    if (options.method === "DELETE")
      return Response.json({ status: "success", message: "تم الحذف" });
    current = {
      ...user,
      name: "الاسم الجديد",
      phone: options.body.get("phone"),
      image: "https://admin.shinycarpet-sa.com/storage/profile/a.jpg",
    };
    return Response.json(reply(current));
  });
  await getProfile();
  const image = new File(["image"], "photo.jpg", { type: "image/jpeg" });
  const result = await updateProfile("الاسم الجديد", "+201112345678", image);
  assert.equal(result.profile.phone, "+201012345678");
  assert.equal(result.profile.name, "الاسم الجديد");
  assert.equal(calls.at(-1).options.body.get("image"), image);
  assert.equal(calls.at(-1).options.body.get("country_code"), "+20");
  assert.equal(calls.at(-1).options.headers["Content-Type"], undefined);
  assert.equal(pendingProfilePhone().phone, "1112345678");
  await getProfile();
  assert.equal(readAuthSession().profile.phone, "+201012345678");
  await verifyProfilePhone("١٢٣٤٥٦");
  assert.equal(calls.at(-1).url, "https://admin.shinycarpet-sa.com/api/profile/verify");
  assert.equal(JSON.parse(calls.at(-1).options.body).code, "123456");
  assert.equal(readAuthSession().profile.phone, "+201112345678");
  assert.equal(readAuthSession().token, "fixture-profile-token");
  assert.equal(pendingProfilePhone(), null);
  await deleteProfile();
  assert.equal(calls.at(-1).options.method, "DELETE");
  assert.equal(readAuthSession(), null);
});
test("failed updates and deletion preserve the session; invalid uploads make no request and 401 clears authentication", async (t) => {
  setup(t);
  let count = 0;
  const mock = t.mock.method(globalThis, "fetch", async () => {
    count++;
    return Response.json({ message: "تعذر الحفظ" }, { status: 422 });
  });
  await assert.rejects(
    updateProfile(
      "اسم",
      "+201012345678",
      new File(["a"], "a.svg", { type: "image/svg+xml" }),
    ),
    ApiError,
  );
  assert.equal(count, 0);
  await assert.rejects(updateProfile("اسم", "+201112345678"), ApiError);
  assert.equal(pendingProfilePhone(), null);
  await assert.rejects(deleteProfile(), ApiError);
  assert.ok(readAuthSession());
  mock.mock.mockImplementation(async () =>
    Response.json({ message: "Unauthenticated" }, { status: 401 }),
  );
  await assert.rejects(getProfile(), ApiError);
  assert.equal(readAuthSession(), null);
});


test("profile saves wait beyond ten seconds for the server response", async (t) => {
  setup(t);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(options.body.get("name"), "اسم جديد");
    await require("node:timers/promises").setTimeout(10_100, undefined, {
      signal: options.signal,
    });
    return Response.json(reply({ ...user, name: "اسم جديد" }));
  });
  const result = await updateProfile("اسم جديد", "+201012345678");
  assert.equal(result.profile.name, "اسم جديد");
});
