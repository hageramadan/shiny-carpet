const assert = require("node:assert/strict");
const { test } = require("node:test");
const { ApiError, ApiResponseError, getJson } = require("../lib/api/client.ts");
const { parseCategories } = require("../lib/categories.ts");
const {
  getApiProduct,
  getProductsByCategory,
  parseProduct,
  parseProducts,
  calculateCustomProductPrice,
} = require("../lib/api-products.ts");
const { productSizeOptions, resolveProductSize } = require("../lib/product-selection.ts");

const response = (data) => ({ success: true, data });
const product = (overrides = {}) => ({
  id: 11,
  category: { id: 16, name: "غسيل سجاد" },
  name: "سجاد",
  has_sizes: 1,
  has_discount: false,
  min_price_before_discount: "10",
  min_price_after_discount: null,
  price_per_unit: "10",
  price_after_discount: 0,
  images: "https://admin.shinycarpet-sa.com/storage/products/carpet.jpg",
  sizes: null,
  ...overrides,
});

test("categories validate identifiers and names, with a safe image fallback", () => {
  assert.deepEqual(parseCategories(response([{ id: 16, name: " سجاد ", image: null }])), [
    { id: 16, name: "سجاد", image: null },
  ]);
  for (const id of [0, -1, 1.5, "16", Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => parseCategories(response([{ id, name: "سجاد" }])),
      ApiResponseError,
    );
  }
  assert.throws(
    () => parseCategories(response([{ id: 16, name: " " }])),
    ApiResponseError,
  );
});

test("failed and malformed envelopes do not become empty lists", () => {
  for (const body of [
    null,
    [],
    { success: false, data: [] },
    response({}),
    { success: true },
  ]) {
    assert.throws(() => parseCategories(body), ApiResponseError);
    assert.throws(() => parseProducts(body, 16), ApiResponseError);
  }
  assert.deepEqual(parseProducts(response([]), 16), []);
});

test("catalog images remain restricted to the configured host and storage directory", () => {
  for (const image of [
    "https://example.com/storage/products/a.jpg",
    "https://admin.shinycarpet-sa.com/storage/categories/a.jpg",
    "https://user:pass@admin.shinycarpet-sa.com/storage/products/a.jpg",
    "https://admin.shinycarpet-sa.com/storage/products/a.jpg?url=other",
    "javascript:alert(1)",
  ]) {
    assert.equal(
      parseProduct(response(product({ images: image })), 11).image,
      "/images/logo1.png",
    );
  }
});

test("list and details preserve prices and ignore an inactive zero discount", () => {
  const [listed] = parseProducts(response([product()]), 16);
  const detail = parseProduct(response(product()), 11);
  assert.deepEqual(listed, detail);
  assert.equal(detail.price, 10);
  assert.equal(detail.pricePerUnit, 10);
  assert.equal(detail.originalPrice, undefined);
  assert.equal(detail.currency, "SAR");
});

test("fixed-size prices are used directly without multiplying by the area", () => {
  const detail = parseProduct(
    response(
      product({
        has_discount: true,
        min_price_before_discount: "40",
        min_price_after_discount: "30",
        sizes: [
          {
            id: 677,
            length: 2,
            width: 2,
            price_before_discount: "40",
            price_after_discount: "30",
          },
        ],
      }),
    ),
    11,
  );
  assert.equal(detail.price, 30);
  assert.equal(detail.originalPrice, 40);
  assert.deepEqual(detail.sizes[0], {
    id: 677,
    label: "2 × 2 متر",
    price: 30,
    originalPrice: 40,
    dimensions: { length: 2, width: 2 },
  });
});

test("products without sizes use the piece price and allow an explicit free discount", () => {
  const detail = parseProduct(
    response(
      product({
        has_sizes: 0,
        price: "25",
        has_discount: true,
        min_price_after_discount: 0,
      }),
    ),
    11,
  );
  assert.equal(detail.price, 0);
  assert.equal(detail.originalPrice, 25);
  assert.equal(detail.unit, "قطعة");
});

test("unexpected identifiers and invalid prices fail before reaching the UI", () => {
  assert.throws(() => parseProducts(response([product()]), 18), ApiResponseError);
  assert.throws(() => parseProduct(response(product()), 999), ApiResponseError);
  for (const price of [-1, "", "wrong", null, Infinity]) {
    assert.throws(
      () => parseProduct(response(product({ min_price_before_discount: price })), 11),
      ApiResponseError,
    );
  }
  assert.throws(
    () => parseProduct(response(product({ sizes: [{}] })), 11),
    ApiResponseError,
  );
});

test("requests use Arabic JSON headers, no-store, and propagate cancellation", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", (url, options) => {
    assert.ok(String(url).endsWith("/products/category/16"));
    assert.equal(options.headers["Accept-Language"], "ar");
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.cache, "no-store");
    return new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), {
        once: true,
      });
    });
  });
  const pending = getProductsByCategory(16, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});

test("only a details 404 becomes a missing product; server failures stay errors", async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 404 }),
  );
  assert.equal(await getApiProduct(11), undefined);
  await assert.rejects(
    getProductsByCategory(16),
    (error) => error instanceof ApiError && error.status === 404,
  );
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 500 }));
  await assert.rejects(
    getApiProduct(11),
    (error) => error instanceof ApiError && error.status === 500,
  );
});

test("invalid JSON is a response error and network failures remain available to callers", async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>unavailable</html>"),
  );
  await assert.rejects(getJson("/categories"), ApiResponseError);
  const offline = new TypeError("Failed to fetch");
  fetchMock.mock.mockImplementation(async () => {
    throw offline;
  });
  await assert.rejects(getApiProduct(11), (error) => error === offline);
});

test("invalid request IDs never make network calls", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response("{}"));
  await assert.rejects(getProductsByCategory(-1), RangeError);
  await assert.rejects(getApiProduct(0), RangeError);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("custom sizes remain available alongside fixed sizes without a local meter price", () => {
  const detail = parseProduct(
    response(
      product({
        price_per_unit: null,
        sizes: [{ id: 677, length: 2, width: 2, price_before_discount: 40 }],
      }),
    ),
    11,
  );
  assert.deepEqual(
    productSizeOptions(detail).map((option) => option.value),
    ["677", "custom"],
  );
  const size = resolveProductSize(detail, "custom", "2", "3");
  assert.equal(size.size, 6);
  assert.deepEqual(size.dimensions, { length: 2, width: 3 });
  assert.equal(size.unitPrice, undefined);
  assert.equal(size.sizeId, undefined);
  assert.equal(resolveProductSize(detail, "custom", "", "3"), null);
  assert.equal(resolveProductSize(detail, "custom", "21", "3"), null);
  assert.deepEqual(productSizeOptions({ ...detail, hasSizes: false }), []);
});

test("custom pricing posts numeric dimensions and quantity with Arabic headers to the actual product", async (t) => {
  const controller = new AbortController();
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.ok(String(url).endsWith("/products/27/custom"));
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Accept-Language"], "ar");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.headers.Accept, "application/json");
    assert.deepEqual(JSON.parse(options.body), { width: 2, length: 2, quantity: 3 });
    assert.equal(options.signal.aborted, false);
    return Response.json(response({ price: 120 }));
  });
  const total = await calculateCustomProductPrice(
    27,
    { width: 2, length: 2, quantity: 3 },
    controller.signal,
  );
  assert.equal(total, 120);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("custom pricing rejects invalid dimensions and quantities before sending a request", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json(response({ price: 120 })),
  );
  for (const changes of [
    { width: 0 },
    { width: Infinity },
    { width: "2" },
    { length: -1 },
    { length: 21 },
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: 100 },
  ]) {
    await assert.rejects(
      calculateCustomProductPrice(11, { width: 2, length: 2, quantity: 3, ...changes }),
      RangeError,
    );
  }
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("custom pricing validates backend totals and preserves backend failures", async (t) => {
  const input = { width: 2, length: 2, quantity: 3 };
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json(response({ price: "120.50" })),
  );
  assert.equal(await calculateCustomProductPrice(11, input), 120.5);
  fetchMock.mock.mockImplementation(async () => Response.json(response({ price: 0 })));
  assert.equal(await calculateCustomProductPrice(11, input), 0);
  for (const body of [
    response({ price: -1 }),
    response({}),
    response({ price: null }),
    { success: false, data: { price: 120 } },
  ]) {
    fetchMock.mock.mockImplementation(async () => Response.json(body));
    await assert.rejects(calculateCustomProductPrice(11, input), ApiResponseError);
  }
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 422 }));
  await assert.rejects(
    calculateCustomProductPrice(11, input),
    (error) => error instanceof ApiError && error.status === 422,
  );
});
