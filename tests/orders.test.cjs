const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  parseOrder,
  fetchOrders,
  fetchOrder,
  cancelOrder,
  createOrder,
  applyCoupon,
  orderImage,
} = require("../lib/api/orders.ts");
const { orderStages, isOrderDelivered } = require("../lib/order-status.ts");
const { ApiError, ApiResponseError } = require("../lib/api/client.ts");
const { saveAuthSession, clearAuthSession } = require("../lib/auth/session.ts");
const row = {
  id: 12,
  status: "ordered",
  subtotal: "800.00",
  vat_amount: "112.00",
  total: "912.00",
  created_at: "2025-07-27 11:59:21",
  items: [
    {
      id: 12,
      quantity: 1,
      price: "800",
      length: 2,
      width: 4,
      product: {
        id: 8,
        name: "سجاد",
        images: ["http://127.0.0.1:8000/storage/products/rug.png"],
      },
      product_size: { id: 11 },
    },
  ],
  order_images: ["http://127.0.0.1:8000/storage/order_images/photo.png"],
};
const ok = (data) => ({ success: true, data });
test("parses numeric strings, nullable fields and summary responses without invented products", () => {
  const order = parseOrder(row, true);
  assert.equal(parseOrder({ ...row, status: "confirmed" }, true).status, "confirmed");
  assert.equal(order.total, 912);
  assert.equal(
    order.items[0].product.image,
    "https://admin.shinycarpet-sa.com/storage/products/rug.png",
  );
  assert.equal(order.items[0].dimensions.width, 4);
  assert.equal(order.address, undefined);
  assert.equal(order.date, undefined);
  assert.equal(
    order.photos[0].preview,
    "https://admin.shinycarpet-sa.com/storage/order_images/photo.png",
  );
  assert.equal(parseOrder({ ...row, items: undefined }).items.length, 0);
  for (const patch of [
    { total: "bad" },
    { status: "cleaning" },
    { created_at: "bad" },
    { id: 0 },
  ])
    assert.throws(() => parseOrder({ ...row, ...patch }), ApiResponseError);
  assert.throws(() => parseOrder({ ...row, items: undefined }, true), ApiResponseError);
  assert.equal(orderImage("https://evil.example/storage/order_images/x.png"), undefined);
});
test("authenticated endpoints, multipart files, server coupon totals, failures and cancellation", async (t) => {
  const originalWindow = global.window,
    originalFetch = global.fetch;
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => values.set(k, v),
      removeItem: (k) => values.delete(k),
    },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    dispatchEvent() {},
  };
  saveAuthSession({
    token: "fixture-orders-token",
    user: { name: "حساب", phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    global.window = originalWindow;
    global.fetch = originalFetch;
  });
  const calls = [];
  let response = ok(row);
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  response = ok([row, { ...row, id: 13, status: "cancelled" }]);
  assert.equal((await fetchOrders("ordered")).length, 1);
  assert.ok(calls.at(-1).url.endsWith("/orders?status=ordered"));
  response = ok(row);
  await fetchOrder(12);
  assert.equal(calls.at(-1).options.headers.Authorization, "Bearer fixture-orders-token");
  await assert.rejects(fetchOrder(288), ApiResponseError);
  await createOrder({
    addressId: 97,
    phone: "+201012345678",
    note: " ملاحظة ",
    images: [new File(["image"], "rug.png", { type: "image/png" })],
  });
  const body = calls.at(-1).options.body;
  assert.ok(body instanceof FormData);
  assert.equal(body.get("address_id"), "97");
  assert.equal(body.get("phone"), "1012345678");
  assert.equal(body.get("country_code"), "20");
  assert.equal(body.get("note"), "ملاحظة");
  assert.equal(body.get("coupon_code"), null);
  assert.equal(body.get("images[]").name, "rug.png");
  assert.equal(calls.at(-1).options.headers["Content-Type"], undefined);
  response = ok({
    cart_subtotal: 5300,
    discount: 12,
    vat_percentage: 14,
    vat_amount: 740.32,
    cart_total: 6028.32,
    coupon_code: "DFDF",
  });
  const quote = await applyCoupon("SHINY20");
  assert.equal(quote.code, "DFDF");
  assert.equal(quote.total, 6028.32);
  assert.equal(calls.at(-1).options.body.get("coupon_code"), "SHINY20");
  response = { success: false, message: "كود غير صحيح" };
  await assert.rejects(applyCoupon("INVALID"), ApiError);
  response = ok({ ...row, status: "cancelled", items: undefined });
  assert.equal((await cancelOrder(12)).status, "cancelled");
  assert.ok(calls.at(-1).url.endsWith("/orders/12/cancel"));
  const count = calls.length;
  await assert.rejects(cancelOrder(0), RangeError);
  assert.equal(calls.length, count);
  clearAuthSession();
  await assert.rejects(fetchOrder(12), (e) => e.status === 401);
  assert.equal(calls.length, count);
});

test("all backend workflow statuses parse and map to the timeline", () => {
  for (const stage of orderStages) {
    const order = parseOrder({ ...row, status: stage.id }, true);
    assert.equal(order.status, stage.id);
    assert.ok(stage.step >= -1 && stage.step <= 6);
  }
  assert.equal(isOrderDelivered("delivered_to_customer"), true);
  assert.equal(isOrderDelivered("paid"), false);
});
