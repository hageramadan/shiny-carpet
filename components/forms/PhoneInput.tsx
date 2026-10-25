"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
} from "react";
import PhoneNumberInput, { type Country } from "react-phone-number-input";
import ar from "react-phone-number-input/locale/ar";
import { phoneFlags } from "./phone-flags";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  internationalPhone,
  normalizePhone,
  validPhone,
} from "@/lib/phone";
import PhoneCountrySelect from "./PhoneCountrySelect";

type Props = {
  id?: string;
  name?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  defaultCountry?: Country;
  required?: boolean;
  disabled?: boolean;
  form?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export default function PhoneInput({
  id,
  name = "phone",
  label = "رقم الهاتف",
  value,
  defaultValue = "",
  onChange,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  required = false,
  disabled = false,
  form,
  className = "",
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const attachInput = useCallback((element: unknown) => {
    inputRef.current = element instanceof HTMLInputElement ? element : null;
  }, []);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [touched, setTouched] = useState(false);
  const phone = internationalPhone(value ?? internalValue, defaultCountry);
  const errorId = `${inputId}-error`;
  const error = !phone
    ? required
      ? "يرجى إدخال رقم الهاتف."
      : ""
    : !validPhone(phone, country)
      ? "يرجى إدخال رقم هاتف صحيح للدولة المختارة."
      : "";
  const showError = touched && Boolean(error);

  function changePhone(next = "") {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  }

  useEffect(() => {
    inputRef.current?.setCustomValidity(error);
  }, [error]);

  return (
    <div className={`min-w-0 ${className}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-bold text-ink"
      >
        {label}
      </label>
      <PhoneNumberInput
        ref={attachInput}
        id={inputId}
        value={phone || undefined}
        onChange={changePhone}
        onCountryChange={(next) => setCountry(next ?? defaultCountry)}
        onBlur={(event) => {
          if (event.target instanceof HTMLInputElement) setTouched(true);
        }}
        onInvalid={() => setTouched(true)}
        onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
          // A pasted international number must update the country before national formatting.
          const incoming = normalizePhone(event.clipboardData.getData("text"));
          if (incoming.startsWith("+") && validPhone(incoming)) {
            event.preventDefault();
            changePhone(incoming);
          }
        }}
        defaultCountry={defaultCountry}
        international={false}
        addInternationalOption={false}
        countries={PHONE_COUNTRIES}
        countryOptionsOrder={PHONE_COUNTRIES}
        countrySelectComponent={PhoneCountrySelect}
        flags={phoneFlags}
        labels={ar}
        locales="ar"
        focusInputOnCountrySelection={false}
        required={required}
        disabled={disabled}
        form={form}
        autoComplete="tel"
        inputMode="numeric"
        smartCaret={false}
        aria-invalid={invalid || showError}
        aria-describedby={
          [describedBy, showError ? errorId : undefined].filter(Boolean).join(" ") ||
          undefined
        }
        placeholder="رقم الهاتف"
        containerComponentProps={{ dir: "ltr" }}
        className="mt-2 flex min-h-12 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white font-normal transition-colors hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 [&_.PhoneInputInput]:min-w-0 [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:text-left [&_.PhoneInputInput]:text-base [&_.PhoneInputInput]:text-ink [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-muted sm:[&_.PhoneInputInput]:text-sm"
      />
      {showError && (
        <p
          id={errorId}
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      <input
        type="hidden"
        name={name}
        value={phone}
        form={form}
        disabled={disabled}
      />
    </div>
  );
}
