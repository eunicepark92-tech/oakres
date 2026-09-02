/**
 * Helper to compress image file using HTML5 Canvas before converting to Data URL
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  // Enforce absolute max raw file size limit (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기가 너무 큽니다. (최대 10MB 이하의 이미지 파일만 업로드할 수 있습니다.)');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('올바른 이미지 파일이 아닙니다.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw image on canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp/jpeg data url
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
