const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  createPaymentCheckout,
  parsePaymentCheckout,
  paymentBrands,
  fetchPaymentStatus,
  parsePaymentStatus,
} = require("../lib/api/payments.ts");
const { saveAuthSession, clearAuthSession } = require("../lib/auth/session.ts");
const { ApiError, ApiResponseError } = require("../lib/api/client.ts");
const data = {
  checkout_id: "fixture.prod01-vm-tx14",
  order_id: 532,
  amount: "40.25",
  currency: "SAR",
  payment_url:
    "https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=fixture.prod01-vm-tx14",
};
const reply = (patch = {}) => ({ success: true, data: { ...data, ...patch } });
test("checkout validates matching order, amount, currency and the payment widget URL", () => {
  assert.equal(parsePaymentCheckout(reply(), 532).amount, 40.25);
  for (const patch of [
    { order_id: 533 },
    { amount: "" },
    { amount: -1 },
    { amount: "NaN" },
    { currency: "USD" },
    { checkout_id: "<script>" },
    {
      payment_url:
        "https://evil.example/v1/paymentWidgets.js?checkoutId=fixture.prod01-vm-tx14",
    },
    { payment_url: data.payment_url + "&checkoutId=other" },
    { payment_url: data.payment_url.replace("fixture.prod01-vm-tx14", "other") },
    { payment_url: data.payment_url.replace("https:", "http:") },
    { payment_url: data.payment_url.replace("paymentWidgets.js", "other.js") },
  ])
    assert.throws(() => parsePaymentCheckout(reply(patch), 532), ApiResponseError);
  assert.throws(
    () => parsePaymentCheckout({ success: false, message: "فشل" }, 532),
    ApiError,
  );
});
test("all four brands POST only order_id and payment_brand with bearer and Arabic headers", async (t) => {
  const previousWindow = global.window;
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  global.window = {
    localStorage: storage,
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    dispatchEvent: () => true,
  };
  clearAuthSession();
  saveAuthSession({
    token: "fixture-payments-token",
    user: { name: "حساب", phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    global.window = previousWindow;
  });
  const calls = [];
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.equal(url, "https://admin.shinycarpet-sa.com/api/payments/checkout");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer fixture-payments-token");
    assert.equal(options.headers["Accept-Language"], "ar");
    assert.equal(options.headers["Content-Type"], "application/json");
    return Response.json(reply());
  });
  for (const brand of paymentBrands) {
    assert.equal((await createPaymentCheckout(532, brand)).orderId, 532);
    assert.deepEqual(JSON.parse(calls.at(-1).options.body), {
      order_id: 532,
      payment_brand: brand,
    });
  }
  mock.mock.mockImplementation(async (url, options) => {
    assert.equal(url, "https://admin.shinycarpet-sa.com/api/payments/status");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), {
      order_id: 532,
      checkout_id: data.checkout_id,
    });
    return Response.json(
      {
        success: false,
        data: {
          payment_status: "failed",
          result_code: "000.200.000",
          result_description: "transaction pending",
        },
      },
      { status: 422 },
    );
  });
  assert.equal(await fetchPaymentStatus(532, data.checkout_id), "pending");
  mock.mock.mockImplementation(async () =>
    Response.json(
      { success: false, data: { payment_status: "failed", result_code: "800.100.100" } },
      { status: 422 },
    ),
  );
  assert.equal(await fetchPaymentStatus(532, data.checkout_id), "failed");
  mock.mock.mockImplementation(async () =>
    Response.json({ success: true, data: { payment_status: "paid" } }),
  );
  assert.equal(await fetchPaymentStatus(532, data.checkout_id), "paid");
  mock.mock.mockImplementation(async () =>
    Response.json(
      { message: "Validation error", errors: { checkout_id: ["Invalid"] } },
      { status: 422 },
    ),
  );
  await assert.rejects(
    fetchPaymentStatus(532, data.checkout_id),
    (e) => e instanceof ApiError && e.status === 422,
  );
  mock.mock.mockImplementation(async () =>
    Response.json({ success: true, data: { payment_status: "paid" } }, { status: 422 }),
  );
  await assert.rejects(
    fetchPaymentStatus(532, data.checkout_id),
    (e) => e instanceof ApiError && e.status === 422,
  );
  await assert.rejects(fetchPaymentStatus(532, "../other"), RangeError);
  const count = calls.length;
  await assert.rejects(createPaymentCheckout(0, "VISA"), RangeError);
  await assert.rejects(createPaymentCheckout(532, "OTHER"), RangeError);
  assert.equal(calls.length, count);
  mock.mock.mockImplementation(async () =>
    Response.json({ message: "تعذر تجهيز الدفع" }, { status: 422 }),
  );
  await assert.rejects(
    createPaymentCheckout(532, "VISA"),
    (e) => e instanceof ApiError && e.status === 422,
  );
  const controller = new AbortController();
  mock.mock.mockImplementation(async () => {
    controller.abort();
    return Response.json(reply());
  });
  await assert.rejects(
    createPaymentCheckout(532, "VISA", controller.signal),
    (e) => e.name === "AbortError",
  );
  clearAuthSession();
  await assert.rejects(createPaymentCheckout(532, "VISA"), (e) => e.status === 401);
});

test("status never confirms pending, conflicting, or unknown responses as paid", () => {
  const parse = (success, payment_status, result_code) =>
    parsePaymentStatus(
      { success, data: { payment_status, result_code } },
      532,
      data.checkout_id,
    );
  assert.equal(parse(false, "failed", "000.200.000"), "pending");
  assert.equal(parse(true, "paid", "000.200.000"), "pending");
  assert.equal(parse(false, "pending"), "pending");
  assert.equal(parse(false, "failed", "800.100.100"), "failed");
  assert.equal(parse(true, "paid", "000.000.000"), "paid");
  assert.equal(parse(false, "paid", "000.000.000"), "unknown");
  assert.equal(parse(true, "authorized"), "unknown");
  assert.equal(parse(true, "paid", "800.100.100"), "unknown");
  assert.throws(
    () =>
      parsePaymentStatus(
        { success: true, data: { payment_status: "paid", order_id: 533 } },
        532,
        data.checkout_id,
      ),
    ApiResponseError,
  );
  assert.throws(
    () =>
      parsePaymentStatus(
        { success: true, data: { payment_status: "paid", checkout_id: "other" } },
        532,
        data.checkout_id,
      ),
    ApiResponseError,
  );
  assert.throws(
    () => parsePaymentStatus({ success: true, data: {} }, 532, data.checkout_id),
    ApiResponseError,
  );
});

test("payment return only signals verification and rejects malformed order or checkout IDs", async () => {
  const { GET } = require("../app/payment-result/route.ts");
  const response = GET(
    new Request(
      "http://localhost:3000/payment-result?order=532&checkout_id=fixture.prod01&resourcePath=ignored",
    ),
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('"orderId":532'));
  assert.ok(html.includes('"checkoutId":"fixture.prod01"'));
  assert.ok(html.includes("postMessage"));
  assert.ok(!html.includes("تم تأكيد الدفع بنجاح"));
  for (const query of [
    "order=bad&checkout_id=fixture",
    "order=532&checkout_id=%3Cscript%3E",
    "order=532",
  ])
    assert.equal(
      GET(new Request("http://localhost:3000/payment-result?" + query)).status,
      400,
    );
});
