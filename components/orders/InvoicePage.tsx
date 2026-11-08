"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useCallback } from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { fetchInvoice } from "@/lib/api/invoice";
import { useOrdersApi } from "@/hooks/useOrdersApi";
import Logo from "@/components/layout/Logo";
import InvoiceActions from "./InvoiceActions";

export default function InvoicePage({ id }: { id: number }) {
  const t = useTranslation();
  const load = useCallback((signal: AbortSignal) => fetchInvoice(id, signal), [id]);
  const { data: invoice, loading, error, signedIn, reload } = useOrdersApi(load);
  const backHref = `/tracking?order=${id}`;
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-6 sm:py-9">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"
        >
          <FiArrowRight aria-hidden="true" />
          {t("العودة إلى تفاصيل الطلب")}
        </Link>
        <nav
          aria-label={t("مسار الفاتورة")}
          className="mt-2 flex flex-wrap gap-2 text-xs text-muted"
        >
          <Link href="/">{t("الرئيسية")}</Link>
          <span>{t("/")}</span>
          <Link href="/orders">{t("طلباتي")}</Link>
          <span>{t("/")}</span>
          <Link href={backHref}>{t("تفاصيل الطلب")}</Link>
          <span>{t("/")}</span>
          <span>{t("الفاتورة")}</span>
        </nav>
        <div className="mb-7 mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              {t("الفاتورة")}
            </h1>
            {invoice && (
              <p className="mt-2 text-sm text-muted">
                {t(invoice.title)}
                {t(
                  invoice.orderNumber && (
                    <>
                      {t(" ")}
                      {t("للطلب ")}
                      <bdi>{t(invoice.orderNumber)}</bdi>
                    </>
                  ),
                )}
                {t(
                  invoice.issuedAt && (
                    <>
                      {" "}
                      {t(" · صادرة في ")}
                      {t(invoice.issuedAt)}
                    </>
                  ),
                )}
              </p>
            )}
          </div>
          {invoice && (
            <InvoiceActions
              id={id}
              invoice={invoice}
            />
          )}
        </div>
        {loading ? (
          <div
            role="status"
            className="mx-auto grid min-h-64 max-w-4xl place-items-center rounded-2xl border border-gray-200 bg-white text-muted"
          >
            {t("جاري تحميل الفاتورة…")}
          </div>
        ) : !signedIn ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-6">
            <Link
              href={`/login?next=${encodeURIComponent(`/orders/${id}/invoice`)}`}
              className="font-bold text-primary underline"
            >
              {t("سجّل الدخول لعرض الفاتورة")}
            </Link>
          </p>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-gray-200 bg-white p-6"
          >
            <p>{t(error)}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 min-h-11 font-bold text-primary"
            >
              {t("إعادة المحاولة")}
            </button>
          </div>
        ) : invoice ? (
          <article
            aria-label={t("بيانات الفاتورة")}
            className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 sm:p-10"
          >
            <header className="flex flex-wrap items-center justify-between gap-5 border-b border-gray-200 pb-6">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <h2 className="text-lg font-extrabold text-ink sm:text-xl">
                    {t(invoice.title)}
                  </h2>
                  {t(
                    invoice.company.name && (
                      <p className="mt-1 text-xs text-muted">{invoice.company.name}</p>
                    ),
                  )}
                  {t(
                    invoice.company.taxNumber && (
                      <p className="mt-1 text-xs text-muted">
                        {t("الرقم الضريبي: ")}
                        <bdi>{t(invoice.company.taxNumber)}</bdi>
                      </p>
                    ),
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted">{t("رقم الفاتورة")}</p>
                <p
                  dir="ltr"
                  className="mt-2 break-all text-base font-extrabold text-primary"
                >
                  {t(invoice.number)}
                </p>
              </div>
            </header>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {t(
                invoice.orderNumber && (
                  <div className="rounded-xl bg-[#f7f9fa] p-4">
                    <dt className="text-xs text-muted">{t("رقم الطلب")}</dt>
                    <dd className="mt-2 font-bold">
                      <bdi>{t(invoice.orderNumber)}</bdi>
                    </dd>
                  </div>
                ),
              )}
              {t(
                invoice.orderDate && (
                  <div className="rounded-xl bg-[#f7f9fa] p-4">
                    <dt className="text-xs text-muted">{t("تاريخ الطلب")}</dt>
                    <dd className="mt-2 font-bold">{t(invoice.orderDate)}</dd>
                  </div>
                ),
              )}
            </dl>
            <section
              className="mt-7 border-b border-gray-200 pb-6"
              aria-labelledby="invoice-customer-title"
            >
              <h3
                id="invoice-customer-title"
                className="text-base font-bold"
              >
                {t("بيانات العميل")}
              </h3>
              <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-3">
                {invoice.customer.name && (
                  <div>
                    <dt className="text-xs text-muted">{t("اسم العميل")}</dt>
                    <dd className="mt-2 break-words">{t(invoice.customer.name)}</dd>
                  </div>
                )}
                {invoice.customer.phone && (
                  <div>
                    <dt className="text-xs text-muted">{t("رقم الجوال")}</dt>
                    <dd className="mt-2">
                      <bdi>{t(invoice.customer.phone)}</bdi>
                    </dd>
                  </div>
                )}
                {invoice.customer.address && (
                  <div>
                    <dt className="text-xs text-muted">{t("العنوان")}</dt>
                    <dd className="mt-2 break-words leading-7">
                      {t(invoice.customer.address)}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
            <section
              className="mt-6"
              aria-labelledby="invoice-items-title"
            >
              <h3
                id="invoice-items-title"
                className="mb-4 text-base font-bold"
              >
                {t("المنتجات والخدمات")}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-120 text-start text-xs sm:text-sm">
                  <thead className="bg-[#f7f9fa] text-xs text-muted">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 font-normal"
                      >
                        {t("المنتج / الخدمة")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 font-normal"
                      >
                        {t("الكمية")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 font-normal"
                      >
                        {t("سعر الوحدة")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 font-normal"
                      >
                        {t("المجموع")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4">
                          <span className="font-bold">{item.name}</span>
                          {t(
                            item.specifications && (
                              <p className="mt-1 text-xs text-muted">
                                {t(item.specifications)}
                              </p>
                            ),
                          )}
                        </td>
                        <td className="px-3 py-4">{item.quantity}</td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <bdi>{t(item.unitPrice)}</bdi>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 font-bold">
                          <bdi>{t(item.total)}</bdi>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                {t(
                  invoice.thankYou && (
                    <h3 className="text-base font-bold">{t(invoice.thankYou)}</h3>
                  ),
                )}
                {invoice.notices.map((notice, i) => (
                  <p
                    key={i}
                    className="mt-3 text-sm leading-7 text-muted"
                  >
                    {t(notice)}
                  </p>
                ))}
              </div>
              <dl className="rounded-xl bg-[#f7f9fa] p-4 sm:p-5">
                {invoice.summary.map((row) => (
                  <div
                    key={row.label}
                    className="mb-3 flex items-start justify-between gap-3 text-xs leading-6 sm:text-sm"
                  >
                    <dt className="text-muted">{t(row.label)}</dt>
                    <dd className="shrink-0">
                      <bdi>{t(row.value)}</bdi>
                    </dd>
                  </div>
                ))}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 text-lg font-extrabold">
                  <dt>{t("الإجمالي")}</dt>
                  <dd className="text-primary">
                    <bdi>{t(invoice.total)}</bdi>
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
