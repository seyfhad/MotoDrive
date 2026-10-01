/**
 * Client-Side Image Compressor using HTML5 Canvas.[span_3](start_span)[span_3](end_span)
 * Compresses raw images to lightweight Base64 strings (~40KB each).[span_4](start_span)[span_4](end_span)
 * 4 images * ~40KB = ~160KB total, well under Firestore's 1MB document limit.[span_5](start_span)[span_5](end_span)
 */
export async function compressImageToBase64(
  file: File | Blob,
  targetSizeKb: number = 40,
  maxDimension: number = 640
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));[span_6](start_span)[span_6](end_span)
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل بيانات الصورة'));[span_7](start_span)[span_7](end_span)
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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

        const canvas = document.createElement('canvas');[span_8](start_span)[span_8](end_span)
        canvas.width = width;[span_9](start_span)[span_9](end_span)
        canvas.height = height;[span_10](start_span)[span_10](end_span)
        const ctx = canvas.getContext('2d');[span_11](start_span)[span_11](end_span)
        if (!ctx) {
          resolve(dataUrl);[span_12](start_span)[span_12](end_span)
          return;[span_13](start_span)[span_13](end_span)
        }

        ctx.drawImage(img, 0, 0, width, height);[span_14](start_span)[span_14](end_span)

        const targetChars = targetSizeKb * 1024 * 1.33;[span_15](start_span)[span_15](end_span)
        let quality = 0.6;[span_16](start_span)[span_16](end_span)
        let resultDataUrl = canvas.toDataURL('image/jpeg', quality);[span_17](start_span)[span_17](end_span)

        if (resultDataUrl.length > targetChars) {[span_18](start_span)[span_18](end_span)
          quality = 0.45;[span_19](start_span)[span_19](end_span)
          resultDataUrl = canvas.toDataURL('image/jpeg', quality);[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)
        }

        if (resultDataUrl.length > targetChars) {[span_22](start_span)[span_22](end_span)
          const scaledCanvas = document.createElement('canvas');[span_23](start_span)[span_23](end_span)
          scaledCanvas.width = Math.round(width * 0.78);[span_24](start_span)[span_24](end_span)
          scaledCanvas.height = Math.round(height * 0.78);[span_25](start_span)[span_25](end_span)
          const scaledCtx = scaledCanvas.getContext('2d');[span_26](start_span)[span_26](end_span)
          if (scaledCtx) {[span_27](start_span)[span_27](end_span)
            scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);[span_28](start_span)[span_28](end_span)
            resultDataUrl = scaledCanvas.toDataURL('image/jpeg', 0.42);[span_29](start_span)[span_29](end_span)
          }
        }

        resolve(resultDataUrl);[span_30](start_span)[span_30](end_span)
      };
      img.src = dataUrl;[span_31](start_span)[span_31](end_span)
    };
    reader.readAsDataURL(file);[span_32](start_span)[span_32](end_span)
  });
}
