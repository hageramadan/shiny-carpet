"use client";
import { useSettings } from "@/components/settings/SettingsProvider";
export default function OrdersSupport() {
  const { data: settings } = useSettings();
  const phone = settings?.phone;
  const email = settings?.email;

  return (
    <aside
      aria-labelledby="orders-support-heading"
      className="mt-6 rounded-xl border border-primary/5 bg-[#e5f6f8] p-4 sm:p-5"
    >
      <h2
        id="orders-support-heading"
        className="text-lg font-bold"
      >
        هل تحتاج إلى مساعدة؟
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        فريق شايني كاربت هنا لمساعدتك في تفاصيل طلبك.
      </p>
      {(phone || email) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {email && (
            <a
              href={`mailto:${email}`}
              className="hover:text-primary"
            >
              <bdi>{email}</bdi>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="hover:text-primary"
            >
              <bdi>{phone}</bdi>
            </a>
          )}
        </div>
      )}
      {email || phone ? (
        <a
          href={email ? `mailto:${email}` : `tel:${phone}`}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-primary bg-white px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          تواصل مع الدعم
        </a>
      ) : (
        <details className="mt-3 text-sm">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-lg border border-primary bg-white px-5 py-2 font-bold text-primary transition-colors hover:bg-primary/5">
            تواصل مع الدعم
          </summary>
          <p className="mt-3 leading-6 text-muted">
            بيانات التواصل غير متاحة حاليًا. يمكنك مراجعة تفاصيل طلبك من زر «عرض
            التفاصيل».
          </p>
        </details>
      )}
    </aside>
  );
}
