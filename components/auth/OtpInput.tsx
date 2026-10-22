"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { normalizeDigits } from "@/lib/demo-auth";

export default function OtpInput({
  value,
  onChange,
  invalid,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  invalid: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function fill(index: number, text: string) {
    const digits = normalizeDigits(text).replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const start = digits.length === 6 ? 0 : index;
    const next = [...value];
    for (let offset = 0; offset < digits.length && start + offset < 6; offset++) {
      next[start + offset] = digits[offset];
    }
    onChange(next);
    inputs.current[Math.min(start + digits.length, 5)]?.focus();
  }

  function paste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    fill(index, event.clipboardData.getData("text"));
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const target = value[index] ? index : Math.max(0, index - 1);
      const next = [...value];
      next[target] = "";
      onChange(next);
      inputs.current[target]?.focus();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const next = index + (event.key === "ArrowLeft" ? -1 : 1);
      inputs.current[Math.max(0, Math.min(5, next))]?.focus();
    }
  }

  return (
    <fieldset className="mt-3">
      <legend className="sr-only">رمز التحقق المكون من ستة أرقام</legend>
      <div
        dir="ltr"
        className="mx-auto flex max-w-84.5 justify-between gap-2"
      >
        {value.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`الرقم ${index + 1} من رمز التحقق`}
            aria-invalid={invalid}
            aria-describedby={invalid ? "otp-error" : "otp-demo-note"}
            value={digit}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              if (!event.target.value) {
                const next = [...value];
                next[index] = "";
                onChange(next);
              } else {
                fill(index, event.target.value);
              }
            }}
            onPaste={(event) => paste(event, index)}
            onKeyDown={(event) => keyDown(event, index)}
            className="h-12 w-0 min-w-0 flex-1 rounded-[9px] border border-gray-200 bg-white text-center text-xl font-bold text-[#17202A] transition-colors focus:border-primary aria-invalid:border-red-500"
          />
        ))}
      </div>
    </fieldset>
  );
}
