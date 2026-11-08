"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import OrderDetails from "./OrderDetails";
export default function ConfirmationPage({ id }: { id?: string }) {
  const t = useTranslation();
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-7">
      <div className="container mx-auto space-y-6 px-4 sm:px-8">
        <h1 className="text-3xl font-extrabold">{t("تفاصيل طلبك")}</h1>
        <OrderDetails
          key={id}
          id={id ?? ""}
          confirmation
        />
      </div>
    </section>
  );
}
