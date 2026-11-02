import type { OrderInvoice } from "./api/invoice";

// Render Arabic with the browser's text shaping and embed each A4 page in the PDF.
export async function createInvoicePdf(
  invoice: OrderInvoice,
  signal?: AbortSignal,
): Promise<Blob> {
  const [{ jsPDF }, font] = await Promise.all([
    import("jspdf"),
    new FontFace("InvoiceCairo", "url(/fonts/cairo-regular.ttf)").load(),
  ]);
  signal?.throwIfAborted();
  document.fonts.add(font);
  const width = 1240,
    height = 1754,
    margin = 80;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PDF canvas unavailable");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let y = margin,
    page = 0;
  function startPage() {
    ctx!.fillStyle = "#ffffff";
    ctx!.fillRect(0, 0, width, height);
    ctx!.direction = "rtl";
    ctx!.textAlign = "right";
    ctx!.font = '34px "InvoiceCairo"';
    ctx!.fillStyle = "#14383B";
    ctx!.fillText(invoice.title, width - margin, 95);
    ctx!.font = '22px "InvoiceCairo"';
    ctx!.fillText(invoice.number, width - margin, 140);
    ctx!.fillStyle = "#20A9B0";
    ctx!.fillRect(margin, 165, width - margin * 2, 4);
    y = 215;
  }
  function finishPage() {
    ctx!.font = '20px "InvoiceCairo"';
    ctx!.fillStyle = "#667777";
    ctx!.textAlign = "center";
    ctx!.fillText(`${++page}`, width / 2, height - 40);
    if (page > 1) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);
  }
  function line(value: string, heading = false) {
    ctx!.font = `${heading ? 28 : 24}px "InvoiceCairo"`;
    // Split at characters so very long invoice fields cannot overflow the page.
    let wrapped = "";
    const lines: string[] = [];
    for (const character of value) {
      if (
        character === "\n" ||
        ctx!.measureText(wrapped + character).width > width - margin * 2
      ) {
        lines.push(wrapped);
        wrapped = character === "\n" ? "" : character;
      } else wrapped += character;
    }
    if (wrapped) lines.push(wrapped);
    for (const text of lines) {
      if (y > height - 110) {
        finishPage();
        startPage();
      }
      ctx!.textAlign = "right";
      ctx!.direction = "rtl";
      ctx!.font = `${heading ? 28 : 24}px "InvoiceCairo"`;
      ctx!.fillStyle = heading ? "#20A9B0" : "#14383B";
      ctx!.fillText(text, width - margin, y);
      y += heading ? 44 : 40;
    }
  }
  startPage();
  for (const section of invoice.sections) {
    if (y > height - 220) {
      finishPage();
      startPage();
    }
    if (section.title) line(section.title, true);
    section.lines.forEach((text) => line(text));
    y += 20;
  }
  finishPage();
  signal?.throwIfAborted();
  return pdf.output("blob");
}
