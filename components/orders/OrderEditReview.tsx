"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import type { OrderPhoto } from "@/lib/data";
import { updateOrderCoupon, updateOrderImages } from "@/lib/api/order-edit";
import type { OrderEditorState } from "@/hooks/useOrderEditor";
import PhotoUpload from "@/components/checkout/PhotoUpload";
import OrderPhotos from "./OrderPhotos";
import { OrderItems } from "./OrderSummary";

export default function OrderEditReview({
  editor,
  onBack,
}: {
  editor: OrderEditorState;
  onBack: () => void;
}) {
  const t = useTranslation(),
    router = useRouter();
  const { order } = editor;
  const [note, setNote] = useState(order.notes ?? ""),
    [coupon, setCoupon] = useState(order.coupon ?? "");
  const [photos, setPhotos] = useState<OrderPhoto[]>([]),
    [photoBusy, setPhotoBusy] = useState(false),
    [uploadKey, setUploadKey] = useState(0);
  const disabled = editor.pending || editor.needsRefresh || photoBusy;
  async function applyCoupon(event: FormEvent) {
    event.preventDefault();
    if (disabled || !coupon.trim()) return;
    await editor.mutate((fresh, signal) =>
      updateOrderCoupon(Number(fresh.id), coupon, signal),
    );
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (disabled) return;
    const files = photos.flatMap((photo) => (photo.file ? [photo.file] : []));
    if (!files.length && note === (order.notes ?? "")) {
      router.push("/tracking?order=" + order.id);
      return;
    }
    const result = await editor.mutate((fresh, signal) =>
      updateOrderImages(Number(fresh.id), { images: files, note }, signal),
    );
    if (result) {
      setPhotos([]);
      setUploadKey((key) => key + 1);
      if (result === "saved") router.push("/tracking?order=" + order.id);
    }
  }
  const address = order.address;
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="font-bold">{t("عنوان الاستلام والتوصيل")}</h2>
        {address ? (
          <div className="mt-3 rounded-xl bg-[#f7f9fa] p-4">
            <strong>{address.label}</strong>
            <p className="mt-2 text-sm leading-7 text-muted">
              {[address.building, address.street, address.region, address.city]
                .filter(Boolean)
                .join("، ")}
            </p>
            {address.details && (
              <p className="mt-2 text-sm text-muted">{address.details}</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {t("لا توجد بيانات عنوان لهذا الطلب.")}
          </p>
        )}
        {order.phone && (
          <p className="mt-4 text-sm">
            {t("رقم الهاتف:")} <bdi>{order.phone}</bdi>
          </p>
        )}
      </section>
      <form
        onSubmit={applyCoupon}
        className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"
      >
        <h2 className="font-bold">{t("هل لديك كود خصم؟")}</h2>
        <label
          htmlFor="edit-order-coupon"
          className="mt-4 block text-sm"
        >
          {t("كود الخصم")}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="edit-order-coupon"
            value={coupon}
            onChange={(event) => setCoupon(event.target.value)}
            disabled={disabled}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-gray-200 px-3"
          />
          <button
            disabled={disabled || !coupon.trim()}
            className="rounded-xl bg-primary px-4 font-bold text-white disabled:opacity-50"
          >
            {t("تفعيل")}
          </button>
        </div>
        {order.coupon && (
          <p className="mt-3 text-sm text-primary">
            {t("تم تطبيق الكود:")} {order.coupon}
          </p>
        )}
      </form>
      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="mb-4 font-bold">{t("ملخص الطلب")}</h2>
        <OrderItems items={order.items} />
      </section>
      <OrderPhotos photos={order.photos} />
      <PhotoUpload
        key={uploadKey}
        productName={t("صورة الطلب")}
        required={false}
        disabled={editor.pending || editor.needsRefresh}
        onChange={setPhotos}
        onBusyChange={setPhotoBusy}
      />
      <form
        onSubmit={save}
        className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"
      >
        <label
          className="block font-bold"
          htmlFor="edit-order-note"
        >
          {t("ملاحظات الطلب")}
        </label>
        <textarea
          id="edit-order-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={disabled}
          rows={4}
          className="mt-3 w-full rounded-xl border border-gray-200 p-3 text-sm"
          placeholder={t("هل لديك أي ملاحظات عن القطع أو الاستلام؟")}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={disabled}
            className="min-h-12 flex-1 rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {t(
              photoBusy
                ? "جاري تجهيز الصور…"
                : editor.pending
                  ? "جاري الحفظ…"
                  : "حفظ التعديلات",
            )}
          </button>
          <button
            type="button"
            disabled={editor.pending}
            onClick={onBack}
            className="min-h-12 rounded-xl border border-primary px-4 font-bold text-primary"
          >
            {t("العودة إلى المنتجات")}
          </button>
        </div>
      </form>
    </div>
  );
}
