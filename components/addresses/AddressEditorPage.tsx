"use client";

import Link from "next/link";
import { useStore } from "@/components/store";
import { useAddresses } from "./AddressesProvider";
import AddressesLayout from "./AddressesLayout";
import AddressEditor from "./AddressEditor";

export default function AddressEditorPage({ id }: { id?: string }) {
  const { state, ready } = useStore();
  const { addresses, status, error, reload, loaded } = useAddresses();
  const address = id ? addresses.find((item) => item.id === id) : undefined;
  return (
    <AddressesLayout
      title={id ? "تعديل العنوان" : "إضافة عنوان جديد"}
      description={
        id
          ? "راجع موقع عنوانك وحدّث تفاصيله، ثم احفظ التغييرات."
          : "حدد موقع الاستلام والتوصيل، ثم أضف التفاصيل اللازمة للوصول إليك."
      }
    >
      {!ready ? (
        <p
          role="status"
          className="rounded-xl border border-gray-200 bg-white p-8 text-center text-muted"
        >
          جاري تحميل العنوان…
        </p>
      ) : !state.profile ? (
        <Link
          href={`/login?next=${encodeURIComponent(id ? `/addresses/${id}/edit` : "/addresses/new")}`}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-white"
        >
          سجّل الدخول لإدارة عناوينك
        </Link>
      ) : status === "error" && !loaded ? (
        <div>
          <p role="alert">{error}</p>
          <button
            onClick={() => void reload()}
            className="min-h-11 text-primary"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : !loaded ? (
        <p role="status">جاري تحميل العنوان…</p>
      ) : id && !address ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-[#17202A]">العنوان غير موجود</h2>
          <Link
            href="/addresses"
            className="mt-4 inline-block text-sm text-primary"
          >
            العودة للعناوين المحفوظة
          </Link>
        </div>
      ) : (
        <AddressEditor
          key={id || "new"}
          address={address}
        />
      )}
    </AddressesLayout>
  );
}
