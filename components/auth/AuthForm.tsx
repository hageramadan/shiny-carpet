"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AuthLayout, { authButtonClass, authInputClass } from "./AuthLayout";
import PhoneInput from "@/components/forms/PhoneInput";
import { useAuthAction } from "@/hooks/useAuthAction";
import { authRequest } from "@/lib/auth/client";
import { apiPhone } from "@/lib/phone";
import {
  authHref,
  normalizePhone,
  readAuthDraft,
  saveAuthDraft,
  validPhone,
} from "@/lib/auth-flow";

export default function AuthForm({
  register = false,
  destination = "/profile",
}: {
  register?: boolean;
  destination?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { error, setError, pending, run } = useAuthAction();
  const title = register ? "إنشاء حساب" : "تسجيل الدخول";

  useEffect(() => {
    const draft = readAuthDraft();
    if (draft) {
      setName(draft.name);
      setPhone(draft.phone);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (register && !name.trim()) {
      setError("يرجى إدخال الاسم.");
      return;
    }
    if (!validPhone(phone)) {
      setError("يرجى إدخال رقم هاتف صحيح للدولة المختارة.");
      return;
    }
    await run(register ? "register" : "login", async (signal) => {
      const credentials = apiPhone(phone);
      await authRequest(
        register ? "register" : "login",
        { ...credentials, ...(register ? { name: name.trim() } : {}) },
        signal,
      );
      signal.throwIfAborted();
      saveAuthDraft({
        mode: register ? "register" : "login",
        name: name.trim(),
        phone: normalizePhone(phone),
        destination,
        issuedAt: Date.now(),
      });
      router.push("/verify-otp");
    });
  }

  return (
    <AuthLayout
      title={title}
      description={
        register
          ? "أنشئ حسابك لتتابع طلباتك وتحفظ عناوين الاستلام والتوصيل."
          : "أدخل رقم هاتفك للمتابعة إلى حسابك، بدون كلمة مرور."
      }
    >
      <h2 className="mb-4 text-xl font-bold text-[#17202A]">
        {register ? "بيانات الحساب" : "مرحبًا بعودتك"}
      </h2>
      {!register && (
        <p className="mb-3 text-sm leading-6 text-muted">
          تابع إلى خطوة التحقق باستخدام رمز من ٦ أرقام.
        </p>
      )}
      <form
        onSubmit={submit}
        className="space-y-3"
      >
        {register && (
          <label className="block text-sm font-bold">
            الاسم
            <input
              name="name"
              autoComplete="name"
              required
              disabled={pending}
              maxLength={80}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="الاسم"
              className={`${authInputClass} mt-1.5`}
            />
          </label>
        )}
        <PhoneInput
          name="phone"
          disabled={pending}
          required
          value={phone}
          onChange={(value) => {
            setPhone(value);
            setError("");
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "auth-error" : undefined}
        />
        {register && (
          <>
            <p className="text-sm md:text-base leading-6 text-[#6B7280]">
              سيرسل رمز تحقق من 6 أرقام إلى هاتفك لإتمام إنشاء الحساب.
            </p>
            <label className="flex cursor-pointer items-start gap-2 text-sm leading-6 text-primary">
              <input
                type="checkbox"
                name="terms"
                required
                disabled={pending}
                className="mt-1 size-3.5 shrink-0 accent-primary"
              />
              أوافق على الشروط والأحكام وسياسة الخصوصية
            </label>
          </>
        )}
        {error && (
          <p
            id="auth-error"
            role="alert"
            className="text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={authButtonClass}
        >
          {pending ? "جاري المتابعة…" : title}
        </button>
      </form>
      <div className="mt-3 border-t border-gray-100 pt-3 text-center">
        <p className="mb-3 text-sm text-muted">
          {register ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}
        </p>
        <Link
          href={authHref(register ? "/login" : "/register", destination)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-bold text-[#087B82] md:text-base transition-colors hover:bg-primary/5"
        >
          {register ? "تسجيل الدخول" : "إنشاء حساب"}
        </Link>
        <Link
          href={destination === "/profile" ? "/products" : destination}
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          الدخول كزائر
        </Link>
      </div>
    </AuthLayout>
  );
}
