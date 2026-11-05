module.exports = (id = 533) => ({
  success: true,
  data: {
    invoice_meta: {
      title: "فاتورة ضريبية ",
      invoice_number: `INV-2026-${String(id).padStart(5, "0")}`,
      order_number: `SC-${id}`,
      order_date_formatted: "26 أكتوبر 2026",
      invoice_date_formatted: "01 نوفمبر 2026",
    },
    company: { name: "", name_en: "Shiny Carpet", tax_number: "310245678900003" },
    customer: {
      name: "hager",
      phone: "201274041169",
      address: {
        full_address: "5 محمد بن أبي صفرة، حي الربيع، الرياض",
        floor: "2",
        apartment: "2",
      },
    },
    payment: {
      display_text: "APPLEPAY",
      status_label: "مدفوعة بالكامل",
      amount_paid_formatted: "40.250 ر.س",
      transaction_id: "TXN-02VMTX05",
      vat_inclusive_note: "جميع المبالغ بالريال السعودي وتشمل ضريبة القيمة المضافة",
    },
    items: [
      {
        product_name: "سجاد بوليستر وحرير صناعي",
        specifications: "المقاس: 1×1 م",
        quantity: 1,
        unit_price_formatted: "10.000 ر.س",
        total_price_formatted: "10.000 ر.س",
      },
      {
        product_name: "لباد مفرد",
        quantity: 1,
        unit_price_formatted: "25.000 ر.س",
        total_price_formatted: "25.000 ر.س",
      },
    ],
    summary: {
      subtotal_formatted: "35.000 ر.س",
      delivery_fee_formatted: "0.000 ر.س",
      discount_formatted: "0.000 ر.س",
      vat_percentage: 15,
      vat_amount_formatted: "5.250 ر.س",
      total_formatted: "40.250 ر.س",
    },
    footer: {
      thank_you_message: "شكراً لاختيارك شايني كاربت",
      legal_notice: "صدرت هذه الفاتورة إلكترونياً ولا تحتاج إلى توقيع أو ختم.",
    },
    actions: {
      view_pdf_url: `https://admin.shinycarpet-sa.com/api/orders/${id}/view`,
      download_pdf_url: `https://admin.shinycarpet-sa.com/api/orders/${id}/download`,
    },
  },
});
