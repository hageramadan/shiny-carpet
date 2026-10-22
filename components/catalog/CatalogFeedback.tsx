"use client";

export default function CatalogFeedback({
  error = false,
  onRetry,
  message,
}: {
  error?: boolean;
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className="rounded-2xl border border-gray-200 bg-white p-6 text-center sm:p-10"
    >
      <p className="text-sm leading-7 text-muted">
        {message ??
          (error
            ? "تعذر تحميل المنتجات. حاول مرة أخرى."
            : "لا توجد منتجات متاحة في هذا التصنيف حاليًا.")}
      </p>
      {error && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-button"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
