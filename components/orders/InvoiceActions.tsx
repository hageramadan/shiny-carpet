"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { FiDownload, FiShare2 } from "react-icons/fi";
import { useAuthAction } from "@/hooks/useAuthAction";
import type { OrderInvoice } from "@/lib/api/invoice";
import { ApiError } from "@/lib/api/client";
import { readAuthSession } from "@/lib/auth/session";
import { createInvoicePdf } from "@/lib/invoice-pdf";

export default function InvoiceActions({
  id,
  invoice,
}: {
  id: number;
  invoice: OrderInvoice;
}) {
  const { pending, error, run } = useAuthAction();
  const downloadUrl = useRef("");
  useEffect(
    () => () => {
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    },
    [],
  );
  function download() {
    void run("download", async (signal) => {
      const token = readAuthSession()?.token;
      if (!token) throw new ApiError(401);
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
  function share() {
    void run("share", async () => {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({ title: `الفاتورة ${invoice.number}`, url });
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "AbortError"))
            throw error;
        }
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ رابط الفاتورة");
      }
    });
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={download}
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-ink disabled:opacity-50"
        >
          <FiDownload aria-hidden="true" />
          تحميل الفاتورة PDF
        </button>
        <button
          type="button"
          onClick={share}
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
        >
          <FiShare2 aria-hidden="true" />
          مشاركة الفاتورة
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
