"use client";
import { useState, type FormEvent } from "react";
import OrderDetails from "./OrderDetails";
export default function TrackingPage({ initialId = "" }: { initialId?: string }) {
  const [input, setInput] = useState(initialId),
    [query, setQuery] = useState(initialId);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(input.trim().replace(/^#/, ""));
  }
  return (
    <section className="min-h-[70vh] bg-[#f7f9fa] py-7">
      <div className="container mx-auto space-y-6 px-4 sm:px-8">
        <h1 className="text-3xl font-extrabold">تتبع الطلب</h1>
        <form
          onSubmit={search}
          className="flex gap-3"
        >
          <label className="flex-1">
            رقم الطلب
            <input
              required
              inputMode="numeric"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3"
            />
          </label>
          <button className="self-end rounded-xl bg-primary px-5 py-3 text-white">
            عرض الطلب
          </button>
        </form>
        {query && (
          <OrderDetails
            key={query}
            id={query}
          />
        )}
      </div>
    </section>
  );
}
