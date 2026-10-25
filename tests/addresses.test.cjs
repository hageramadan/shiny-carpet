const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  parseAddress,
  parseAddresses,
  addressInput,
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  TEMPORARY_ADDRESS_LOCATION_IDS,
} = require("../lib/api/addresses.ts");
const {
  saveAuthSession,
  clearAuthSession,
  readAuthSession,
} = require("../lib/auth/session.ts");
const { ApiError, ApiResponseError } = require("../lib/api/client.ts");
const { authDestination } = require("../lib/auth-flow.ts");
const row = {
  id: 5,
  title: "العمل",
  street: "شارع النصر",
  building_number: "12",
  floor: "3",
  apartment: "10",
  details: "بجوار المسجد",
  governorate_name: "القاهرة",
  city_name: "المعادي",
  lat: 32.0444,
  lng: 35.2357,
  notes: "افتح لما توصل",
  is_default: false,
};
const draft = {
  label: "العمل",
  street: "شارع النصر",
  building: "12",
  floor: "3",
  apartment: "10",
  details: "بجوار المسجد",
  region: "القاهرة",
  city: "المعادي",
  location: { lat: 32.0444, lng: 35.2357 },
  notes: "افتح لما توصل",
  ...TEMPORARY_ADDRESS_LOCATION_IDS,
};
const ok = (data) => ({ result: true, errNum: 200, data });
function setup(t) {
  const previous = globalThis.window,
    values = new Map();
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
  saveAuthSession({
    token: "fixture-address-token",
    user: { name: "حساب", phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });
}
test("address parser preserves server IDs, notes, coordinates and actual default flags", () => {
  const address = parseAddresses(ok({ addresses: [row] }))[0];
  assert.equal(address.id, "5");
  assert.equal(address.label, "العمل");
  assert.equal(address.building, "12");
  assert.equal(address.region, "القاهرة");
  assert.equal(address.city, "المعادي");
  assert.equal(address.notes, "افتح لما توصل");
  assert.equal(address.isDefault, false);
  assert.deepEqual(address.location, { lat: 32.0444, lng: 35.2357 });
  assert.equal(address.governorateId, undefined);
  assert.equal(
    parseAddress({ ...row, notes: null, lat: null, lng: null, is_default: true })
      .location,
    undefined,
  );
  assert.equal(parseAddress({ ...row, lat: "0", lng: "0" }).location.lat, 0);
  for (const value of [
    null,
    { addresses: null },
    { addresses: [{ ...row, id: "bad" }] },
    { addresses: [{ ...row, lat: 300 }] },
    { addresses: [row, row] },
  ])
    assert.throws(() => parseAddresses(ok(value)), ApiResponseError);
  assert.throws(
    () => parseAddresses({ result: false, errNum: 422, message: "فشل" }),
    (error) => error instanceof ApiError && error.status === 422,
  );
});
test("creation uses explicitly requested temporary IDs and update uses names without inventing returned IDs", () => {
  assert.deepEqual(addressInput(draft, true), {
    title: "العمل",
    street: "شارع النصر",
    building_number: "12",
    floor: "3",
    apartment: "10",
    details: "بجوار المسجد",
    lat: 32.0444,
    lng: 35.2357,
    notes: "افتح لما توصل",
    governorate_id: 1,
    area_id: 1,
    district_id: 10,
  });
  const update = addressInput({ ...draft, street: "", building: "", notes: "" }, false);
  assert.equal(update.street, "");
  assert.equal(update.building_number, "");
  assert.equal(update.notes, null);
  assert.equal(update.governorate_name, "القاهرة");
  assert.equal(update.city_name, "المعادي");
  assert.equal(update.governorate_id, undefined);
  assert.throws(() => addressInput({ ...draft, districtId: undefined }, true), ApiError);
  assert.throws(() => addressInput({ ...draft, location: undefined }, true), ApiError);
});
test("CRUD requests send bearer and Arabic, serialize PUT JSON and trust returned address fields", async (t) => {
  setup(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.ok(url.startsWith("https://admin.shinycarpet-sa.com/api/addresses"));
    assert.equal(options.headers.Authorization, "Bearer fixture-address-token");
    assert.equal(options.headers["Accept-Language"], "ar");
    if (options.method === "GET") return Response.json(ok({ addresses: [row] }));
    if (options.method === "DELETE") return Response.json(ok([]));
    return Response.json(ok({ address: row }));
  });
  assert.equal((await fetchAddresses())[0].id, "5");
  assert.equal((await createAddress(draft)).id, "5");
  const updated = await updateAddress("5", { ...draft, floor: "4" });
  assert.equal(updated.floor, "3");
  assert.equal(calls.at(-1).options.method, "PUT");
  assert.equal(calls.at(-1).options.headers["Content-Type"], "application/json");
  assert.equal(JSON.parse(calls.at(-1).options.body).floor, "4");
  assert.equal(JSON.parse(calls.at(-1).options.body).title, "العمل");
  await deleteAddress("5");
  assert.equal(calls.at(-1).url, "https://admin.shinycarpet-sa.com/api/addresses/5");
  assert.equal(calls.at(-1).options.method, "DELETE");
  const count = calls.length;
  await assert.rejects(deleteAddress("../5"), RangeError);
  assert.equal(calls.length, count);
  clearAuthSession();
  await assert.rejects(
    fetchAddresses(),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(calls.length, count);
});
test("failed writes preserve the session, expired authentication clears it, and address return paths stay local", async (t) => {
  setup(t);
  const mock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ message: "تعذر الحفظ" }, { status: 422 }),
  );
  await assert.rejects(createAddress(draft), ApiError);
  assert.ok(readAuthSession());
  mock.mock.mockImplementation(async () =>
    Response.json({ message: "Unauthenticated" }, { status: 401 }),
  );
  await assert.rejects(fetchAddresses(), ApiError);
  assert.equal(readAuthSession(), null);
  for (const path of ["/addresses", "/addresses/new", "/addresses/5/edit"])
    assert.equal(authDestination(path), path);
  for (const path of [
    "//evil.example",
    "/addresses/../5/edit",
    "/addresses/5/edit?next=https://evil.example",
  ])
    assert.equal(authDestination(path), "/profile");
});
