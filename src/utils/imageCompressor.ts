/**
 * Client-Side Image Compressor using HTML5 Canvas.
 * Compresses raw images to lightweight Base64 strings (~40KB each).
 * Allows storing images directly inside Firestore documents while keeping
 * total document payload (~160KB for 4 images) well below Firestore's 1MB limit.
 */
export async function compressImageToBase64(
  file: File | Blob,
  targetSizeKb: number = 40,
  maxDimension: number = 640
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل بيانات الصورة'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down proportionally to max dimension
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Target character count in Base64 for the specified targetSizeKb
        // (Base64 is ~4/3 the size of binary data)
        const targetChars = targetSizeKb * 1024 * 1.33;

        let quality = 0.6;
        let resultDataUrl = canvas.toDataURL('image/jpeg', quality);

        // If larger than target, decrease quality
        if (resultDataUrl.length > targetChars) {
          quality = 0.45;
          resultDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // If still larger, scale down dimensions slightly
        if (resultDataUrl.length > targetChars) {
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.round(width * 0.78);
          scaledCanvas.height = Math.round(height * 0.78);
          const scaledCtx = scaledCanvas.getContext('2d');
          if (scaledCtx) {
            scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            resultDataUrl = scaledCanvas.toDataURL('image/jpeg', 0.42);
          }
        }

        resolve(resultDataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
