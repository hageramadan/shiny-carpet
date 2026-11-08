const assert = require("node:assert/strict");
const { test } = require("node:test");
const { canEditOrder, orderStages } = require("../lib/order-status.ts");
const { parseOrder } = require("../lib/api/orders.ts");
const {
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  updateOrderImages,
  updateOrderCoupon,
} = require("../lib/api/order-edit.ts");
const { saveAuthSession, clearAuthSession } = require("../lib/auth/session.ts");
const { ApiError } = require("../lib/api/client.ts");
const early = [
  "ordered",
  "confirmed",
  "processing",
  "pickup_from_customer",
  "driver_on_way_to_customer",
  "arrived_to_customer",
];
test("editing stops at pickup and respects server permission, driver progress and receipt flags", () => {
  for (const { id } of orderStages)
    assert.equal(canEditOrder({ status: id }), early.includes(id), id);
  assert.equal(
    canEditOrder({ status: "confirmed", driverTask: "picked_up_from_customer" }),
    false,
  );
  assert.equal(canEditOrder({ status: "ordered", canEdit: false }), false);
  assert.equal(canEditOrder({ status: "ordered", isReceived: true }), false);
  assert.equal(canEditOrder({ status: "paid", driverTask: "confirmed" }), true);
  assert.equal(
    canEditOrder({ status: "paid", driverTask: "deliver_to_customer" }),
    false,
  );
});
test("order item IDs, address snapshot and delivery fees are preserved independently of product IDs", () => {
  const order = parseOrder(
    {
      id: 369,
      status: "ordered",
      can_edit: 1,
      is_received: 0,
      created_at: "2026-11-08 10:00:00",
      subtotal: 20,
      vat_amount: 3,
      delivery_fee: 10,
      total: 33,
      address: {
        id: 19,
        title: "البيت",
        street: "الشارع",
        building_number: "5",
        city: { name: "الرياض" },
      },
      items: [
        {
          id: 524,
          quantity: 1,
          price: 20,
          product: { id: 71, name: "منتج", images: [] },
          product_size: { id: 74 },
        },
      ],
    },
    true,
  );
  assert.equal(order.items[0].orderItemId, 524);
  assert.equal(order.items[0].product.apiId, 71);
  assert.equal(order.items[0].sizeId, 74);
  assert.equal(order.address.id, "19");
  assert.equal(order.address.city, "الرياض");
  assert.equal(order.pricing.delivery, 10);
  assert.equal(order.canEdit, true);
  assert.equal(order.isReceived, false);
});
function session(t) {
  const previous = { window: global.window, document: global.document };
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
  global.document = {
    cookie: "shiny-carpet-language=en",
    documentElement: { lang: "en" },
  };
  saveAuthSession({
    token: "edit-token",
    user: { name: "Test", phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete global[key];
      else global[key] = value;
    }
  });
}
test("order edit transports use exact order/line paths, PUT multipart, append images, and selected language", async (t) => {
  session(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json({ success: true, data: {} });
  });
  await addOrderItem(369, { product_id: 71, product_size_id: 74, quantity: 1 });
  assert.ok(calls[0].url.endsWith("/orders/369/items"));
  assert.equal(calls[0].options.method, "PUT");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    product_id: 71,
    quantity: 1,
    product_size_id: 74,
  });
  const file = new File(["image"], "photo.png", { type: "image/png" });
  await updateOrderItem(369, 524, { quantity: 2, length: 8, width: 10, images: [file] });
  const update = calls[1];
  assert.ok(update.url.endsWith("/orders/369/items/524"));
  assert.equal(update.options.method, "PUT");
  assert.ok(update.options.body instanceof FormData);
  assert.equal(update.options.body.get("quantity"), "2");
  assert.equal(update.options.body.get("width"), "10");
  assert.equal(update.options.body.get("length"), "8");
  assert.equal(update.options.body.getAll("images[]").length, 1);
  assert.equal(update.options.headers["Content-Type"], undefined);
  await removeOrderItem(25, 825);
  assert.ok(calls[2].url.endsWith("/orders/25/items/825"));
  assert.equal(calls[2].options.method, "DELETE");
  assert.equal(calls[2].options.body, undefined);
  await updateOrderImages(369, { images: [file], note: "ملاحظة" });
  assert.ok(calls[3].url.endsWith("/orders/369/images"));
  assert.equal(calls[3].options.method, "PUT");
  assert.equal(calls[3].options.body.get("note"), "ملاحظة");
  assert.equal(calls[3].options.body.has("existing_images"), false);
  await updateOrderCoupon(369, " CODE ");
  assert.ok(calls[4].url.endsWith("/orders/369/update-coupon"));
  assert.equal(calls[4].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[4].options.body), { coupon_code: "CODE" });
  assert.ok(
    calls.every(
      (call) =>
        call.options.headers.Authorization === "Bearer edit-token" &&
        call.options.headers["Accept-Language"] === "en",
    ),
  );
  const count = calls.length;
  for (const input of [
    { quantity: 0 },
    { quantity: 1, width: 0, length: 1 },
    { quantity: 1, width: 2 },
    { quantity: 100 },
  ])
    await assert.rejects(updateOrderItem(369, 524, input), RangeError);
  await assert.rejects(removeOrderItem(369, 0), RangeError);
  await assert.rejects(
    updateOrderImages(369, {
      images: [new File(["bad"], "file.pdf", { type: "application/pdf" })],
      note: "",
    }),
    RangeError,
  );
  assert.equal(calls.length, count);
});
test("server write failures are preserved without treating them as successful edits", async (t) => {
  session(t);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ success: false, message: "Order is locked" }, { status: 409 }),
  );
  await assert.rejects(
    updateOrderItem(369, 524, { quantity: 2 }),
    (error) => error instanceof ApiError && error.status === 409,
  );
});
