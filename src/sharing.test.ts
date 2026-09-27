// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { shareWithImages } from "./sharing";
const image = {
  name: "workshop.png",
  url: "data:image/png;base64,aGVsbG8=",
  mimeType: "image/png",
  data: "aGVsbG8=",
};
afterEach(() => vi.restoreAllMocks());
function mockSharing(can: boolean, error?: Error) {
  const share = error
    ? vi.fn().mockRejectedValue(error)
    : vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: vi.fn(() => can),
  });
  return share;
}
describe("image handoff", () => {
  it("passes the actual files and complete post text to the share target", async () => {
    const share = mockSharing(true);
    expect(await shareWithImages("Workshop reflections #Design", [image])).toBe(
      "shared",
    );
    const payload = share.mock.calls[0][0];
    expect(payload.text).toBe("Workshop reflections #Design");
    expect(payload.files[0]).toBeInstanceOf(File);
    expect(payload.files[0].name).toBe("workshop.png");
    expect(payload.files[0].type).toBe("image/png");
    expect(payload.files[0].size).toBe(5);
  });
  it("falls back without silently dropping images when files are unsupported", async () => {
    const share = mockSharing(false);
    expect(await shareWithImages("Post", [image])).toBe("unsupported");
    expect(share).not.toHaveBeenCalled();
  });
  it("does not open another dialog or publish when the user cancels", async () => {
    mockSharing(true, new DOMException("Cancelled", "AbortError"));
    expect(await shareWithImages("Post", [image])).toBe("cancelled");
  });
});
