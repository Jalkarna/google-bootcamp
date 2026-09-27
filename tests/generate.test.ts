import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { POST } from "../app/api/generate/route";
beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-server-secret"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const request = (body: unknown) =>
  new Request("http://localhost/api/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
describe("server-only Gemini route", () => {
  it("rejects invalid input before contacting Gemini", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      (await POST(request({ form: { idea: "" }, images: [] }))).status,
    ).toBe(400);
    expect(
      (await POST(request({ form: { idea: "test" }, images: null }))).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects requests over the Vercel-safe limit", async () => {
    const r = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "content-length": "4100000" },
      body: "{}",
    });
    expect((await POST(r)).status).toBe(413);
  });
  it("returns safe configuration errors without a server key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const r = await POST(request({ form: { idea: "Our workshop" } }));
    expect(r.status).toBe(503);
  });
  it("sends key only upstream and returns posts without secrets", async () => {
    const posts = [
      { label: "Storytelling", text: "I am attending our design workshop." },
      { label: "Insight-led", text: "Accessibility matters." },
      { label: "Short", text: "Design for everyone." },
    ];
    const upstream = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify({ posts }) }] } },
          ],
        }),
      });
    vi.stubGlobal("fetch", upstream);
    const response = await POST(
      request({
        form: { idea: "Community workshop", activity: "Attending an event" },
        images: [{ mimeType: "image/png", data: "aGVsbG8=" }],
      }),
    );
    expect(response.status).toBe(200);
    const result = await response.text();
    expect(result).not.toContain("test-server-secret");
    expect(JSON.parse(result)).toEqual({ posts });
    expect(upstream.mock.calls[0][1].headers["x-goog-api-key"]).toBe(
      "test-server-secret",
    );
    const payload = JSON.parse(upstream.mock.calls[0][1].body);
    expect(payload.contents[0].parts[1].inlineData.data).toBe("aGVsbG8=");
    expect(payload.systemInstruction.parts[0].text).toContain(
      "never an image description",
    );
  });
  it("does not expose upstream error bodies or credentials", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 403,
          json: async () => ({
            error: {
              status: "PERMISSION_DENIED",
              message: "test-server-secret",
            },
          }),
        }),
    );
    const response = await POST(request({ form: { idea: "Workshop" } }));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("test-server-secret");
  });
});
