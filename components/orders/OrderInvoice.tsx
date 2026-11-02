"use client";

import { useEffect, useRef } from "react";
import { FiDownload } from "react-icons/fi";
import { useAuthAction } from "@/hooks/useAuthAction";
import { fetchInvoice } from "@/lib/api/invoice";
import { ApiError } from "@/lib/api/client";
import { readAuthSession } from "@/lib/auth/session";
import { createInvoicePdf } from "@/lib/invoice-pdf";

export default function OrderInvoice({ id }: { id: number }) {
  const { pending, error, run } = useAuthAction();
  const downloadUrl = useRef("");
  useEffect(
    () => () => {
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    },
    [],
  );

  function download() {
    void run("invoice", async (signal) => {
      const token = readAuthSession()?.token;
      const invoice = await fetchInvoice(id, signal);
      const pdf = await createInvoicePdf(invoice, signal);
      signal.throwIfAborted();
      if (readAuthSession()?.token !== token) throw new ApiError(401);
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
      downloadUrl.current = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = downloadUrl.current;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  return (
    <div className="inline-flex max-w-full flex-col gap-2">
      <button
        type="button"
        onClick={download}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-ink disabled:opacity-50"
      >
        <FiDownload aria-hidden="true" />
        {pending ? "جاري تحميل الفاتورة…" : "تحميل الفاتورة"}
      </button>
      {error && (
        <p
          role="alert"
          className="max-w-xs text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
