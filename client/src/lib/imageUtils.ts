const MAX_SIZE_BYTES = 500 * 1024;
const MAX_DIMENSION = 2400;

export async function convertToWebP(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const isWebP = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");
    if (!isWebP) {
      reject(new Error("Only WebP images are accepted. Please upload a .webp file."));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const tryQuality = (quality: number, low: number, high: number) => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }

          if (blob.size <= MAX_SIZE_BYTES) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Read failed"));
            reader.readAsDataURL(blob);
          } else if (high - low < 0.05) {
            reject(new Error("Image is too complex to compress below 500KB. Try a smaller or simpler image."));
          } else {
            const next = (low + quality) / 2;
            tryQuality(next, low, quality);
          }
        }, "image/webp", quality);
      };

      tryQuality(0.85, 0.1, 0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export function dataUrlSizeBytes(dataUrl: string): number {
  const base64 = dataUrl.indexOf(",") !== -1 ? dataUrl.split(",")[1] : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

export async function recompressDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const tryQuality = (quality: number, low: number, high: number) => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }

          if (blob.size <= MAX_SIZE_BYTES) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Read failed"));
            reader.readAsDataURL(blob);
          } else if (high - low < 0.05) {
            reject(new Error("Cannot compress below 500KB."));
          } else {
            const next = (low + quality) / 2;
            tryQuality(next, low, quality);
          }
        }, "image/webp", quality);
      };

      tryQuality(0.85, 0.1, 0.85);
    };

    img.onerror = () => reject(new Error("Failed to load image for recompression"));
    img.src = dataUrl;
  });
}
