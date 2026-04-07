/**
 * react-easy-crop の pixelCrop から JPEG Data URL を生成（長辺 maxOutput に収める）
 */
export function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.src = url;
  });
}

export async function getCroppedImg(imageSrc, pixelCrop, maxOutput = 512) {
  if (!pixelCrop || !pixelCrop.width || !pixelCrop.height) {
    throw new Error("クロップ範囲が無効です。");
  }
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { x, y, width: cropW, height: cropH } = pixelCrop;
  const scale = Math.min(maxOutput / cropW, maxOutput / cropH, 1);
  canvas.width = Math.round(cropW * scale);
  canvas.height = Math.round(cropH * scale);
  ctx.drawImage(image, x, y, cropW, cropH, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}
