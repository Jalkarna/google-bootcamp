import type { ImageInput } from "./types";
/** Generate a bounded analysis copy; preserve original uploads for sharing. */
export async function prepareAnalysisImage(
  image: ImageInput,
): Promise<{ mimeType: string; data: string }> {
  if (image.data.length <= 800_000)
    return { mimeType: image.mimeType, data: image.data };
  const bitmap = await createImageBitmap(
    new Blob(
      [Uint8Array.from(atob(image.data), (char) => char.charCodeAt(0))],
      { type: image.mimeType },
    ),
  );
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw Error("Image processing is unavailable. Try a smaller image.");
    for (let attempt = 0; attempt < 6; attempt++) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const data = canvas
        .toDataURL("image/jpeg", Math.max(0.45, 0.85 - attempt * 0.08))
        .split(",")[1];
      if (data && data.length <= 800_000)
        return { mimeType: "image/jpeg", data };
      canvas.width = Math.max(1, Math.round(canvas.width * 0.8));
      canvas.height = Math.max(1, Math.round(canvas.height * 0.8));
    }
    throw Error("This image is too large to process. Choose a smaller image.");
  } finally {
    bitmap.close();
  }
}
