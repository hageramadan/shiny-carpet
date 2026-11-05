"use client";

import Link from "next/link";
import { FiFileText } from "react-icons/fi";

export default function OrderInvoice({ id }: { id: number }) {
  return (
    <Link
      href={`/orders/${id}/invoice`}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-ink"
    >
      <FiFileText aria-hidden="true" />
      عرض الفاتورة
    </Link>
  );
}
