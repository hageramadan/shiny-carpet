import { FiCheck } from "react-icons/fi";
import { orderStages, isOrderDelivered } from "@/lib/order-status";
import type { Order } from "@/lib/data";

const steps = [
  "تم استلام الطلب",
  "جاري تجهيز الاستلام",
  "تم استلام السجاد",
  "جاري التنظيف",
  "جاهز للتوصيل",
  "في الطريق إليك",
  "تم التسليم",
];

// Only advance using statuses supplied by the API; no simulated progress or dates.

export default function OrderTimeline({ order }: { order: Order }) {
  const cancelled = order.status === "cancelled";
  const stage = orderStages.find((stage) => stage.id === order.status)!;
  const current = stage.step;
  const delivered = isOrderDelivered(order.status);
  const createdAt = new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(order.createdAt));

  return (
    <section
      aria-labelledby="order-status-title"
      className="min-w-0 rounded-2xl border border-gray-200 bg-white px-4 pb-6 pt-5 sm:px-5"
    >
      <h2
        id="order-status-title"
        className="text-base font-bold text-ink"
      >
        حالة الطلب
      </h2>
      {!cancelled && (
        <p
          role="status"
          className="mt-2 text-xs text-primary"
        >
          {stage.label}
        </p>
      )}
      {cancelled ? (
        <p
          role="status"
          className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
        >
          ملغي
        </p>
      ) : (
        <div
          role="region"
          aria-label="مراحل الطلب"
          tabIndex={0}
          className="mt-5 overflow-x-auto pb-1 focus-visible:outline-primary"
        >
          <ol
            dir="rtl"
            className="grid min-w-[780px] grid-cols-7 pt-1"
          >
            {steps.map((label, index) => {
              const complete = index < current || delivered;
              const active = index === current && !complete;
              return (
                <li
                  key={label}
                  aria-current={
                    active || (delivered && index === current) ? "step" : undefined
                  }
                  className="relative flex min-w-0 flex-col items-center px-1 text-center"
                >
                  {active && index > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 top-4 h-px w-1/2 bg-primary"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={
                      "absolute inset-x-0 top-4 h-px " +
                      (index < current || delivered ? "bg-primary" : "bg-gray-200")
                    }
                  />
                  <span
                    aria-hidden="true"
                    className={
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border " +
                      (complete
                        ? "border-primary/30 bg-primary text-white"
                        : active
                          ? "border-primary bg-[#e5f6f8] text-primary"
                          : "border-gray-200 bg-white text-slate-400")
                    }
                  >
                    {complete ? (
                      <FiCheck
                        className="size-4"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <span
                        className={
                          "size-2.5 rounded-full " +
                          (active ? "bg-primary" : "border border-slate-400")
                        }
                      />
                    )}
                  </span>
                  <h3
                    className={
                      "mt-4 whitespace-nowrap text-[11px] leading-6 " +
                      (complete || active ? "font-semibold text-primary" : "text-muted")
                    }
                  >
                    {label}
                  </h3>
                  <p className="mt-2 text-[10px] leading-5 text-muted">
                    {index === 0 ? (
                      <time dateTime={order.createdAt}>{createdAt}</time>
                    ) : active ? (
                      "قيد التنفيذ"
                    ) : complete ? (
                      "تمت المرحلة"
                    ) : (
                      "قريبًا"
                    )}
                  </p>
                  <span className="sr-only">
                    {complete ? "مكتملة" : active ? "الحالة الحالية" : "مرحلة قادمة"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
