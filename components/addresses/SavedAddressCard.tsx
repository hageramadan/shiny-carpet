import Link from "next/link";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import type { Address } from "@/lib/data";
import { addressLines } from "@/lib/addresses";

export default function SavedAddressCard({
  address,
  isDefault,
  onDefault,
  onDelete,
}: {
  address: Address;
  isDefault: boolean;
  onDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="break-words text-lg font-bold text-[#17202A]">
              {address.label}
            </h3>
            {isDefault && <span className="text-xs text-primary">العنوان الافتراضي</span>}
          </div>
          <address className="mt-5 space-y-3 text-sm not-italic leading-7 text-muted">
            {addressLines(address).map((line, index) => (
              <p
                key={index}
                className="break-words"
              >
                {line}
              </p>
            ))}
          </address>
          {!isDefault && (
            <button
              type="button"
              onClick={onDefault}
              className="mt-3 min-h-8 text-xs font-semibold text-primary hover:underline"
            >
              تعيين كعنوان افتراضي
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <Link
            href={`/addresses/${encodeURIComponent(address.id)}/edit`}
            aria-label={`تعديل عنوان ${address.label}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-extrabold text-[#087B82] md:text-base transition-colors hover:bg-primary/5"
          >
            <FiEdit3 aria-hidden="true" />
            تعديل
          </Link>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`حذف عنوان ${address.label}`}
            className="inline-flex min-h-11 items-center gap-2 px-2 py-2 text-sm font-semibold text-[#f44e51] transition-colors hover:text-red-700"
          >
            <FiTrash2 aria-hidden="true" />
            حذف
          </button>
        </div>
      </div>
    </article>
  );
}
