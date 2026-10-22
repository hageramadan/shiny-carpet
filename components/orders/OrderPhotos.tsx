import Image from "next/image";
import { FiFileText, FiImage } from "react-icons/fi";
import type { OrderPhoto } from "@/lib/data";

export default function OrderPhotos({ photos = [] }: { photos?: OrderPhoto[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
      <h2 className="text-lg font-bold text-ink">الصور المضافة للطلب</h2>
      <p className="mt-3 text-xs leading-7 text-muted">
        {photos.length
          ? photos.length + " صور محفوظة للمعاينة المحلية عند استكمال الطلب."
          : "لم تتم إضافة صور لهذا الطلب."}
      </p>
      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {photos.map((photo, index) => (
            <li
              key={photo.name + index}
              className="min-w-0"
            >
              {photo.preview?.startsWith("data:image/jpeg;base64,") ? (
                <Image
                  src={photo.preview}
                  alt={photo.name}
                  width={112}
                  height={112}
                  unoptimized
                  className="aspect-square h-auto w-full rounded-xl sm:size-28 border border-gray-200 object-cover"
                />
              ) : (
                <span className="flex min-w-0 max-w-56 items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 p-2 text-xs sm:p-4 text-muted">
                  <FiFileText className="shrink-0 text-lg text-primary" />
                  <span className="break-all">{photo.name}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <FiImage
          aria-hidden="true"
          className="mt-4 text-2xl text-slate-300"
        />
      )}
    </section>
  );
}
