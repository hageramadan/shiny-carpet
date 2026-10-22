"use client";

import { useState, type FormEvent } from "react";
import { FiCheck } from "react-icons/fi";
import { useStore } from "@/components/store";
import type { Profile } from "@/lib/data";
import { normalizePhone, validPhone } from "@/lib/demo-auth";
import ProfileAvatar from "./ProfileAvatar";

const inputClass =
  "mt-2 min-h-11 w-full min-w-0 rounded-[9px] border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-ink placeholder:text-muted transition-colors hover:border-primary/50";

export default function ProfileDetails({ profile }: { profile: Profile }) {
  const { update } = useStore();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = normalizePhone(String(form.get("phone") || ""));
    if (!name) {
      setError("يرجى إدخال الاسم.");
      return;
    }
    if (!validPhone(phone)) {
      setError("يرجى إدخال رقم هاتف صحيح من ٨ إلى ١٥ رقمًا.");
      return;
    }
    update((current) => ({
      ...current,
      profile: current.profile ? { ...current.profile, name, phone } : null,
    }));
    setError("");
    setSaved(true);
  }

  return (
    <section
      aria-labelledby="personal-information-heading"
      className="rounded-xl border border-gray-200 bg-white p-4"
    >
      <h2
        id="personal-information-heading"
        className="text-xl font-bold text-[#17202A]"
      >
        المعلومات الشخصية
      </h2>
      <div className="mt-5 flex items-center gap-3">
        <ProfileAvatar
          name={profile.name}
          small
        />
        <p className="min-w-0 break-words text-lg font-bold text-[#17202A]">
          {profile.name}
        </p>
      </div>
      <form
        onSubmit={submit}
        onChange={() => {
          setSaved(false);
          setError("");
        }}
        className="mt-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-bold text-[#17202A]">
            الاسم
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              defaultValue={profile.name}
              className={inputClass}
            />
          </label>
          <label className="min-w-0 text-sm font-bold text-[#17202A]">
            رقم الهاتف{profile.phone.startsWith("+966") ? " · السعودية +966" : ""}
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              required
              maxLength={24}
              defaultValue={profile.phone}
              aria-invalid={!!error}
              aria-describedby={error ? "profile-error" : undefined}
              className={inputClass}
            />
          </label>
        </div>
        <p className="mt-3 text-xs leading-6 text-muted">
          يمكنك تعديل المعلومات ثم حفظ التغييرات.
        </p>
        {error && (
          <p
            id="profile-error"
            role="alert"
            className="mt-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          {saved && (
            <p
              role="status"
              className="inline-flex items-center gap-2 text-sm text-primary"
            >
              <FiCheck aria-hidden="true" />
              تم حفظ بيانات المعاينة في هذا المتصفح.
            </p>
          )}
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-ink sm:w-49 shadow-button"
          >
            حفظ المعلومات
          </button>
        </div>
      </form>
    </section>
  );
}
