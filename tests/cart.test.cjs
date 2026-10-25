const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  parseCart,
  parseCartCount,
  cartAddInput,
  fetchCart,
  addCartItem,
  setCartQuantity,
  removeCartItem,
  clearRemoteCart,
} = require("../lib/api/cart.ts");
const { itemPrice } = require("../lib/data.ts");
const { ApiError, ApiResponseError } = require("../lib/api/client.ts");
const { saveAuthSession, clearAuthSession } = require("../lib/auth/session.ts");
const success = (data) => ({ success: true, data });
const item = (overrides = {}) => ({
  id: 15,
  quantity: "3",
  price: 4500,
  length: 3,
  width: 5,
  number_of_person: null,
  product: { id: 11, name: "سجاد", images: [], price_per_unit: "100.00" },
  product_size: { id: 673, length: "3.00", width: "5.00" },
  ...overrides,
});
const totals = {
  cart_subtotal: 5300,
  vat_percentage: "14.00",
  vat_amount: 742,
  cart_total: 6042,
};
function setup(t) {
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
  saveAuthSession({
    token: "fixture-cart-token",
    user: { name: "حساب", phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });
}
test("cart keeps server totals and row IDs, and a line price already includes quantity", () => {
  const cart = parseCart(success({ ...totals, cart_items: [item()] }));
  assert.equal(cart.items[0].cartItemId, 15);
  assert.equal(cart.items[0].product.apiId, 11);
  assert.equal(cart.items[0].sizeId, 673);
  assert.equal(itemPrice(cart.items[0]), 4500);
  assert.equal(cart.total, 6042);
  assert.equal(cart.subtotal, 5300);
  assert.equal(cart.vat, 742);
  assert.equal(cart.vatPercentage, 14);
  assert.equal(parseCartCount(success({ item_count: 1 })), 1);
  const custom = parseCart(
    success({
      ...totals,
      cart_items: [
        item({ product_size: null, quantity: 1, price: 400, length: 2, width: 2 }),
      ],
    }),
  ).items[0];
  assert.equal(custom.sizeId, undefined);
  assert.equal(custom.sizeLabel, "2 × 2 متر");
  assert.equal(itemPrice(custom), 400);
  const blanket = parseCart(
    success({
      ...totals,
      cart_items: [
        item({ length: null, width: null, number_of_person: 2, product_size: null }),
      ],
    }),
  ).items[0];
  assert.equal(blanket.sizeLabel, "2 أشخاص");
});
test("malformed responses never turn into an empty/default cart", () => {
  for (const data of [
    { ...totals, cart_items: null },
    { ...totals, cart_items: [item({ quantity: "bad" })] },
    { ...totals, cart_total: null, cart_items: [] },
    { ...totals, cart_items: [item(), item()] },
    { ...totals, cart_items: [item({ price: -1 })] },
  ])
    assert.throws(() => parseCart(success(data)), ApiResponseError);
  assert.throws(() => parseCart({ success: false, message: "فشل" }), ApiError);
  assert.throws(() => parseCartCount(success({ item_count: -1 })), ApiResponseError);
});
test("add payload uses a real size ID for fixed sizes and omits it for custom dimensions", () => {
  assert.deepEqual(
    cartAddInput(
      { apiId: 11 },
      { size: 15, sizeId: 673, dimensions: { length: 3, width: 5 } },
      1,
    ),
    { product_id: 11, product_size_id: 673, length: 3, width: 5, quantity: 1 },
  );
  assert.deepEqual(
    cartAddInput({ apiId: 6 }, { size: 4, dimensions: { length: 2, width: 2 } }, 2),
    { product_id: 6, length: 2, width: 2, quantity: 2 },
  );
});
test("all seven cart endpoints send the current bearer token and Arabic with correct JSON/form bodies", async (t) => {
  setup(t);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.headers.Authorization, "Bearer fixture-cart-token");
    assert.equal(options.headers["Accept-Language"], "ar");
    if (url.endsWith("/count")) return Response.json(success({ item_count: 1 }));
    if (options.method === "GET")
      return Response.json(success({ ...totals, cart_items: [item()] }));
    return Response.json({ success: true });
  });
  assert.equal((await fetchCart()).count, 1);
  await addCartItem({
    product_id: 11,
    product_size_id: 673,
    length: 3,
    width: 5,
    quantity: 1,
    ignored: "extra",
  });
  assert.deepEqual(JSON.parse(calls.at(-1).options.body), {
    product_id: 11,
    product_size_id: 673,
    length: 3,
    width: 5,
    quantity: 1,
  });
  await addCartItem({ product_id: 6, length: 2, width: 2, quantity: 1 });
  assert.equal(JSON.parse(calls.at(-1).options.body).product_size_id, undefined);
  await setCartQuantity(15, 3);
  assert.equal(calls.at(-1).url, "https://admin.shinycarpet-sa.com/api/cart/item/15");
  assert.equal(calls.at(-1).options.body.get("quantity"), "3");
  assert.equal(calls.at(-1).options.headers["Content-Type"], undefined);
  await removeCartItem(15);
  assert.equal(calls.at(-1).url, "https://admin.shinycarpet-sa.com/api/cart/15");
  assert.equal(calls.at(-1).options.method, "DELETE");
  await clearRemoteCart();
  assert.equal(calls.at(-1).url, "https://admin.shinycarpet-sa.com/api/cart");
  assert.equal(calls.at(-1).options.method, "DELETE");
  const count = calls.length;
  await assert.rejects(setCartQuantity(15, 0), RangeError);
  await assert.rejects(removeCartItem(-1), RangeError);
  await assert.rejects(
    addCartItem({ product_id: 1, quantity: 1, length: 2 }),
    RangeError,
  );
  assert.equal(calls.length, count);
  clearAuthSession();
  await assert.rejects(
    fetchCart(),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(calls.length, count);
});
