const assert = require("node:assert/strict");
const { test } = require("node:test");
const { submitRating } = require("../lib/api/ratings.ts");
const { parseOrder } = require("../lib/api/orders.ts");
const { canRateOrder } = require("../lib/order-rating.ts");
const { ApiError, ApiResponseError } = require("../lib/api/client.ts");
const { saveAuthSession, clearAuthSession } = require("../lib/auth/session.ts");
const row = {
  id: 541,
  status: "paid",
  user_paid: true,
  is_received: false,
  is_rated: false,
  subtotal: "1.00",
  vat_amount: "0.15",
  total: "1.15",
  created_at: "2026-10-31 00:09:41",
  items: [],
};

test("rating requires a delivered and paid order with an explicit unrated flag", () => {
  assert.equal(canRateOrder(parseOrder(row, true)), true);
  assert.equal(
    canRateOrder(parseOrder({ ...row, status: "delivered_to_customer" })),
    true,
  );
  assert.equal(canRateOrder(parseOrder({ ...row, status: "delivered" })), true);
  for (const status of ["ordered", "confirmed", "arrived_to_customer_again", "cancelled"])
    assert.equal(canRateOrder(parseOrder({ ...row, status })), false);
  assert.equal(
    canRateOrder(
      parseOrder({ ...row, status: "delivered_to_customer", user_paid: false }),
    ),
    false,
  );
  assert.equal(canRateOrder(parseOrder({ ...row, is_rated: true })), false);
  assert.equal(canRateOrder(parseOrder({ ...row, is_rated: undefined })), false);
  assert.equal(canRateOrder(parseOrder({ ...row, is_rated: "0", user_paid: "1" })), true);
  assert.equal(canRateOrder(parseOrder({ ...row, is_rated: 1 })), false);
});

test("rating sends only the documented fields with auth, rejects invalid scores and propagates failure", async (t) => {
  const originalWindow = global.window,
    originalFetch = global.fetch;
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    dispatchEvent() {},
  };
  saveAuthSession({
    token: "fixture-ratings-token",
    user: { name: "حساب", phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    global.window = originalWindow;
    global.fetch = originalFetch;
  });
  const calls = [];
  let reply = { success: true, message: "Rating submitted successfully." },
    status = 201;
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(reply, { status });
  };
  await submitRating(541, 4);
  assert.ok(calls[0].url.endsWith("/ratings"));
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.Authorization, "Bearer fixture-ratings-token");
  assert.equal(calls[0].options.headers["Accept-Language"], "ar");
  assert.deepEqual(JSON.parse(calls[0].options.body), { order_id: 541, rating: 4 });
  for (const score of [0, 6, -1, 1.5, NaN, "4"])
    await assert.rejects(submitRating(541, score), RangeError);
  await assert.rejects(submitRating(0, 4), RangeError);
  assert.equal(calls.length, 1);
  reply = { success: false, message: "تم تقييم الطلب مسبقًا" };
  status = 422;
  await assert.rejects(
    submitRating(541, 4),
    (error) => error instanceof ApiError && error.status === 422,
  );
  reply = {};
  status = 200;
  await assert.rejects(submitRating(541, 4), ApiResponseError);
  reply = { success: false };
  status = 200;
  await assert.rejects(submitRating(541, 4), ApiError);
  clearAuthSession();
  await assert.rejects(
    submitRating(541, 4),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(calls.length, 4);
});
