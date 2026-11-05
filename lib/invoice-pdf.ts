import type { OrderInvoice } from "./api/invoice";

// Canvas keeps Arabic shaping consistent with the invoice page in every browser.
export async function createInvoicePdf(
  invoice: OrderInvoice,
  signal?: AbortSignal,
): Promise<Blob> {
  const [{ jsPDF }, regular, bold, logo] = await Promise.all([
    import("jspdf"),
    new FontFace("InvoiceCairo", "url(/fonts/cairo-regular.ttf)", {
      weight: "400",
    }).load(),
    new FontFace("InvoiceCairo", "url(/fonts/cairo-bold.ttf)", { weight: "700" }).load(),
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Invoice logo unavailable"));
      image.src = "/images/logo1.png";
    }),
  ]);
  signal?.throwIfAborted();
  document.fonts.add(regular);
  document.fonts.add(bold);
  const width = 1240,
    height = 1754,
    margin = 80,
    right = width - margin,
    contentWidth = width - margin * 2;
  const colors = {
    ink: "#14383B",
    muted: "#7b8491",
    primary: "#20A9B0",
    border: "#e5e7eb",
    soft: "#f7f9fa",
  };
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PDF canvas unavailable");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  pdf.setProperties({
    title: `${invoice.title} ${invoice.number}`,
    author: invoice.company.name || "Shiny Carpet",
  });
  let page = 0,
    y = 0;
  function font(size = 20, weight = 400) {
    ctx!.font = `${weight} ${size}px "InvoiceCairo"`;
  }
  function box(
    x: number,
    top: number,
    w: number,
    h: number,
    fill: string,
    border = false,
  ) {
    ctx!.beginPath();
    ctx!.roundRect(x, top, w, h, 14);
    ctx!.fillStyle = fill;
    ctx!.fill();
    if (border) {
      ctx!.strokeStyle = colors.border;
      ctx!.lineWidth = 1.5;
      ctx!.stroke();
    }
  }
  function rule(top: number, x = margin, w = contentWidth) {
    ctx!.beginPath();
    ctx!.moveTo(x, top);
    ctx!.lineTo(x + w, top);
    ctx!.strokeStyle = colors.border;
    ctx!.lineWidth = 1;
    ctx!.stroke();
  }
  function lines(value: string, maxWidth: number, size = 20, weight = 400): string[] {
    font(size, weight);
    const output: string[] = [];
    for (const paragraph of value.split("\n")) {
      let current = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (ctx!.measureText(current ? current + " " + word : word).width <= maxWidth) {
          current = current ? current + " " + word : word;
          continue;
        }
        if (current) {
          output.push(current);
          current = "";
        }
        for (const char of word) {
          if (current && ctx!.measureText(current + char).width > maxWidth) {
            output.push(current);
            current = "";
          }
          current += char;
        }
      }
      if (current) output.push(current);
    }
    return output;
  }
  function text(
    value: string,
    x: number,
    top: number,
    size = 20,
    color = colors.ink,
    weight = 400,
    align: CanvasTextAlign = "right",
    direction: CanvasDirection = "rtl",
  ) {
    font(size, weight);
    ctx!.fillStyle = color;
    ctx!.textAlign = align;
    ctx!.direction = direction;
    ctx!.textBaseline = "top";
    ctx!.fillText(value, x, top);
  }
  function block(
    value: string,
    x: number,
    top: number,
    maxWidth: number,
    size = 20,
    color = colors.ink,
    weight = 400,
  ) {
    const rows = lines(value, maxWidth, size, weight);
    rows.forEach((row, index) =>
      text(row, x, top + index * (size * 1.7), size, color, weight),
    );
    return rows.length * size * 1.7;
  }
  function finishPage() {
    text(String(page + 1), width / 2, height - 57, 17, colors.muted, 400, "center");
    if (page++) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, 210, 297);
  }
  function startPage() {
    signal?.throwIfAborted();
    ctx!.fillStyle = "#fff";
    ctx!.fillRect(0, 0, width, height);
    box(45, 40, width - 90, height - 115, "#fff", true);
    ctx!.drawImage(logo, right - 106, 79, 106, 81);
    const titleWidth = 550;
    const titleHeight = block(
      invoice.title,
      right - 130,
      88,
      titleWidth,
      27,
      colors.ink,
      700,
    );
    const companyHeight = invoice.company.name
      ? block(
          invoice.company.name,
          right - 130,
          94 + titleHeight,
          titleWidth,
          17,
          colors.muted,
        )
      : 0;
    const taxHeight = invoice.company.taxNumber
      ? block(
          `الرقم الضريبي: ${invoice.company.taxNumber}`,
          right - 130,
          98 + titleHeight + companyHeight,
          titleWidth,
          16,
          colors.muted,
        )
      : 0;
    text("رقم الفاتورة", margin, 85, 17, colors.muted, 400, "left");
    const numberRows = lines(invoice.number, 300, 22, 700);
    numberRows.forEach((line, i) =>
      text(line, margin, 125 + i * 34, 22, colors.primary, 700, "left", "ltr"),
    );
    const issuedRows = invoice.issuedAt
      ? lines("تاريخ الفاتورة: " + invoice.issuedAt, 320, 16)
      : [];
    issuedRows.forEach((line, i) =>
      text(line, margin + 320, 130 + numberRows.length * 34 + i * 28, 16, colors.muted),
    );
    y = Math.max(
      198,
      110 + titleHeight + companyHeight + taxHeight,
      137 + numberRows.length * 34 + issuedRows.length * 28,
    );
    rule(y);
    y += 28;
  }
  function nextPage() {
    finishPage();
    startPage();
  }
  function ensure(h: number) {
    if (y + h > height - 110) nextPage();
  }
  startPage();
  const meta = [
    { label: "رقم الطلب", value: invoice.orderNumber },
    { label: "تاريخ الطلب", value: invoice.orderDate },
  ].filter((row) => row.value);
  if (meta.length) {
    const gap = 20,
      w = (contentWidth - gap * (meta.length - 1)) / meta.length;
    const cardHeight = Math.max(
      ...meta.map((row) => 58 + lines(row.value, w - 40, 20, 700).length * 34),
    );
    ensure(cardHeight + 24);
    meta.forEach((row, i) => {
      const x = right - (i + 1) * w - i * gap;
      box(x, y, w, cardHeight, colors.soft);
      text(row.label, x + w - 20, y + 15, 17, colors.muted);
      block(row.value, x + w - 20, y + 48, w - 40, 20, colors.ink, 700);
    });
    y += cardHeight + 30;
  }
  ensure(170);
  text("بيانات العميل", right, y, 24, colors.ink, 700);
  y += 46;
  const customer = [
    { label: "اسم العميل", value: invoice.customer.name },
    { label: "رقم الجوال", value: invoice.customer.phone },
    { label: "العنوان", value: invoice.customer.address },
  ].filter((row) => row.value);
  const column = contentWidth / 3;
  const customerHeight = Math.max(
    0,
    ...customer.map((row) => 35 + lines(row.value, column - 24, 19).length * 33),
  );
  // Very long customer fields flow on their own pages instead of being clipped.
  if (customerHeight > 500) {
    for (const row of customer) {
      ensure(80);
      text(row.label, right, y, 17, colors.muted);
      y += 32;
      for (const line of lines(row.value, contentWidth, 19)) {
        ensure(34);
        text(line, right, y, 19);
        y += 34;
      }
      y += 14;
    }
  } else {
    ensure(customerHeight + 24);
    customer.forEach((row, i) => {
      const x = right - i * column;
      text(row.label, x, y, 17, colors.muted);
      block(row.value, x, y + 35, column - 24, 19);
    });
    y += customerHeight;
  }
  y += 24;
  rule(y);
  y += 30;
  const productRight = right - 20,
    quantityX = margin + 490,
    unitRight = margin + 390,
    totalRight = margin + 170;
  function tableHeader() {
    ensure(110);
    text("المنتجات والخدمات", right, y, 24, colors.ink, 700);
    y += 44;
    box(margin, y, contentWidth, 54, colors.soft);
    text("المنتج / الخدمة", productRight, y + 12, 17, colors.muted);
    text("الكمية", quantityX, y + 12, 17, colors.muted, 400, "center");
    text("سعر الوحدة", unitRight, y + 12, 17, colors.muted);
    text("المجموع", totalRight, y + 12, 17, colors.muted);
    y += 54;
  }
  tableHeader();
  for (const item of invoice.items) {
    const productLines = [
      ...lines(item.name, 490, 20, 700).map((value) => ({
        value,
        size: 20,
        color: colors.ink,
        weight: 700,
      })),
      ...lines(item.specifications, 490, 17).map((value) => ({
        value,
        size: 17,
        color: colors.muted,
        weight: 400,
      })),
    ];
    const unitLines = lines(item.unitPrice, 190, 18),
      totalLines = lines(item.total, 150, 18, 700);
    const count = Math.max(productLines.length, unitLines.length, totalLines.length, 1);
    const fullRowHeight = Math.max(86, count * 34 + 32);
    if (fullRowHeight <= height - 110 - 380 && y + fullRowHeight > height - 110) {
      nextPage();
      tableHeader();
    }
    let offset = 0;
    while (offset < count) {
      if (y + 90 > height - 110) {
        nextPage();
        tableHeader();
      }
      const take = Math.min(count - offset, Math.floor((height - 110 - y - 32) / 34));
      const rowHeight = Math.max(86, take * 34 + 32);
      ctx!.strokeStyle = colors.border;
      ctx!.strokeRect(margin, y, contentWidth, rowHeight);
      for (let i = 0; i < take; i++) {
        const index = offset + i,
          line = productLines[index];
        if (line)
          text(
            line.value,
            productRight,
            y + 16 + i * 34,
            line.size,
            line.color,
            line.weight,
          );
        if (unitLines[index]) text(unitLines[index], unitRight, y + 16 + i * 34, 18);
        if (totalLines[index])
          text(totalLines[index], totalRight, y + 16 + i * 34, 18, colors.ink, 700);
      }
      if (offset === 0)
        text(String(item.quantity), quantityX, y + 16, 20, colors.ink, 400, "center");
      y += rowHeight;
      offset += take;
      if (offset < count) {
        nextPage();
        tableHeader();
      }
    }
  }
  y += 28;
  const summaryWidth = 510,
    notesWidth = 520;
  const summaryRows = invoice.summary.map((row) => ({
    ...row,
    labels: lines(row.label, 255, 18),
    values: lines(row.value, 180, 18),
  }));
  const summaryHeight =
    38 +
    summaryRows.reduce(
      (sum, row) => sum + Math.max(row.labels.length, row.values.length) * 31 + 14,
      0,
    ) +
    75;
  ensure(summaryHeight);
  const summaryTop = y;
  box(margin, y, summaryWidth, summaryHeight, colors.soft);
  let summaryY = y + 22;
  for (const row of summaryRows) {
    row.labels.forEach((line, i) =>
      text(line, margin + summaryWidth - 22, summaryY + i * 31, 18, colors.muted),
    );
    row.values.forEach((line, i) =>
      text(line, margin + 22, summaryY + i * 31, 18, colors.ink, 400, "left"),
    );
    summaryY += Math.max(row.labels.length, row.values.length) * 31 + 14;
  }
  rule(summaryY + 3, margin + 22, summaryWidth - 44);
  text("الإجمالي", margin + summaryWidth - 22, summaryY + 20, 25, colors.ink, 700);
  text(invoice.total, margin + 22, summaryY + 20, 24, colors.primary, 700, "left");
  let notesBottom = y;
  const notes = [
    { value: invoice.thankYou, weight: 700, color: colors.ink },
    ...invoice.notices.map((value) => ({ value, weight: 400, color: colors.muted })),
  ];
  for (const note of notes.filter((row) => row.value)) {
    for (const line of lines(note.value, notesWidth, 20, note.weight)) {
      ensure(35);
      text(line, right, y, 20, note.color, note.weight);
      y += 35;
    }
    y += 15;
    notesBottom = y;
  }
  y = Math.max(notesBottom, page === 0 ? summaryTop + summaryHeight : y);
  finishPage();
  signal?.throwIfAborted();
  return pdf.output("blob");
}
