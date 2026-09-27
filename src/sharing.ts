/** Text handoff to LinkedIn's web composer. Images require manual attachment.
 * LinkedIn may drop the parameters across sign-in, so callers also offer copy.
 */
export function linkedinComposerUrl(text: string): string {
  const url = new URL("https://www.linkedin.com/feed/");
  url.searchParams.set("shareActive", "true");
  url.searchParams.set("text", text);
  return url.toString();
}

import type { ImageInput } from "./types";

export function imageFiles(images: ImageInput[]): File[] {
  return images.map((image) => {
    const bytes = Uint8Array.from(atob(image.data), (character) =>
      character.charCodeAt(0),
    );
    return new File([bytes], image.name, { type: image.mimeType });
  });
}

/** Invoke immediately within a click event to retain browser user activation. */
export async function shareWithImages(
  text: string,
  images: ImageInput[],
): Promise<"shared" | "cancelled" | "unsupported"> {
  if (!navigator.share || !navigator.canShare) return "unsupported";
  try {
    const data: ShareData = { text, files: imageFiles(images) };
    if (!navigator.canShare(data)) return "unsupported";
    await navigator.share(data);
    return "shared";
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError"
    )
      return "cancelled";
    return "unsupported";
  }
}
