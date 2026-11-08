import { normalizeLocale } from "../../../../lib/i18n";
import { NextResponse } from "next/server";
import { sendOtp, verifyOtp } from "../../../../lib/auth/otp-server";
import { ApiError } from "../../../../lib/api/client";
import { isRecord } from "../../../../lib/api/validation";

export const runtime = "nodejs";
const COOKIE = "shiny-otp-challenge";
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/api/auth/otp",
  secure: process.env.NODE_ENV === "production",
  maxAge: 300,
};
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    origin !== new URL(request.url).origin &&
    origin !== process.env.NEXT_PUBLIC_SITE_URL
  )
    return NextResponse.json({ message: "طلب غير صالح." }, { status: 403 });
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new ApiError(422, { message: "بيانات غير صالحة." });
    let response: NextResponse;
    if (body.action === "send") {
      const sent = await sendOtp(
        body,
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
        request.signal,
      );
      response = NextResponse.json({ result: true, message: sent.message, data: {} });
      response.cookies.set(COOKIE, sent.id, cookieOptions);
    } else if (body.action === "verify") {
      const id =
        request.headers
          .get("cookie")
          ?.split(";")
          .map((part) => part.trim())
          .find((part) => part.startsWith(COOKIE + "="))
          ?.slice(COOKIE.length + 1) || "";
      const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
      const result = await verifyOtp(
        body,
        id,
        token,
        request.signal,
        normalizeLocale(request.headers.get("accept-language")),
      );
      response = NextResponse.json(result);
      response.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
    } else throw new ApiError(422, { message: "عملية غير صالحة." });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    const status =
      error instanceof ApiError ? error.status : error instanceof SyntaxError ? 422 : 502;
    const message =
      error instanceof ApiError &&
      isRecord(error.details) &&
      typeof error.details.message === "string"
        ? error.details.message
        : "تعذر إتمام التحقق. حاول مجددًا.";
    return NextResponse.json(
      { result: false, message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
