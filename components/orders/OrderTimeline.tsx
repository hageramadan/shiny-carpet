import { FiCheck } from "react-icons/fi";
import { orderStageIndex, orderStages } from "@/lib/order-status";
import type { Order } from "@/lib/data";

export default function OrderTimeline({ order }: { order: Order }) {
  const current = orderStageIndex(order.status);
  return (
    <section
      aria-labelledby="order-status-title"
      className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6"
    >
      <h2
        id="order-status-title"
        className="text-lg font-bold text-ink"
      >
        حالة الطلب
      </h2>
      <ol className="mt-5 grid gap-5 sm:mt-7 sm:gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-0">
        {orderStages.map((stage, index) => {
          const complete =
            index < current || (index === current && current === orderStages.length - 1);
          const active = index === current;
          return (
            <li
              key={stage.id}
              aria-current={active ? "step" : undefined}
              className="relative flex items-start gap-3 max-sm:after:absolute max-sm:after:top-8 max-sm:after:right-3.75 max-sm:after:-bottom-5 max-sm:after:w-px max-sm:after:bg-gray-200 max-sm:last:after:hidden lg:flex-col lg:gap-0 lg:text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={
                    "absolute left-1/2 right-[-50%] top-4 hidden h-px lg:block " +
                    (index <= current ? "bg-primary" : "bg-gray-200")
                  }
                />
              )}
              <span
                className={
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border " +
                  (complete
                    ? "border-gray-200 bg-primary text-white"
                    : active
                      ? "border-gray-200 bg-white text-primary ring-2 ring-primary/30 ring-offset-2"
                      : "border-gray-200 bg-white text-slate-300")
                }
              >
                {complete ? (
                  <FiCheck />
                ) : (
                  <span
                    className={
                      "size-2 rounded-full " + (active ? "bg-primary" : "bg-slate-200")
                    }
                  />
                )}
              </span>
              <div className="lg:mt-3">
                <h3
                  className={
                    "text-sm font-bold leading-6 lg:text-xs " +
                    (index <= current ? "text-primary" : "text-muted")
                  }
                >
                  {stage.label}
                </h3>
                <p className="mt-1 text-xs leading-5 lg:text-[10px] text-muted">
                  {index === 0
                    ? new Date(order.createdAt).toLocaleString("ar-EG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : active
                      ? "الحالة الحالية"
                      : index < current
                        ? "تمت المرحلة"
                        : "بانتظار هذه المرحلة"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 text-xs leading-6 text-muted">
        تتبع توضيحي لطلب تجريبي. تحديثات التنفيذ الفعلية متاحة بعد الربط.
      </p>
    </section>
  );
}
