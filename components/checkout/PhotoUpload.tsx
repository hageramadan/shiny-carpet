"use client";
import { useTranslation } from "@/components/i18n/LanguageProvider";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { FiAlertCircle, FiImage, FiUpload, FiX } from "react-icons/fi";
import type { OrderPhoto } from "@/lib/data";
import { createPhotoPreview } from "@/lib/photo-preview";
import { prepareOrderImage } from "@/lib/order-image";

type Preview = OrderPhoto & {
  id: string;
  url: string;
  modified: number;
  file: File;
  originalName: string;
};

export default function PhotoUpload({
  productName,
  validationError = "",
  required = true,
  disabled = false,
  onChange,
  onBusyChange,
}: {
  productName: string;
  validationError?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (photos: OrderPhoto[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const t = useTranslation();
  const [photos, setPhotos] = useState<Preview[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());
  const photoState = useRef<Preview[]>([]);
  const jobs = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const active = urls.current;
    return () => {
      mounted.current = false;
      active.forEach((url) => URL.revokeObjectURL(url));
      active.clear();
    };
  }, []);

  function update(next: Preview[]) {
    photoState.current = next;
    setPhotos(next);
    onChange(
      next.map(({ name, type, size, preview, file }) => ({
        name,
        type,
        size,
        preview,
        file,
      })),
    );
  }

  function add(files: File[]) {
    if (disabled) return;
    const next = [...photoState.current];
    const messages = new Set<string>();
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        messages.add("اختر صور JPG أو PNG أو WebP.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        messages.add("حجم الصورة الواحدة بحد أقصى ٥ ميجابايت.");
        continue;
      }
      if (
        next.some(
          (photo) =>
            photo.originalName === file.name &&
            photo.size === file.size &&
            photo.modified === file.lastModified,
        )
      )
        continue;
      if (next.length >= 3) {
        messages.add("يمكنك اختيار ٣ صور بحد أقصى.");
        break;
      }
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      const id = crypto.randomUUID();
      next.push({
        id,
        originalName: file.name,
        name: productName,
        size: file.size,
        type: file.type,
        modified: file.lastModified,
        file,
        url,
      });
      jobs.current += 1;
      onBusyChange?.(true);
      void Promise.all([createPhotoPreview(url), prepareOrderImage(file, url)])
        .then(([preview, uploadFile]) => {
          if (!mounted.current || !urls.current.has(url)) return;
          if (preview)
            update(
              photoState.current.map((photo) =>
                photo.id === id
                  ? {
                      ...photo,
                      preview,
                      file: new File(
                        [uploadFile],
                        productName.replace(/[\\/:*?"<>|\x00-\x1f]/g, "-") +
                          (uploadFile.type === "image/png"
                            ? ".png"
                            : uploadFile.type === "image/webp"
                              ? ".webp"
                              : ".jpg"),
                        { type: uploadFile.type, lastModified: uploadFile.lastModified },
                      ),
                    }
                  : photo,
              ),
            );
          else {
            URL.revokeObjectURL(url);
            urls.current.delete(url);
            update(photoState.current.filter((photo) => photo.id !== id));
            setError("تعذر تجهيز إحدى الصور. اختر صورة أخرى.");
          }
        })
        .catch(() => {
          if (!mounted.current || !urls.current.has(url)) return;
          URL.revokeObjectURL(url);
          urls.current.delete(url);
          update(photoState.current.filter((photo) => photo.id !== id));
          setError("تعذر تجهيز إحدى الصور للرفع. اختر صورة أصغر وأعد المحاولة.");
        })
        .finally(() => {
          jobs.current -= 1;
          if (mounted.current) onBusyChange?.(jobs.current > 0);
        });
    }
    update(next);
    setError([...messages].join(" "));
  }

  function select(event: ChangeEvent<HTMLInputElement>) {
    add(Array.from(event.target.files || []));
    event.target.value = "";
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    add(Array.from(event.dataTransfer.files));
  }

  function remove(photo: Preview) {
    if (disabled) return;
    URL.revokeObjectURL(photo.url);
    urls.current.delete(photo.url);
    update(photoState.current.filter((item) => item.id !== photo.id));
    setError("");
  }

  return (
    <section
      aria-labelledby="checkout-photos-title"
      className={
        "rounded-2xl border bg-white p-4 sm:p-5 lg:p-6 " +
        (validationError ? "border-red-400 ring-1 ring-red-200" : "border-gray-200")
      }
    >
      <h2
        id="checkout-photos-title"
        className="flex flex-wrap items-center gap-2 text-base font-bold text-ink"
      >
        <FiImage className="text-primary" />
        {t("صور  ")}
        <span className="text-xs font-normal text-muted">
          {t(required ? "(إجباري)" : "(اختياري)")}
        </span>
      </h2>
      <p className="mt-3 text-xs leading-7 text-muted">
        {t(
          required
            ? "أضف صور السجاد من الموبايل أو اسحبها هنا. صورة واحدة على الأقل مطلوبة لإتمام الطلب."
            : "يمكنك إضافة صور جديدة للطلب، مع الاحتفاظ بالصور الحالية.",
        )}
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={select}
        className="sr-only"
        tabIndex={-1}
        aria-label={t(required ? "اختيار صور السجاد" : "اختيار صور الطلب")}
        aria-required={required}
        disabled={disabled}
        aria-invalid={Boolean(validationError || error)}
        aria-describedby={
          validationError
            ? "checkout-photos-required"
            : error
              ? "checkout-photos-error"
              : undefined
        }
      />
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
        className={
          "mt-4 rounded-2xl border border-dashed p-4 text-center sm:p-6 " +
          (validationError ? "border-red-400 bg-red-50" : "border-gray-200 bg-primary/10")
        }
      >
        <FiUpload className="mx-auto text-2xl text-primary" />
        <p className="mt-3 text-xs leading-7 text-primary">
          {t("اسحب الصور هنا أو اضغط للاختيار")}
        </p>
        <button
          type="button"
          id="checkout-add-photos"
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "checkout-photos-required" : undefined}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-3 min-h-10 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("إضافة صور")}
        </button>
      </div>
      {t(
        validationError && (
          <div
            id="checkout-photos-required"
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
          >
            <FiAlertCircle
              aria-hidden="true"
              className="mt-1 size-5 shrink-0"
            />
            <div>
              <p className="text-sm font-bold">{t("صور السجاد مطلوبة")}</p>
              <p className="mt-1 text-xs leading-7">{t(validationError)}</p>
            </div>
          </div>
        ),
      )}
      {t(
        error && (
          <p
            id="checkout-photos-error"
            role="alert"
            className="mt-3 text-xs leading-7 text-red-600"
          >
            {t(error)}
          </p>
        ),
      )}
      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="relative min-w-0"
            >
              <Image
                src={photo.url}
                alt={photo.name}
                width={96}
                height={96}
                unoptimized
                className="aspect-square h-auto w-full rounded-xl object-cover sm:size-24"
              />
              <p
                className="mt-2 max-w-24 truncate text-xs text-ink"
                title={t(productName)}
              >
                {t(productName)}
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(photo)}
                aria-label={"حذف صورة " + photo.name}
                className="absolute right-1 top-1 grid size-8 place-items-center rounded-full border border-gray-200 bg-white text-ink"
              >
                <FiX />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs leading-6 text-muted">
        {t(
          required
            ? "أضف صورة واحدة على الأقل لإتمام الطلب. بحد أقصى ٣ صور للطلب، وحجم الصورة الواحدة لا يتجاوز ٥ ميجابايت. يتم تقليل حجم الصور الكبيرة قبل إرسالها."
            : "يمكنك إضافة ٣ صور جديدة بحد أقصى، وحجم الصورة الواحدة لا يتجاوز ٥ ميجابايت.",
        )}
      </p>
    </section>
  );
}
