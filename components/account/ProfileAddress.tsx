import Link from "next/link";
import type { Address } from "@/lib/data";
import { addressLines } from "@/lib/addresses";

export default function ProfileAddress({
  address,
  count,
}: {
  address?: Address;
  count: number;
}) {
  return (
    <section
      aria-labelledby="profile-address-heading"
      className="rounded-xl border border-gray-200 bg-white p-4"
    >
      <h2
        id="profile-address-heading"
        className="text-xl font-bold text-[#17202A]"
      >
        عنوان الاستلام والتوصيل
      </h2>
      {address ? (
        <>
          <h3 className="mt-4 text-lg font-bold text-[#17202A]">{address.label}</h3>
          <address className="mt-3 space-y-3 text-sm not-italic leading-7 text-muted">
            {addressLines(address).map((line, index) => (
              <p
                key={index}
                className="break-words"
              >
                {line}
              </p>
            ))}
          </address>
          {count > 1 && (
            <p className="mt-2 text-xs text-muted">
              يمكنك عرض جميع عناوينك من إدارة العناوين.
            </p>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm leading-7 text-muted">
          لا توجد عناوين محفوظة بعد. أضف عنوان الاستلام والتوصيل من إدارة العناوين.
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <Link
          href="/addresses"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary bg-white px-6 py-2 text-sm font-extrabold text-[#087B82] md:text-base transition-colors hover:bg-primary/5 sm:w-49"
        >
          إدارة العناوين
        </Link>
      </div>
    </section>
  );
}
