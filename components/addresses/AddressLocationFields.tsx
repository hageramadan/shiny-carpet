"use client";

import { useId } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { FiCheck, FiChevronDown, FiMapPin } from "react-icons/fi";
import type { Area, AreaSelection } from "@/lib/api/areas";

export default function AddressLocationFields({
  areas,
  value,
  onChange,
}: {
  areas: Area[];
  value: AreaSelection;
  onChange: (value: AreaSelection) => void;
}) {
  const id = useId();
  const area = areas.find((item) => item.id === value.areaId);
  const governorate = area?.governorates.find((item) => item.id === value.governorateId);
  const fields = [
    {
      key: "governorateId",
      label: "المحافظة / المنطقة",
      options: areas.flatMap((area) =>
        area.governorates.map((governorate) => ({
          value: area.id + ":" + governorate.id,
          name: governorate.name,
          context: area.name,
        })),
      ),
      value: area && governorate ? area.id + ":" + governorate.id : "",
      change: (value: string): AreaSelection => {
        const [areaId, governorateId] = value.split(":").map(Number);
        return { areaId, governorateId };
      },
    },
    {
      key: "districtId",
      label: "المدينة",
      options: (governorate?.districts ?? []).map((district) => ({
        value: String(district.id),
        name: district.name,
        context: "",
      })),
      value: governorate?.districts.some((district) => district.id === value.districtId)
        ? String(value.districtId)
        : "",
      change: (districtId: string): AreaSelection => ({
        areaId: area?.id,
        governorateId: governorate?.id,
        districtId: Number(districtId),
      }),
    },
  ];
  return (
    <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <input
        type="hidden"
        name="areaId"
        value={area?.id ?? ""}
      />
      {fields.map((field, index) => {
        const selected = field.options.find((item) => item.value === field.value);
        const placeholder = field.options.length
          ? "اختر " + field.label
          : index === 1 && !governorate
            ? "اختر المحافظة / المنطقة أولًا"
            : "لا توجد خيارات متاحة";
        return (
          <div
            key={field.key}
            className="min-w-0"
          >
            <label
              htmlFor={id + field.key}
              className="mb-2 block text-sm font-bold text-[#17202A]"
            >
              {field.label}
            </label>
            <input
              type="hidden"
              name={field.key}
              value={
                field.key === "governorateId" ? (governorate?.id ?? "") : field.value
              }
            />
            <Menu.Root
              dir="rtl"
              modal={false}
            >
              <Menu.Trigger
                id={id + field.key}
                type="button"
                aria-label={field.label}
                disabled={!field.options.length}
                className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-[9px] border border-gray-200 bg-white px-3 py-2 text-start text-sm outline-none transition-colors hover:border-primary/60 hover:bg-primary/[0.02] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 data-[state=open]:border-primary data-[state=open]:ring-4 data-[state=open]:ring-primary/10 disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <FiMapPin
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary group-disabled:text-gray-300"
                />
                <span
                  className={
                    "min-w-0 flex-1 truncate " +
                    (selected ? "font-medium text-ink" : "text-muted")
                  }
                >
                  {selected?.name ?? placeholder}
                </span>
                <FiChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180"
                />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Content
                  align="start"
                  sideOffset={8}
                  collisionPadding={16}
                  className="z-150 max-h-[min(18rem,var(--radix-dropdown-menu-content-available-height))] w-[var(--radix-dropdown-menu-trigger-width)] min-w-40 overflow-y-auto rounded-xl border border-gray-100 bg-white p-1.5 text-ink shadow-[0_12px_36px_-10px_rgba(20,56,59,0.22)]"
                >
                  <Menu.RadioGroup
                    value={String(field.value ?? "")}
                    onValueChange={(value) => onChange(field.change(value))}
                  >
                    {field.options.map((option) => (
                      <Menu.RadioItem
                        key={option.value}
                        value={option.value}
                        textValue={option.name}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-primary/10 data-[highlighted]:text-[#087B82] data-[state=checked]:bg-primary/10 data-[state=checked]:font-bold data-[state=checked]:text-[#087B82]"
                      >
                        <span className="min-w-0 flex-1">
                          {option.name}
                          {option.context && (
                            <span className="mt-0.5 block text-xs font-normal text-muted">
                              {option.context}
                            </span>
                          )}
                        </span>
                        <Menu.ItemIndicator>
                          <FiCheck
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                          />
                        </Menu.ItemIndicator>
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                </Menu.Content>
              </Menu.Portal>
            </Menu.Root>
          </div>
        );
      })}
    </div>
  );
}
