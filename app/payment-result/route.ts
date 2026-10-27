export function GET(request: Request) {
  const url = new URL(request.url);
  const order = url.searchParams.get("order") ?? "";
  const checkout = url.searchParams.get("checkout_id") ?? "";
  if (
    !/^[1-9]\d*$/.test(order) ||
    !Number.isSafeInteger(Number(order)) ||
    !/^[a-zA-Z0-9._-]{1,200}$/.test(checkout)
  )
    return new Response("Invalid payment return", { status: 400 });
  const message = JSON.stringify({
    type: "shiny-payment-return",
    orderId: Number(order),
    checkoutId: checkout,
  });
  const tracking = "/tracking?order=" + order + "&checkout_id=" + checkout;
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Tahoma,Arial;text-align:center;padding:32px;color:#14383B"><p role="status">تمت العودة من بوابة الدفع. جاري التحقق من النتيجة…</p><script>if(window.parent!==window){window.parent.postMessage(${message},location.origin)}else{location.replace(${JSON.stringify(tracking)})}</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
