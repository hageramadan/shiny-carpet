"use client";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { FiImage, FiUpload, FiX } from "react-icons/fi";
import type { OrderPhoto } from "@/lib/data";
import { createPhotoPreview } from "@/lib/photo-preview";

type Preview = OrderPhoto & { id: string; url: string; modified: number };

export default function PhotoUpload({
  onChange,
  onBusyChange,
}: {
  onChange: (photos: OrderPhoto[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
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
      next.map(({ name, type, size, preview }) => ({ name, type, size, preview })),
    );
  }

  function add(files: File[]) {
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
            photo.name === file.name &&
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
        name: file.name,
        size: file.size,
        type: file.type,
        modified: file.lastModified,
        url,
      });
      jobs.current += 1;
      onBusyChange?.(true);
      void createPhotoPreview(url)
        .then((preview) => {
          if (!mounted.current || !urls.current.has(url)) return;
          if (preview)
            update(
              photoState.current.map((photo) =>
                photo.id === id ? { ...photo, preview } : photo,
              ),
            );
          else {
            URL.revokeObjectURL(url);
            urls.current.delete(url);
            update(photoState.current.filter((photo) => photo.id !== id));
            setError("تعذر تجهيز إحدى الصور. اختر صورة أخرى.");
          }
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
    URL.revokeObjectURL(photo.url);
    urls.current.delete(photo.url);
    update(photoState.current.filter((item) => item.id !== photo.id));
    setError("");
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
      <h2 className="flex flex-wrap items-center gap-2 text-base font-bold text-ink">
        <FiImage className="text-primary" />
        صور السجاد <span className="text-xs font-normal text-muted">(اختياري)</span>
      </h2>
      <p className="mt-3 text-xs leading-7 text-muted">
        اختر صور القطع من الموبايل أو اسحبها هنا.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={select}
        className="sr-only"
        tabIndex={-1}
        aria-label="اختيار صور القطع"
      />
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
        className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-primary/10 p-4 text-center sm:p-6"
      >
        <FiUpload className="mx-auto text-2xl text-primary" />
        <p className="mt-3 text-xs leading-7 text-primary">
          اسحب الصور هنا أو اضغط للاختيار
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 min-h-10 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-primary"
        >
          إضافة صور
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 text-xs leading-7 text-red-600"
        >
          {error}
        </p>
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
              <button
                type="button"
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
        الصور بتتحفظ مصغرة للمعاينة المحلية مع الطلب التجريبي. الرفع الفعلي للخدمة عند
        الربط.
      </p>
    </section>
  );
}
