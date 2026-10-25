"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import { phoneFlags } from "./phone-flags";
import { FiCheck, FiChevronDown, FiGlobe } from "react-icons/fi";
import type { FocusEventHandler } from "react";

type CountryOption = { value?: Country; label: string; divider?: boolean };
type Props = {
  value?: Country;
  onChange: (country?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  "aria-label"?: string;
};

function CountryFlag({ country, label }: { country?: Country; label: string }) {
  const Flag = country ? phoneFlags[country] : undefined;
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[2px] [&>svg]:h-full [&>svg]:w-full"
    >
      {Flag ? <Flag title={label} /> : <FiGlobe />}
    </span>
  );
}

export default function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  onFocus,
  onBlur,
  "aria-label": ariaLabel = "الدولة ورمز الاتصال",
}: Props) {
  const selected = options.find((option) => option.value === value);
  return (
    <Menu.Root
      modal={false}
      dir="ltr"
    >
      <Menu.Trigger
        type="button"
        disabled={disabled || readOnly}
        aria-label={`${ariaLabel}${selected ? `: ${selected.label}` : ""}`}
        onFocus={onFocus}
        onBlur={onBlur}
        className="flex min-h-11 shrink-0 items-center gap-2 self-stretch border-r border-gray-200 bg-soft/60 px-3 text-sm font-normal text-ink outline-none transition-colors hover:bg-primary/10 focus-visible:bg-primary/10 disabled:cursor-not-allowed sm:gap-2.5"
      >
        <span className="inline-flex items-center gap-2">
          <CountryFlag
            country={value}
            label={selected?.label ?? "الدولة"}
          />
          <span dir="ltr">{value ? `+${getCountryCallingCode(value)}` : "الدولة"}</span>
        </span>
        <FiChevronDown
          aria-hidden="true"
          className="size-3.5 text-muted"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-150 max-h-[min(22rem,var(--radix-dropdown-menu-content-available-height))] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 text-ink shadow-xl"
        >
          <Menu.RadioGroup
            value={value ?? ""}
            onValueChange={(country) => onChange(country as Country)}
          >
            {options
              .filter((option): option is CountryOption & { value: Country } =>
                Boolean(option.value && !option.divider),
              )
              .map((option) => (
                <Menu.RadioItem
                  key={option.value}
                  value={option.value}
                  textValue={`${option.label} +${getCountryCallingCode(option.value)}`}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary"
                  dir="rtl"
                >
                  <CountryFlag
                    country={option.value}
                    label={option.label}
                  />
                  <span>{option.label}</span>
                  <span
                    className="ms-auto text-xs text-muted"
                    dir="ltr"
                  >
                    +{getCountryCallingCode(option.value)}
                  </span>
                  <Menu.ItemIndicator>
                    <FiCheck
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                  </Menu.ItemIndicator>
                </Menu.RadioItem>
              ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
