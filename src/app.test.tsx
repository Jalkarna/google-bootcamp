// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { App } from "./main";
import { linkedinComposerUrl } from "./sharing";
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("post composer", () => {
  it("encodes complete Unicode text, hashtags, mentions and line breaks for LinkedIn", () => {
    const text =
      "A new chapter 🌱\n\nThanks @Alex & the team!\n#Design #Community https://example.com/?x=1&y=2";
    const url = new URL(linkedinComposerUrl(text));
    expect(url.origin).toBe("https://www.linkedin.com");
    expect(url.searchParams.get("shareActive")).toBe("true");
    expect(url.searchParams.get("text")).toBe(text);
  });
  it("requires context and prevents sharing an empty post", () => {
    render(<App />);
    expect(
      (
        screen.getByRole("button", {
          name: "Open in LinkedIn",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Generate my post" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Start with a few thoughts",
    );
  });
  it("generates, edits, saves and hands the selected draft to LinkedIn", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        posts: [
          { label: "Storytelling", text: "First draft" },
          { label: "Insight-led", text: "Second draft" },
          { label: "Short", text: "Third draft" },
        ],
      }),
    });
    vi.stubGlobal("fetch", request);
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText(/What would you like to share/), {
      target: { value: "Our community design workshop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Your perspective" }));
    fireEvent.click(screen.getByRole("option", { name: "Attending an event" }));
    fireEvent.click(screen.getByRole("button", { name: "Tone of voice" }));
    fireEvent.click(screen.getByRole("option", { name: "Warm & personal" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate my post" }));
    await screen.findByText("First draft");
    expect(JSON.parse(request.mock.calls[0][1].body).form.activity).toBe(
      "Attending an event",
    );
    expect(JSON.parse(request.mock.calls[0][1].body).form.tone).toBe(
      "Warm & personal",
    );
    fireEvent.click(screen.getByRole("button", { name: "Option 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit text" }));
    const text = "Our community is growing 🌱\n\nThanks @Alex! #Design";
    fireEvent.change(
      screen.getByRole("textbox", { name: "Edit generated post" }),
      { target: { value: text } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Open in LinkedIn" }));
    expect(open).toHaveBeenCalledWith(
      linkedinComposerUrl(text),
      "_blank",
      "noopener,noreferrer",
    );
    expect(writeText).toHaveBeenCalledWith(text);
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(JSON.parse(localStorage.getItem("postly-drafts")!)[0].text).toBe(
      text,
    );
    fireEvent.click(screen.getByRole("button", { name: /Saved drafts/ }));
    expect(screen.getByText(/Our community is growing/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open draft" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Edit generated post",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe(text);
  });
  it("shows a recoverable API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Please check your model access." }),
      }),
    );
    render(<App />);
    fireEvent.change(screen.getByLabelText(/What would you like to share/), {
      target: { value: "A useful lesson" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate my post" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Please check your model access.",
      ),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Generate my post",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
});
