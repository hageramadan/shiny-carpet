// Keep optional order attachments small enough for mobile uploads.
const MAX_UPLOAD_BYTES = 500 * 1024;

export function prepareOrderImage(file: File, url: string): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return Promise.resolve(file);
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onerror = () => reject(new Error("تعذر قراءة الصورة."));
    image.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(
          1,
          1600 / Math.max(image.naturalWidth, image.naturalHeight),
        );
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("تعذر تجهيز الصورة.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.82, 0.65, 0.45, 0.3]) {
          const blob = await new Promise<Blob | null>((done) =>
            canvas.toBlob(done, "image/jpeg", quality),
          );
          if (blob && blob.size > 0 && blob.size <= MAX_UPLOAD_BYTES) {
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: file.lastModified,
              }),
            );
            return;
          }
        }
        throw new Error("تعذر تقليل حجم الصورة. اختر صورة أصغر.");
      } catch (error) {
        reject(error);
      }
    };
    image.src = url;
  });
}
