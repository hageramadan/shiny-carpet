"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import AuthLayout, { authButtonClass, authInputClass } from "./AuthLayout";
import {
  authHref,
  normalizePhone,
  readAuthDraft,
  saveAuthDraft,
  validPhone,
} from "@/lib/demo-auth";

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
  const [error, setError] = useState("");
  const title = register ? "إنشاء حساب" : "تسجيل الدخول";

  useEffect(() => {
    const draft = readAuthDraft();
    if (draft) {
      setName(draft.name);
      setPhone(draft.phone);
    }
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (register && !name.trim()) {
      setError("يرجى إدخال الاسم.");
      return;
    }
    if (!validPhone(phone)) {
      setError("يرجى إدخال رقم هاتف صحيح من ٨ إلى ١٥ رقمًا، مع رمز الدولة عند الحاجة.");
      return;
    }
    saveAuthDraft({
      mode: register ? "register" : "login",
      name: name.trim(),
      phone: normalizePhone(phone),
      destination,
      issuedAt: Date.now(),
    });
    router.push("/verify-otp");
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
        aria-describedby="auth-demo-note"
      >
        {register && (
          <label className="block text-sm font-bold">
            الاسم
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="فاطمة طارق"
              className={`${authInputClass} mt-1.5`}
            />
          </label>
        )}
        <label className="block text-sm font-bold">
          رقم الهاتف
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            required
            maxLength={24}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "auth-error" : undefined}
            placeholder="+966 55 123 4567"
            className={`${authInputClass} mt-1.5`}
          />
        </label>
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
          className={authButtonClass}
        >
          {title}
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
