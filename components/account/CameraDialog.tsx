"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export default function CameraDialog({
  onCapture,
  onClose,
}: {
  onCapture: (image: File) => void;
  onClose: () => void;
}) {
  const t = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const active = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    active.current = true;
    let cancelled = false;
    let stream: MediaStream | undefined;
    async function start() {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          setError("فتح الكاميرا يتطلب متصفحًا يدعم الكاميرا واتصال HTTPS أو localhost.");
          return;
        }
        const camera = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          camera.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = camera;
        if (video.current) {
          video.current.srcObject = camera;
          await video.current.play();
        }
      } catch (cause) {
        stream?.getTracks().forEach((track) => track.stop());
        if (cancelled) return;
        const name = cause instanceof DOMException ? cause.name : "";
        setError(
          name === "NotAllowedError"
            ? "اسمح باستخدام الكاميرا من إعدادات المتصفح ثم حاول مرة أخرى."
            : name === "NotFoundError"
              ? "لم يتم العثور على كاميرا متصلة بالجهاز."
              : "تعذر تشغيل الكاميرا. تأكد أنها غير مستخدمة في تطبيق آخر ثم حاول مرة أخرى.",
        );
      }
    }
    void start();
    return () => {
      cancelled = true;
      active.current = false;
      stream?.getTracks().forEach((track) => track.stop());
      modal?.close();
    };
  }, []);

  function capture() {
    const source = video.current;
    if (!source || !ready || capturing || !source.videoWidth) return;
    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1280 / Math.max(source.videoWidth, source.videoHeight));
      canvas.width = Math.round(source.videoWidth * scale);
      canvas.height = Math.round(source.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!active.current) return;
          setCapturing(false);
          if (!blob || blob.size > 5 * 1024 * 1024) {
            setError("تعذر التقاط الصورة. حاول مرة أخرى.");
            return;
          }
          onCapture(new File([blob], "profile-camera.jpg", { type: "image/jpeg" }));
          onClose();
        },
        "image/jpeg",
        0.9,
      );
    } catch {
      setCapturing(false);
      setError("تعذر التقاط الصورة. حاول مرة أخرى.");
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="camera-title"
      dir={t.dir}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-5 text-center text-ink shadow-xl backdrop:bg-black/45"
    >
      <h2
        id="camera-title"
        className="mb-4 text-lg font-bold"
      >
        {t("التقاط صورة بالكاميرا")}
      </h2>
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        aria-label={t("معاينة الكاميرا")}
        onLoadedData={() => setReady(true)}
        className="aspect-square w-full rounded-xl bg-black object-contain"
      />
      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm text-red-700"
        >
          {t(error)}
        </p>
      ) : (
        !ready && (
          <p
            role="status"
            className="mt-3 text-sm"
          >
            {t("جاري تشغيل الكاميرا…")}
          </p>
        )
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!ready || !!error || capturing}
          onClick={capture}
          className="min-h-11 rounded-lg bg-primary px-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {t("التقاط الصورة")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-gray-200 px-3 text-sm font-bold"
        >
          {t("إلغاء")}
        </button>
      </div>
    </dialog>
  );
}
