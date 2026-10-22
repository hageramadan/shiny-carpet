"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiClock } from "react-icons/fi";
import { useStore } from "@/components/store";
import {
  authHref,
  clearAuthDraft,
  CODE_LIFETIME,
  DEMO_OTP,
  readAuthDraft,
  RESEND_DELAY,
  saveAuthDraft,
  type AuthDraft,
} from "@/lib/demo-auth";
import AuthLayout, { authButtonClass } from "./AuthLayout";
import OtpInput from "./OtpInput";

export default function VerifyOtp() {
  const router = useRouter();
  const { state, update, ready } = useStore();
  const [draft, setDraft] = useState<AuthDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const remaining = draft
    ? Math.max(0, Math.ceil((draft.issuedAt + RESEND_DELAY - now) / 1000))
    : 0;

  useEffect(() => {
    setDraft(readAuthDraft());
    setNow(Date.now());
    setLoaded(true);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function resend() {
    if (!draft || Date.now() < draft.issuedAt + RESEND_DELAY) return;
    const next = { ...draft, issuedAt: Date.now() };
    saveAuthDraft(next);
    setDraft(next);
    setNow(next.issuedAt);
    setDigits(Array(6).fill(""));
    setError("");
    setMessage("تم تجديد رمز المعاينة. لم تُرسل أي رسالة نصية.");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !ready || submitting.current) return;
    if (Date.now() - draft.issuedAt >= CODE_LIFETIME) {
      setError("انتهت صلاحية رمز المعاينة. اضغط إعادة إرسال الرمز للمحاولة مجددًا.");
      return;
    }
    if (digits.join("") !== DEMO_OTP) {
      setError("الرمز غير صحيح. استخدم رمز المعاينة الموضح أسفل النموذج.");
      return;
    }
    submitting.current = true;
    const previous = state.profile?.phone === draft.phone ? state.profile : null;
    update((current) => ({
      ...current,
      profile: {
        name: draft.mode === "register" ? draft.name : previous?.name || "زائر ",
        phone: draft.phone,
        email: previous?.email || "",
      },
    }));
    clearAuthDraft();
    router.replace(draft.destination);
  }

  return (
    <AuthLayout
      title="التحقق من الهاتف"
      description="أدخل رمز التحقق المكون من ٦ أرقام لإكمال تسجيل الدخول أو إنشاء حسابك."
    >
      {!loaded ? (
        <p
          role="status"
          className="py-10 text-center text-sm text-muted"
        >
          جاري تحميل بيانات المعاينة…
        </p>
      ) : !draft ? (
        <div className="py-6 text-center">
          <h2 className="text-xl font-bold text-[#17202A]">أدخل رقم هاتفك أولًا</h2>
          <p className="my-4 text-sm leading-6 text-muted">
            ابدأ من صفحة تسجيل الدخول أو إنشاء الحساب لعرض خطوة التحقق الة.
          </p>
          <Link
            href="/login"
            className={authButtonClass}
          >
            تسجيل الدخول
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-[#17202A]">أدخل رمز التحقق</h2>
          <p className="mt-4 text-sm leading-6 text-muted">
            رقم الهاتف المستخدم في المعاينة:
          </p>
          <p className="mt-3 text-sm text-primary">
            <bdi>{draft.phone}</bdi>
          </p>
          <Link
            href={authHref(
              draft.mode === "register" ? "/register" : "/login",
              draft.destination,
            )}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            تغيير رقم الهاتف
          </Link>
          <form
            onSubmit={submit}
            aria-describedby="otp-demo-note"
          >
            <OtpInput
              value={digits}
              onChange={(value) => {
                setDigits(value);
                setError("");
              }}
              invalid={!!error}
            />
            <div
              className="mt-3 flex items-center gap-2 text-xs text-muted"
              aria-label={`إعادة الإرسال متاحة بعد ${remaining} ثانية`}
            >
              <FiClock
                aria-hidden="true"
                className="text-sm"
              />
              <span
                dir="ltr"
                className="tabular-nums"
              >
                {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                {String(remaining % 60).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              لم تستلم الرمز؟ إعادة الإرسال متاحة بعد انتهاء العد التنازلي.
            </p>
            <button
              type="button"
              onClick={resend}
              disabled={remaining > 0}
              className="mt-2 min-h-8 text-sm text-primary transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              إعادة إرسال الرمز
            </button>
            {message && (
              <p
                role="status"
                className="mb-2 text-sm text-muted"
              >
                {message}
              </p>
            )}
            {error && (
              <p
                id="otp-error"
                role="alert"
                className="mb-3 text-sm leading-6 text-red-700"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!ready || digits.some((digit) => !digit)}
              className={`${authButtonClass} mt-2`}
            >
              تحقق ومتابعة
            </button>
          </form>
          <p className="mt-3 border-t border-gray-100 pt-3 text-sm font-semibold leading-6 text-[#6B7280]">
        بعد التحقق ستنتقل إلى حسابك. إذا بدأت تسجيل الدخول أثناء الطلب، ستعود إلى استكمال الطلب.
          </p>
          <p
            id="otp-demo-note"
            className="mt-2 text-xs leading-5 text-muted"
          >
            رمز المعاينة: <bdi className="font-bold text-primary">{DEMO_OTP}</bdi> · صالح
            لمدة ٥ دقائق. لا يوجد تحقق حقيقي أو إرسال SMS. استخدم بيانات وهمية.
          </p>
        </>
      )}
    </AuthLayout>
  );
}
