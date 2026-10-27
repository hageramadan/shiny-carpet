export default function AddressEditorLoading() {
  return (
    <div
      role="status"
      aria-label="جاري تحميل بيانات العنوان"
      aria-busy="true"
      className="grid min-h-[420px] place-items-center rounded-2xl border border-gray-200 bg-white"
    >
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden="true"
          className="size-11 animate-spin rounded-full border-4 border-primary/15 border-t-primary motion-reduce:animate-none"
        />
        <p className="text-sm text-muted">جاري تحميل بيانات العنوان…</p>
      </div>
    </div>
  );
}
