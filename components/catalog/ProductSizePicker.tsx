"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import type { Product } from "@/lib/data";
import { productSizeOptions } from "@/lib/product-selection";

type Props = {
  product: Product;
  choice: string;
  length: string;
  width: string;
  onChoice: (value: string) => void;
  onLength: (value: string) => void;
  onWidth: (value: string) => void;
  disabled?: boolean;
};

export default function ProductSizePicker({
  product,
  choice,
  length,
  width,
  onChoice,
  onLength,
  onWidth,
  disabled = false,
}: Props) {
  const t = useTranslation();
  const options = productSizeOptions(product);
  if (product.apiId !== undefined && !product.hasSizes) return null;
  return (
    <div>
      <fieldset
        disabled={disabled}
        className="min-w-0"
      >
        <legend className="mb-3 text-base font-bold text-[#17202A]">
          {t("المقاسات")}
        </legend>
        <div className="grid grid-cols-4 gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-3">
          {options.map((option) => (
            <label
              key={option.value}
              className="min-w-0 cursor-pointer has-[input[value=custom]]:col-start-1"
            >
              <input
                type="radio"
                name="size"
                value={option.value}
                checked={choice === option.value}
                onChange={() => onChoice(option.value)}
                className="peer sr-only"
              />
              <span
                dir={option.label.includes("×") ? "ltr" : undefined}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-transparent bg-[#f3f4f5] px-1 py-2 text-xs font-bold text-[#242424] peer-checked:border-[#242424] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary sm:text-sm"
              >
                {t(option.label)}
              </span>
            </label>
          ))}
        </div>
        {!options.length && (
          <p className="text-sm text-muted">{t("المقاسات غير متاحة حاليًا.")}</p>
        )}
      </fieldset>
      {choice === "custom" && options.some((option) => option.value === "custom") && (
        <fieldset
          disabled={disabled}
          className="mt-4 min-w-0 rounded-2xl bg-primary/10 p-3 sm:p-4"
        >
          <legend className="float-right mb-3 w-full text-sm font-semibold text-[#17202A]">
            {t("أدخل المقاس بالمتر")}
          </legend>
          <div className="clear-both grid grid-cols-2 gap-3 *:min-w-0">
            {[
              { name: "length", label: "الطول", value: length, change: onLength },
              { name: "width", label: "العرض", value: width, change: onWidth },
            ].map((field) => (
              <label
                key={field.name}
                className="text-sm text-ink"
              >
                {t(field.label)}
                <input
                  type="number"
                  name={field.name}
                  min="0.1"
                  max="20"
                  step="0.1"
                  required
                  value={field.value}
                  onChange={(event) => field.change(event.target.value)}
                  placeholder={t("أدخل " + field.label)}
                  className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-base sm:text-sm"
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
