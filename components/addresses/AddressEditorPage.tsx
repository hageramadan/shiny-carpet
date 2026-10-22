"use client";

import Link from "next/link";
import { useStore } from "@/components/store";
import { defaultAddress } from "@/lib/addresses";
import AddressesLayout from "./AddressesLayout";
import AddressEditor from "./AddressEditor";

export default function AddressEditorPage({ id }: { id?: string }) {
  const { state, ready } = useStore();
  const address = id ? state.addresses.find((item) => item.id === id) : undefined;
  const selected = address
    ? { ...address, isDefault: defaultAddress(state.addresses)?.id === address.id }
    : undefined;
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
          address={selected}
        />
      )}
    </AddressesLayout>
  );
}
