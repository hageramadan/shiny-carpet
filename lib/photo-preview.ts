export function createPhotoPreview(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      try {
        const scale = Math.min(
          1,
          240 / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(undefined);
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const preview = canvas.toDataURL("image/jpeg", 0.65);
        resolve(preview.length <= 100000 ? preview : undefined);
      } catch {
        resolve(undefined);
      }
    };
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}
