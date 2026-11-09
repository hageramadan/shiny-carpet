import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isRecord } from "./validation";

export type OrderInvoice = {
  title: string;
  number: string;
  sections: { title: string; lines: string[] }[];
  orderNumber: string;
  orderDate: string;
  issuedAt: string;
  company: { name: string; taxNumber: string };
  customer: { name: string; phone: string; address: string };
  items: {
    name: string;
    specifications: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
  summary: { label: string; value: string }[];
  total: string;
  thankYou: string;
  notices: string[];
};
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
function required(value: unknown): string {
  const result = text(value);
  if (!result) throw new ApiResponseError("Missing invoice field");
  return result;
}
export async function fetchInvoice(
  id: number,
  signal?: AbortSignal,
): Promise<OrderInvoice> {
  assertPositiveId(id);
  const body = await authenticatedApiRequest(`/orders/${id}/invoice`, { signal });
  if (!isRecord(body)) throw new ApiResponseError("Invalid invoice response");
  if (body.success !== true) throw new ApiError(400, body);
  const data = body.data;
  if (
    !isRecord(data) ||
    !isRecord(data.invoice_meta) ||
    !isRecord(data.summary) ||
    !Array.isArray(data.items)
  )
    throw new ApiResponseError("Missing invoice data");
  const meta = data.invoice_meta;
  const company = isRecord(data.company) ? data.company : {};
  const customer = isRecord(data.customer) ? data.customer : {};
  const address = isRecord(customer.address) ? customer.address : {};
  const payment = isRecord(data.payment) ? data.payment : {};
  const footer = isRecord(data.footer) ? data.footer : {};
  const support = isRecord(data.support) ? data.support : {};
  const summary = data.summary;
  const discountAmount = summary.discount ?? summary.discount_amount;
  const formattedDiscount = text(summary.discount_formatted)
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/٬|,/g, "")
    .replace(/٫/g, ".")
    .match(/-?\d+(?:\.\d+)?/)?.[0];
  const hasDiscount = Number(discountAmount ?? formattedDiscount) > 0;
  const discountValue = hasDiscount ? text(summary.discount_formatted) : "";
  const sections: OrderInvoice["sections"] = [];
  function section(title: string, entries: [string, unknown][]) {
    const lines = entries.flatMap(([label, value]) =>
      text(value) ? [label ? `${label}: ${text(value)}` : text(value)] : [],
    );
    if (lines.length) sections.push({ title, lines });
  }
  section(text(company.name) || text(company.name_en), [
    ["الرقم الضريبي", company.tax_number],
    ["رقم الطلب", meta.order_number],
    ["تاريخ الطلب", meta.order_date_formatted || meta.order_date],
    ["تاريخ الفاتورة", meta.invoice_date_formatted || meta.invoice_date],
  ]);
  section("بيانات العميل", [
    ["الاسم", customer.name],
    ["الهاتف", customer.phone],
    ["العنوان", address.full_address],
    ["الدور", address.floor],
    ["الشقة", address.apartment],
    ["تفاصيل إضافية", address.details],
  ]);
  section("الدفع", [
    ["الطريقة", payment.display_text],
    ["الحالة", payment.status_label],
    ["آخر أرقام البطاقة", payment.card_last4],
    ["المبلغ المدفوع", payment.amount_paid_formatted],
    ["تاريخ الدفع", payment.paid_at_formatted],
    ["رقم العملية", payment.transaction_id],
  ]);
  const items: OrderInvoice["items"] = [];
  data.items.forEach((item, index) => {
    if (
      !isRecord(item) ||
      !Number.isSafeInteger(item.quantity) ||
      Number(item.quantity) < 1
    )
      throw new ApiResponseError("Invalid invoice item");
    items.push({
      name: required(item.product_name),
      specifications: text(item.specifications),
      quantity: Number(item.quantity),
      unitPrice: required(item.unit_price_formatted),
      total: required(item.total_price_formatted),
    });
    section(`${index + 1}. ${required(item.product_name)}`, [
      ["", item.specifications],
      ["الكمية", String(item.quantity)],
      ["سعر الوحدة", required(item.unit_price_formatted)],
      ["الإجمالي", required(item.total_price_formatted)],
    ]);
  });
  section("ملخص الفاتورة", [
    ["المجموع الفرعي", required(summary.subtotal_formatted)],
    ["رسوم التوصيل", summary.delivery_fee_formatted],
    [text(summary.discount_label) || "الخصم", discountValue],
    ["كود الخصم", summary.coupon_code],
    [
      `ضريبة القيمة المضافة${typeof summary.vat_percentage === "number" ? ` (${summary.vat_percentage}%)` : ""}`,
      summary.vat_amount_formatted,
    ],
    ["الإجمالي", required(summary.total_formatted)],
    ["", payment.vat_inclusive_note],
  ]);
  section(text(support.title), [
    ["", support.description],
    ["الهاتف", support.phone],
    ["البريد الإلكتروني", support.email],
  ]);
  section(text(footer.thank_you_message), [
    ["", footer.legal_notice],
    ["", footer.share_notice],
    ["", footer.special_notes],
  ]);
  const summaryRows = [
    { label: "المجموع الفرعي", value: required(summary.subtotal_formatted) },
    { label: "رسوم التوصيل", value: text(summary.delivery_fee_formatted) },
    {
      label: text(summary.discount_label) || "الخصم",
      value: discountValue,
    },
    { label: "كود الخصم", value: text(summary.coupon_code) },
    {
      label: `ضريبة القيمة المضافة${typeof summary.vat_percentage === "number" ? ` (${summary.vat_percentage}%)` : ""}`,
      value: text(summary.vat_amount_formatted),
    },
  ].filter((row) => row.value);
  return {
    title: required(meta.title),
    number: required(meta.invoice_number),
    sections,
    orderNumber: text(meta.order_number),
    orderDate: text(meta.order_date_formatted) || text(meta.order_date),
    issuedAt: text(meta.invoice_date_formatted) || text(meta.invoice_date),
    company: {
      name: text(company.name) || text(company.name_en),
      taxNumber: text(company.tax_number),
    },
    customer: {
      name: text(customer.name),
      phone: text(customer.phone),
      address: [
        text(address.full_address),
        text(address.floor) && `الدور: ${text(address.floor)}`,
        text(address.apartment) && `الشقة: ${text(address.apartment)}`,
        text(address.details),
      ]
        .filter(Boolean)
        .join("، "),
    },
    items,
    summary: summaryRows,
    total: required(summary.total_formatted),
    thankYou: text(footer.thank_you_message),
    notices: [
      text(footer.legal_notice),
      text(footer.share_notice),
      text(footer.special_notes),
    ].filter(Boolean),
  };
}
