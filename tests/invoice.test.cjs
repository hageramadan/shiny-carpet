const assert = require("node:assert/strict");
const { test } = require("node:test");
const { fetchInvoice } = require("../lib/api/invoice.ts");
const { ApiError, ApiResponseError, API_BASE_URL } = require("../lib/api/client.ts");
const { saveAuthSession, clearAuthSession } = require("../lib/auth/session.ts");
const invoice = require("./fixtures/invoice.cjs");
function session(t) {
  const values = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => values.set(k, v),
      removeItem: (k) => values.delete(k),
    },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    dispatchEvent() {},
  };
  saveAuthSession({
    token: "fixture-invoice-token",
    user: { name: "حساب", phone: "+201012345678", email: "" },
  });
  t.after(() => {
    clearAuthSession();
    globalThis.window = previousWindow;
  });
}
test("invoice fetches only JSON for the selected order and preserves invoice fields", async (t) => {
  session(t);
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, `${API_BASE_URL}/orders/533/invoice`);
    assert.equal(options.method, "GET");
    assert.equal(options.headers.Authorization, "Bearer fixture-invoice-token");
    assert.equal(options.headers["Accept-Language"], "ar");
    assert.equal(options.signal, undefined);
    return Response.json(invoice());
  });
  const result = await fetchInvoice(533);
  assert.equal(result.number, "INV-2026-00533");
  const lines = result.sections.flatMap((section) => section.lines).join("\n");
  for (const value of [
    "hager",
    "310245678900003",
    "40.250 ر.س",
    "5.250 ر.س",
    "APPLEPAY",
    "محمد بن أبي صفرة",
  ])
    assert.ok(lines.includes(value));
  await assert.rejects(fetchInvoice(0), RangeError);
  assert.equal(mock.mock.callCount(), 1);
});
test("invoice ignores PDF actions and rejects missing amounts or failed envelopes", async (t) => {
  session(t);
  let body = invoice();
  delete body.data.actions;
  t.mock.method(globalThis, "fetch", async () => Response.json(body));
  assert.equal((await fetchInvoice(533)).number, "INV-2026-00533");
  delete body.data.summary.total_formatted;
  await assert.rejects(fetchInvoice(533), ApiResponseError);
  body = { success: false, message: "الفاتورة غير متاحة" };
  await assert.rejects(fetchInvoice(533), ApiError);
});
test("invoice propagates explicit cancellation without an automatic deadline", async (t) => {
  session(t);
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    options.signal.throwIfAborted();
    return Response.json(invoice());
  });
  controller.abort();
  await assert.rejects(fetchInvoice(533, controller.signal), { name: "AbortError" });
});
