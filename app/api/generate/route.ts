import "server-only";
import { POST_SYSTEM_PROMPT } from "../../../server/prompt";
import type { PostForm, ImageInput, GeneratedPost } from "../../../src/types";
export const runtime = "nodejs";
export const maxDuration = 60;
interface GenerationRequest {
  form: PostForm;
  images?: ImageInput[];
  instruction?: string;
  previous?: string;
}
interface GeminiResponse {
  error?: { status?: string };
  candidates?: {
    content?: { parts?: { thought?: boolean; text?: string }[] };
  }[];
}
const fail = (status: number, error: string) =>
  Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 4_000_000)
    return fail(413, "Your images are too large. Try fewer or smaller images.");
  let body: GenerationRequest;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 4_000_000)
      return fail(
        413,
        "Your images are too large. Try fewer or smaller images.",
      );
    body = JSON.parse(raw);
    if (!body || typeof body !== "object")
      return fail(400, "A valid post request is required.");
  } catch {
    return fail(400, "A valid JSON request is required.");
  }
  const { form, images = [], instruction = "", previous = "" } = body;
  if (
    !form ||
    typeof form.idea !== "string" ||
    (!form.idea.trim() && (!Array.isArray(images) || !images.length))
  )
    return fail(400, "Add an idea or a photo to get started.");
  if (
    form.idea.length > 10000 ||
    typeof instruction !== "string" ||
    instruction.length > 5000 ||
    typeof previous !== "string" ||
    previous.length > 3000
  )
    return fail(400, "Your post context is too long. Please shorten it.");
  if (
    Object.values(form).some(
      (value) => typeof value !== "string" && typeof value !== "boolean",
    )
  )
    return fail(400, "Post settings must be text or toggles.");
  if (
    Object.entries(form).some(
      ([key, value]) =>
        key !== "idea" && typeof value === "string" && value.length > 5000,
    )
  )
    return fail(400, "Please keep each context field under 5,000 characters.");
  if (
    !Array.isArray(images) ||
    images.length > 4 ||
    images.some(
      (image) =>
        !image ||
        !/^image\/(jpeg|png|webp)$/.test(image.mimeType) ||
        typeof image.data !== "string" ||
        !image.data.length ||
        image.data.length > 900_000 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(image.data),
    )
  )
    return fail(
      400,
      "Use up to four valid, optimized JPG, PNG, or WebP images.",
    );
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return fail(
      503,
      "Set GEMINI_API_KEY in the server environment to enable generation.",
    );
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(50000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: POST_SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: JSON.stringify({
                    context: form,
                    revision: instruction,
                    previousDraft: previous,
                  }),
                },
                ...images.map((image) => ({
                  inlineData: { mimeType: image.mimeType, data: image.data },
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.85,
            maxOutputTokens: 6000,
          },
        }),
      },
    );
    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      console.error(
        "Gemini request failed:",
        response.status,
        data.error?.status,
      );
      return fail(
        response.status === 429 ? 429 : 502,
        response.status === 429
          ? "Gemini’s rate limit was reached. Wait a moment and try again."
          : [400, 401, 403].includes(response.status)
            ? "Google could not authorize this request. Check your AI Studio key and model access."
            : "Gemini is unavailable for this request. Check your model access and try again.",
      );
    }
    const raw = data.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text || "")
      .join("");
    const result = JSON.parse(raw || "{}") as { posts: GeneratedPost[] };
    if (
      !Array.isArray(result.posts) ||
      result.posts.length !== 3 ||
      result.posts.some(
        (post) =>
          !post ||
          typeof post.label !== "string" ||
          typeof post.text !== "string" ||
          !post.text.trim() ||
          post.text.length > 3000,
      )
    )
      throw Error("Invalid model response");
    return Response.json(
      { posts: result.posts },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Generation error:",
      error instanceof Error ? error.name : "Unknown",
    );
    return fail(
      502,
      error instanceof Error && error.name === "TimeoutError"
        ? "Generation took too long. Please try again."
        : "The model could not produce a valid draft. Please try again.",
    );
  }
}
