export default function ProductsLoading() {
  return (
    <section
      role="status"
      aria-label="جاري تحميل المنتجات"
      className="min-h-[60vh] bg-soft py-6"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <span className="sr-only">جاري تحميل المنتجات…</span>
        <div
          aria-hidden="true"
          className="mb-6 h-8 w-36 animate-pulse rounded-lg bg-primary/10 motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-2xl bg-primary/10 motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
