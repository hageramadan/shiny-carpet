"use client";

import { Fragment, useId, type ReactNode } from "react";

export type AddressFieldsValue = {
  label: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  details: string;
  notes: string;
};

const fields: {
  name: keyof AddressFieldsValue;
  label: string;
  placeholder: string;
  required?: boolean;
  wide?: boolean;
  max: number;
}[] = [
  {
    name: "label",
    label: "اسم العنوان",
    placeholder: "مثال: البيت",
    required: true,
    wide: true,
    max: 50,
  },
  {
    name: "street",
    label: "اسم الشارع",
    placeholder: "أدخل اسم الشارع",
    required: true,
    max: 300,
  },
  {
    name: "building",
    label: "رقم المبنى",
    placeholder: "أدخل رقم المبنى",
    required: true,
    max: 100,
  },
  { name: "floor", label: "الدور", placeholder: "أدخل رقم الدور (اختياري)", max: 30 },
  { name: "apartment", label: "الشقة", placeholder: "أدخل رقم الشقة (اختياري)", max: 30 },
  {
    name: "details",
    label: "تفاصيل إضافية",
    placeholder: "علامة مميزة أو تعليمات الوصول (اختياري)",
    wide: true,
    max: 300,
  },
  {
    name: "notes",
    label: "ملاحظات",
    placeholder: "ملاحظات الاستلام (اختياري)",
    wide: true,
    max: 500,
  },
];

export default function AddressFields({
  value,
  onChange,
  editing = false,
  children,
}: {
  value: AddressFieldsValue;
  onChange: (value: AddressFieldsValue) => void;
  editing?: boolean;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2">
      {fields.map((field) => (
        <Fragment key={field.name}>
          <label
            htmlFor={`${id}-${field.name}`}
            className={`min-w-0 text-sm font-bold text-[#17202A] ${field.wide ? "sm:col-span-2" : ""}`}
          >
            {field.label}
            <input
              id={`${id}-${field.name}`}
              name={field.name}
              required={
                field.required &&
                !(editing && (field.name === "street" || field.name === "building"))
              }
              maxLength={field.max}
              value={value[field.name]}
              onChange={(event) =>
                onChange({ ...value, [field.name]: event.target.value })
              }
              placeholder={field.placeholder}
              className="mt-2 min-h-11 w-full min-w-0 rounded-[9px] border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-ink placeholder:text-muted"
            />
          </label>
          {field.name === "label" && children}
        </Fragment>
      ))}
    </div>
  );
}
