import { API_BASE_URL } from "../../../lib/api/client";

export async function POST(request: Request) {
  let url: URL;
  try {
    const body = await request.json();
    url = new URL(typeof body?.url === "string" ? body.url : "");
  } catch {
    return new Response(null, { status: 400 });
  }
  // Only relay generated invoice files from our backend, never arbitrary URLs.
  if (
    url.origin !== new URL(API_BASE_URL).origin ||
    !/^\/storage\/invoices\/[a-zA-Z0-9_-]+\.pdf$/.test(url.pathname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    return new Response(null, { status: 400 });
  try {
    const response = await fetch(url.href, {
      headers: {
        Accept: "application/pdf",
        "Accept-Language": request.headers.get("Accept-Language") === "en" ? "en" : "ar",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
    });
    if (!response.ok) return new Response(null, { status: 502 });
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.subarray(0, 5).toString() !== "%PDF-")
      return new Response(null, { status: 502 });
    // A JSON transport keeps download managers from intercepting this fetch.
    // The browser reconstructs the original PDF bytes before saving the file.
    return Response.json(
      { data: bytes.toString("base64") },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return new Response(null, { status: 502 });
  }
}
