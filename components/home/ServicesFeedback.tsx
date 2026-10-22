"use client";

export default function ServicesFeedback({
  error = false,
  onRetry,
}: {
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className="rounded-3xl border border-gray-200 bg-soft px-5 py-10 text-center"
    >
      <p className="text-sm leading-7 text-muted sm:text-base">
        {error
          ? "تعذر تحميل الخدمات الآن. حاول مرة أخرى."
          : "لا توجد خدمات متاحة حاليًا."}
      </p>
      {error && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-button transition-colors hover:bg-ink disabled:cursor-wait"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
