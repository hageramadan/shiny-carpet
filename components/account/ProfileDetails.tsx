"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiCheck } from "react-icons/fi";
import { useStore } from "@/components/store";
import type { Profile } from "@/lib/data";
import { normalizePhone, validPhone } from "@/lib/phone";
import ProfileAvatar from "./ProfileAvatar";
import PhoneInput from "@/components/forms/PhoneInput";
import ProfilePhoneDialog from "./ProfilePhoneDialog";
import { useAuthAction } from "@/hooks/useAuthAction";
import toast from "react-hot-toast";
import {
  deleteProfile,
  pendingProfilePhone,
  updateProfile,
  verifyProfilePhone,
} from "@/lib/profile";

const inputClass =
  "mt-2 min-h-11 w-full min-w-0 rounded-[9px] border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-ink placeholder:text-muted transition-colors hover:border-primary/50";

export default function ProfileDetails({
  profile,
  selectedImage,
  onImageSaved,
  onEditingChange,
}: {
  profile: Profile;
  selectedImage: File | null;
  onImageSaved: () => void;
  onEditingChange: (disabled: boolean) => void;
}) {
  const { update } = useStore();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [challenge, setChallenge] = useState(pendingProfilePhone);
  const [otpOpen, setOtpOpen] = useState(() => Boolean(pendingProfilePhone()));
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { pending, busy, error, setError, run } = useAuthAction();
  useEffect(() => {
    onEditingChange(pending || Boolean(challenge));
  }, [pending, challenge, onEditingChange]);
  function applyProfile(next: Profile) {
    update((current) => ({ ...current, profile: next }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = normalizePhone(String(form.get("phone") || ""));
    if (!name) {
      setError("يرجى إدخال الاسم.");
      return;
    }
    if (!validPhone(phone)) {
      setError("يرجى إدخال رقم هاتف صحيح للدولة المختارة.");
      return;
    }
    setMessage("");
    await run("save", async (signal) => {
      const result = await updateProfile(name, phone, selectedImage ?? undefined, signal);
      applyProfile(result.profile);
      onImageSaved();
      setChallenge(result.pending);
      setOtpOpen(Boolean(result.pending));
      setDigits(Array(6).fill(""));
      setMessage(result.message);
      if (!result.pending)
        toast.success("تم تحديث الملف الشخصي بنجاح.", { id: "profile-success" });
    });
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("verify", async (signal) => {
      applyProfile(await verifyProfilePhone(digits.join(""), signal));
      setChallenge(null);
      setOtpOpen(false);
      setMessage("تم تأكيد رقم الهاتف وتحديثه بنجاح.");
      toast.success("تم تحديث الملف الشخصي وتأكيد رقم الهاتف بنجاح.", {
        id: "profile-success",
      });
    });
  }

  async function removeAccount() {
    await run("delete", async (signal) => {
      await deleteProfile(signal);
      update((current) => ({ ...current, profile: null }));
      router.replace("/login");
    });
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
          image={profile.image}
          small
        />
        <p className="min-w-0 break-words text-lg font-bold text-[#17202A]">
          {profile.name}
        </p>
      </div>
      <form
        onSubmit={submit}
        onChange={() => {
          setMessage("");
          setError("");
        }}
        className="mt-4"
      >
        <fieldset
          disabled={pending || Boolean(challenge)}
          className="grid min-w-0 gap-4 sm:grid-cols-2"
        >
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
          <PhoneInput
            name="phone"
            required
            defaultValue={profile.phone}
            onChange={() => {
              setMessage("");
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "profile-error" : undefined}
          />
        </fieldset>
        <p className="mt-3 text-xs leading-6 text-muted">
          يمكنك تعديل المعلومات ثم حفظ التغييرات.
        </p>
        {error && !otpOpen && (
          <p
            id="profile-error"
            role="alert"
            className="mt-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          {message && (
            <p
              role="status"
              className="inline-flex items-center gap-2 text-sm text-primary"
            >
              <FiCheck aria-hidden="true" />
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || Boolean(challenge)}
            aria-busy={busy === "save"}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-ink sm:w-49 shadow-button"
          >
            {busy === "save" ? "جاري الحفظ…" : "حفظ المعلومات"}
          </button>
        </div>
      </form>
      {challenge && (
        <>
          <button
            type="button"
            onClick={() => {
              setError("");
              setOtpOpen(true);
            }}
            disabled={pending}
            className="mt-4 min-h-11 text-sm font-bold text-primary"
          >
            استكمال تأكيد رقم الهاتف
          </button>
          {otpOpen && (
            <ProfilePhoneDialog
              phone={challenge}
              digits={digits}
              onDigitsChange={(value) => {
                setDigits(value);
                setError("");
              }}
              onSubmit={verify}
              onClose={() => {
                setOtpOpen(false);
                setError("");
              }}
              pending={pending}
              error={error}
            />
          )}
        </>
      )}
      {/* <div className="mt-6 border-t border-gray-100 pt-4">
        {confirmDelete ? (
          <div>
            <p className="text-sm text-red-700">
              هل تريد حذف حسابك نهائيًا؟ لا يمكن التراجع عن هذه العملية.
            </p>
            <div className="mt-3 flex gap-4">
              <button
                type="button"
                onClick={removeAccount}
                disabled={pending}
                className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy === "delete" ? "جاري الحذف…" : "تأكيد حذف الحساب"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
                className="text-sm text-muted"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
            className="min-h-11 text-sm text-red-700"
          >
            حذف الحساب
          </button>
        )}
      </div> */}
    </section>
  );
}
