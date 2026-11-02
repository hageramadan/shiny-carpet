import { authenticatedApiRequest } from "../auth/client";
import { ApiError, ApiResponseError } from "./client";
import { assertPositiveId, isRecord } from "./validation";

export type OrderInvoice = {
  title: string;
  number: string;
  sections: { title: string; lines: string[] }[];
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
  data.items.forEach((item, index) => {
    if (
      !isRecord(item) ||
      !Number.isSafeInteger(item.quantity) ||
      Number(item.quantity) < 1
    )
      throw new ApiResponseError("Invalid invoice item");
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
    [text(summary.discount_label) || "الخصم", summary.discount_formatted],
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
  return { title: required(meta.title), number: required(meta.invoice_number), sections };
}
