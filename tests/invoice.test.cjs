const assert = require("node:assert/strict");
const { test } = require("node:test");
const { fetchInvoice } = require("../lib/api/invoice.ts");
const { ApiError, ApiResponseError, API_BASE_URL } = require("../lib/api/client.ts");
const { saveAuthSession, clearAuthSession } = require("../lib/auth/session.ts");
const invoice = require("./fixtures/invoice.cjs");
const { fetchInvoiceDocument } = require("../lib/api/invoice-document.ts");
const { POST: downloadInvoice } = require("../app/api/invoice-download/route.ts");
const downloadRequest = (url) =>
  new Request("http://localhost/api/invoice-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

test("invoice relay returns backend PDF without requiring storage CORS headers", async (t) => {
  const bytes = Buffer.from("%PDF-1.7\nbackend design\n%%EOF");
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(
      url,
      "https://admin.shinycarpet-sa.com/storage/invoices/invoice_541.pdf",
    );
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, undefined);
    return new Response(bytes);
  });
  const result = await downloadInvoice(
    downloadRequest("https://admin.shinycarpet-sa.com/storage/invoices/invoice_541.pdf"),
  );
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "private, no-store");
  assert.match(result.headers.get("content-type"), /application\/json/);
  assert.equal(result.headers.get("content-disposition"), null);
  assert.deepEqual(Buffer.from((await result.json()).data, "base64"), bytes);
  for (const url of [
    "https://other.example/invoice.pdf",
    "https://admin.shinycarpet-sa.com/api/orders/541",
    "http://127.0.0.1/invoice.pdf",
  ])
    assert.equal((await downloadInvoice(downloadRequest(url))).status, 400);
  assert.equal(mock.mock.callCount(), 1);
});

test("invoice download preserves backend PDF bytes and uses the selected order", async (t) => {
  session(t);
  const bytes = Buffer.from("%PDF-1.7\nbackend invoice design\n%%EOF");
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === `${API_BASE_URL}/orders/546/view`) {
      assert.equal(options.headers.Authorization, "Bearer fixture-invoice-token");
      assert.equal(options.headers.Accept, "application/json");
      return Response.json({
        message: "Invoice generated successfully.",
        url: "https://admin.shinycarpet-sa.com/storage/invoices/invoice_546.pdf",
      });
    }
    assert.equal(url, "/api/invoice-download");
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.method, "POST");
    assert.equal(
      JSON.parse(options.body).url,
      "https://admin.shinycarpet-sa.com/storage/invoices/invoice_546.pdf",
    );
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.signal, controller.signal);
    return Response.json({ data: bytes.toString("base64") });
  });
  const pdf = await fetchInvoiceDocument(546, controller.signal);
  assert.deepEqual(Buffer.from(await pdf.arrayBuffer()), bytes);
  await assert.rejects(fetchInvoiceDocument(0), RangeError);
});

test("invoice download rejects error pages and expired sessions", async (t) => {
  session(t);
  const mock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ url: "https://other.example/invoice.pdf" }),
  );
  await assert.rejects(fetchInvoiceDocument(533), ApiResponseError);
  mock.mock.mockImplementation(async () => new Response(null, { status: 401 }));
  await assert.rejects(fetchInvoiceDocument(533), { status: 401 });
  const calls = mock.mock.callCount();
  await assert.rejects(fetchInvoiceDocument(533), { status: 401 });
  assert.equal(mock.mock.callCount(), calls);
});
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

test("invoice shows discount only for a positive amount", async (t) => {
  session(t);
  let body;
  t.mock.method(globalThis, "fetch", async () => Response.json(body));
  for (const [formatted, visible] of [
    ["0.000 ر.س", false],
    ["-1.000 ر.س", false],
    ["1.000 ر.س", true],
    ["٠٫٠٠٠ ر.س", false],
    ["١٫٥٠٠ ر.س", true],
    ["", false],
  ]) {
    body = invoice();
    body.data.summary.discount_formatted = formatted;
    const result = await fetchInvoice(533);
    assert.equal(
      result.summary.some((row) => row.label === "الخصم"),
      visible,
    );
    assert.equal(
      result.sections.some((section) =>
        section.lines.some((line) => line.startsWith("الخصم:")),
      ),
      visible,
    );
  }
  body = invoice();
  body.data.summary.discount = 0;
  body.data.summary.discount_formatted = "5.000 ر.س";
  assert.equal(
    (await fetchInvoice(533)).summary.some((row) => row.label === "الخصم"),
    false,
  );
});
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
  assert.equal(result.orderNumber, "SC-533");
  assert.equal(result.customer.name, "hager");
  assert.equal(result.items[0].unitPrice, "10.000 ر.س");
  assert.equal(result.total, "40.250 ر.س");
  assert.equal(
    result.summary.find((row) => row.label.includes("ضريبة")).value,
    "5.250 ر.س",
  );
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
