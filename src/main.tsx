"use client";

import React, { useState, useEffect, useRef } from "react";

import {
  Sparkles,
  PenLine,
  Bookmark,
  LayoutTemplate,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  ImagePlus,
  Building2,
  CalendarDays,
  Hash,
  AtSign,
  ArrowRight,
  Check,
  Copy,
  RotateCcw,
  Monitor,
  Smartphone,
  Globe,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  Lightbulb,
  SlidersHorizontal,
  LoaderCircle,
  Download,
  Trash2,
  Leaf,
  PanelLeftClose,
  CheckCheck,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type {
  PostForm,
  ImageInput,
  GeneratedPost,
  Draft,
  PostTemplate,
} from "./types";
import { linkedinComposerUrl, shareWithImages } from "./sharing";
import { prepareAnalysisImage } from "./images";
const defaults: PostForm = {
  idea: "",
  activity: "Infer from my context",
  organization: "",
  event: "",
  audience: "My professional network",
  tone: "Authentic & conversational",
  length: "Medium · 150–250 words",
  language: "English",
  type: "Share an experience",
  hashtags: "",
  mentions: "",
  cta: "Invite a conversation",
  extra: "",
  includeHashtags: true,
  emojis: false,
  name: "Your name",
  headline: "Your headline goes here",
};
const templates = [
  {
    name: "The event recap",
    tag: "EXPERIENCE",
    icon: CalendarDays,
    text: "Share the people, moments, and ideas that stayed with you.",
    idea: "I attended [event] hosted by [organization]. My three biggest takeaways were [takeaways]. The moment that stood out was [moment].",
    type: "Share an experience",
  },
  {
    name: "A little career news",
    tag: "MILESTONE",
    icon: Sparkles,
    text: "Celebrate a new chapter with a personal touch.",
    idea: "I’m starting a new role as [role] at [organization]. I’m excited about [reason] and grateful to [people] for [support].",
    type: "Celebrate a milestone",
  },
  {
    name: "Something I learned",
    tag: "INSIGHT",
    icon: Lightbulb,
    text: "Turn an everyday lesson into a valuable perspective.",
    idea: "Something I learned about [topic]: [lesson]. Here’s the experience that changed how I think about it: [story].",
    type: "Share an insight",
  },
  {
    name: "Meet what’s next",
    tag: "ANNOUNCEMENT",
    icon: ArrowUpRight,
    text: "Give your launch the introduction it deserves.",
    idea: "We’re introducing [product or initiative] at [organization]. It helps [audience] solve [problem] by [approach]. Learn more: [link].",
    type: "Make an announcement",
  },
];
function Select({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div className="field select-wrap" ref={ref}>
      <label>{label}</label>
      <button
        className={"select " + (open ? "select-open" : "")}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        {Icon && <Icon size={15} />}
        <span>{value}</span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="options" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option}
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
              {value === option && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export function App() {
  const [form, setForm] = useState<PostForm>(() => {
    try {
      return {
        ...defaults,
        ...JSON.parse(localStorage.getItem("postly-form") || "{}"),
      };
    } catch {
      return defaults;
    }
  });
  const [page, setPage] = useState("Create a post");
  const [images, setImages] = useState<ImageInput[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [tab, setTab] = useState("Preview");
  const [drag, setDrag] = useState(false);
  const [saved, setSaved] = useState<Draft[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("postly-drafts") || "[]");
    } catch {
      return [];
    }
  });
  const [profile, setProfile] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [expandedPost, setExpandedPost] = useState(false);
  const [firstLandscape, setFirstLandscape] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const post = posts[selected]?.text || "";
  useEffect(() => {
    localStorage.setItem("postly-form", JSON.stringify(form));
  }, [form]);
  const set = <K extends keyof PostForm>(key: K, value: PostForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const notify = (text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };
  async function addImages(files: FileList | null) {
    setError("");
    const list = Array.from(files || []);
    if (images.length + list.length > 4) {
      setError("You can add up to 4 images.");
      return;
    }
    for (const file of list) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      ) {
        setError("Please choose JPG, PNG, or WebP images under 5 MB.");
        return;
      }
    }
    try {
      const added = await Promise.all(
        list.map(
          (file) =>
            new Promise<ImageInput>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  name: file.name,
                  url: reader.result as string,
                  mimeType: file.type,
                  data: (reader.result as string).split(",")[1],
                });
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
        ),
      );
      setImages((old) => [...old, ...added].slice(0, 4));
    } catch {
      setError("We couldn’t read that image. Please try another file.");
    }
  }
  async function generate(instruction = "") {
    if (!form.idea.trim() && !images.length) {
      setError("Start with a few thoughts or add a photo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          images: await Promise.all(images.map(prepareAnalysisImage)),
          instruction,
          previous: instruction ? post : "",
        }),
      });
      const data = await r.json();
      if (!r.ok)
        throw Error(data.error || "Generation failed. Please try again.");
      setPosts(data.posts);
      setSelected(0);
      notify("Three fresh takes, ready for you.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (!post) {
      notify("Generate a post first to save a draft.");
      return;
    }
    const draft = {
      id: Date.now(),
      text: post,
      form,
      date: new Date().toISOString(),
    };
    try {
      const next = [draft, ...saved];
      localStorage.setItem("postly-drafts", JSON.stringify(next));
      setSaved(next);
      notify("Draft saved to your library.");
    } catch {
      notify("Your browser storage is full. Delete an older draft.");
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(post);
      notify("Copied. Ready to share on LinkedIn.");
    } catch {
      notify("Clipboard unavailable. Select and copy your draft in Edit text.");
    }
  }
  async function openLinkedIn() {
    if (!post.trim() || sharing) return;
    if (images.length) {
      setSharing(true);
      const result = await shareWithImages(post, images);
      setSharing(false);
      if (result === "unsupported") setHandoff(true);
      else if (result === "shared")
        notify(
          "Handed to your share app. Review the text and images there before posting.",
        );
      return;
    }
    openLinkedInText();
  }
  function openLinkedInText() {
    if (!post.trim()) return;
    window.open(linkedinComposerUrl(post), "_blank", "noopener,noreferrer");
    if (navigator.clipboard) {
      void navigator.clipboard
        .writeText(post)
        .then(() =>
          notify(
            "Draft copied too. Paste it if LinkedIn leaves the composer empty.",
          ),
        )
        .catch(() =>
          notify(
            "LinkedIn opened. If the text is missing, copy it from Edit text.",
          ),
        );
    } else
      notify(
        "LinkedIn opened. If the text is missing, copy it from Edit text.",
      );
  }
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([post], { type: "text/plain" }));
    a.download = "linkedin-post.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const loadTemplate = (t: PostTemplate) => {
    setForm((f) => ({ ...f, idea: t.idea, type: t.type }));
    setPage("Create a post");
    notify("Template added. Replace the placeholders with your story.");
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Postly home">
          <span className="brand-mark">
            <PenLine size={22} />
          </span>
          postly<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">P</span>
          <div>
            Personal workspace<small>Your space to create</small>
          </div>
          <span className="workspace-badge">FREE</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {[
            { name: "Create a post", icon: PenLine },
            { name: "Saved drafts", icon: Bookmark },
            { name: "Templates", icon: LayoutTemplate },
          ].map(({ name, icon: Icon }) => (
            <button
              className={page === name ? "nav-item active" : "nav-item"}
              onClick={() => setPage(name)}
              key={name}
            >
              <Icon size={18} />
              {name}
              {name === "Create a post" ? (
                <Plus size={16} className="nav-end" />
              ) : (
                name === "Saved drafts" && (
                  <span className="count">{saved.length}</span>
                )
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-promo">
            <span className="mini-spark">
              <Sparkles size={18} />
            </span>
            <h4>
              A little inspiration.
              <br />A lot of possibility.
            </h4>
            <p>
              Your next great post starts
              <br />
              with an everyday idea.
            </p>
            <button onClick={() => setPage("Templates")}>
              Explore templates <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="profile" onClick={() => setProfile(true)}>
            <span className="avatar">
              {form.name === "Your name"
                ? "Y"
                : form.name.charAt(0).toUpperCase()}
            </span>
            <span>
              {form.name === "Your name" ? "Your workspace" : form.name}
              <small>Make it your own</small>
            </span>
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="top-right">
            <span className="model-status">
              <i /> Powered by Gemini 3.5 Flash-Lite
            </span>
            <span className="linkedin-logo">in</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> YOUR NEXT CONVERSATION STARTS HERE
              </div>
              <h1>
                {page === "Create a post"
                  ? "Your ideas, worth sharing."
                  : page === "Saved drafts"
                    ? "Good ideas. Safely kept."
                    : "A spark to get you started."}
              </h1>
              <p>
                {page === "Create a post"
                  ? "Turn your moments, thoughts, and photos into a LinkedIn post that sounds like you."
                  : page === "Saved drafts"
                    ? "Pick up where you left off. Your drafts are saved in this browser."
                    : "Skip the blank page. Find a starting point and make it yours."}
              </p>
            </div>
            {page === "Create a post" && (
              <button
                className="subtle-button reset"
                onClick={() => {
                  setForm({
                    ...defaults,
                    name: form.name,
                    headline: form.headline,
                  });
                  setImages([]);
                  setPosts([]);
                  setError("");
                  notify("A fresh page, just for you.");
                }}
              >
                <RotateCcw size={15} /> Start fresh
              </button>
            )}
          </div>
          {page === "Create a post" ? (
            <div className="editor-grid">
              <section className="composer">
                <div className="section-heading">
                  <span className="step">1</span>
                  <h2>The starting point</h2>
                  <span className="section-note">
                    A little context goes a long way
                  </span>
                </div>
                <div className="field idea-field">
                  <label htmlFor="idea">
                    What would you like to share?{" "}
                    <span className="required">*</span>
                  </label>
                  <div className="textarea-box">
                    <textarea
                      id="idea"
                      value={form.idea}
                      maxLength={10000}
                      onChange={(e) => set("idea", e.target.value)}
                      placeholder={
                        "An idea that stuck with you. An event you loved. A win worth celebrating.\n\nDon’t worry about getting the words right — that’s where we come in."
                      }
                    />
                    <div className="textarea-footer">
                      <span>
                        <PenLine size={13} /> Rough thoughts welcome
                      </span>
                      <span>{form.idea.length.toLocaleString()} / 10,000</span>
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label>
                    Add a little visual context{" "}
                    <span className="optional">Optional</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    hidden
                    onChange={(e) => {
                      addImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    className={"upload-zone " + (drag ? "dragging" : "")}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      addImages(e.dataTransfer.files);
                    }}
                  >
                    <span className="upload-icon">
                      <ImagePlus size={22} />
                    </span>
                    <span>
                      <strong>
                        Drop your images here, or <em>browse files</em>
                      </strong>
                      <small>
                        JPG, PNG, or WebP · Up to 4 images · 5 MB each
                      </small>
                    </span>
                    <Plus size={19} />
                  </button>
                  {images.length > 0 && (
                    <div className="image-strip">
                      {images.map((im, i) => (
                        <div key={im.name + i}>
                          <img src={im.url} alt={im.name} />
                          <button
                            aria-label={"Remove " + im.name}
                            onClick={() =>
                              setImages((a) => a.filter((_, j) => j !== i))
                            }
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      <span>
                        AI will use your images
                        <br />
                        to enrich the story.
                      </span>
                    </div>
                  )}
                </div>
                <Select
                  label="Your perspective"
                  value={form.activity}
                  options={[
                    "Infer from my context",
                    "Attending an event",
                    "Building a project",
                    "Presenting or speaking",
                    "Organizing or hosting",
                    "Learning something new",
                    "Celebrating a milestone",
                    "Sharing a team moment",
                  ]}
                  onChange={(v) => set("activity", v)}
                />
                <p className="perspective-hint">
                  We’ll write about your experience, using images to understand
                  the context.
                </p>
                <div className="context-divider" />
                <div className="section-heading">
                  <span className="step">2</span>
                  <h2>Make it yours</h2>
                  <span className="optional">The details are optional</span>
                </div>
                <div className="two-fields">
                  <div className="field">
                    <label htmlFor="organization">Organization</label>
                    <div className="input-with-icon">
                      <Building2 size={16} />
                      <input
                        id="organization"
                        value={form.organization}
                        onChange={(e) => set("organization", e.target.value)}
                        placeholder="e.g. Acme Studio"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="event">Event or occasion</label>
                    <div className="input-with-icon">
                      <CalendarDays size={16} />
                      <input
                        id="event"
                        value={form.event}
                        onChange={(e) => set("event", e.target.value)}
                        placeholder="e.g. Design Week 2026"
                      />
                    </div>
                  </div>
                </div>
                <div className="two-fields">
                  <Select
                    label="Type of post"
                    value={form.type}
                    options={[
                      "Share an experience",
                      "Share an insight",
                      "Celebrate a milestone",
                      "Make an announcement",
                      "Promote an event",
                      "Ask a question",
                      "Tell a story",
                    ]}
                    onChange={(v) => set("type", v)}
                  />
                  <Select
                    label="Tone of voice"
                    value={form.tone}
                    options={[
                      "Authentic & conversational",
                      "Professional & polished",
                      "Warm & personal",
                      "Bold & thought-provoking",
                      "Inspiring & uplifting",
                      "Witty & playful",
                    ]}
                    onChange={(v) => set("tone", v)}
                  />
                </div>
                <div className="two-fields">
                  <Select
                    label="Post length"
                    value={form.length}
                    options={[
                      "Short · under 100 words",
                      "Medium · 150–250 words",
                      "Long · 250–400 words",
                    ]}
                    onChange={(v) => set("length", v)}
                  />
                  <Select
                    label="Language"
                    value={form.language}
                    icon={Globe}
                    options={[
                      "English",
                      "Hindi",
                      "Spanish",
                      "French",
                      "German",
                      "Portuguese",
                      "Japanese",
                      "Arabic",
                    ]}
                    onChange={(v) => set("language", v)}
                  />
                </div>
                <button
                  className="advanced-toggle"
                  onClick={() => setAdvanced(!advanced)}
                  aria-expanded={advanced}
                >
                  <SlidersHorizontal size={16} />
                  <span>More ways to make it yours</span>
                  <span className="advanced-hint">Audience, tags & more</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: advanced ? "rotate(180deg)" : undefined,
                    }}
                  />
                </button>
                {advanced && (
                  <div className="advanced-fields">
                    <Select
                      label="Who are you writing for?"
                      value={form.audience}
                      options={[
                        "My professional network",
                        "Industry peers",
                        "Potential clients",
                        "Recruiters & hiring managers",
                        "My team",
                        "Students & early-career professionals",
                      ]}
                      onChange={(v) => set("audience", v)}
                    />
                    <div className="two-fields">
                      <div className="field">
                        <label htmlFor="hashtags">Hashtags</label>
                        <div className="input-with-icon">
                          <Hash size={15} />
                          <input
                            id="hashtags"
                            value={form.hashtags}
                            placeholder="Design, Community"
                            onChange={(e) => set("hashtags", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="field">
                        <label htmlFor="mentions">People to mention</label>
                        <div className="input-with-icon">
                          <AtSign size={15} />
                          <input
                            id="mentions"
                            value={form.mentions}
                            placeholder="Names or handles"
                            onChange={(e) => set("mentions", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <Select
                      label="Call to action"
                      value={form.cta}
                      options={[
                        "Invite a conversation",
                        "Ask for feedback",
                        "Encourage sharing",
                        "Visit a link",
                        "No call to action",
                      ]}
                      onChange={(v) => set("cta", v)}
                    />
                    <div className="field">
                      <label htmlFor="extra">Anything else?</label>
                      <textarea
                        id="extra"
                        className="extra-input"
                        value={form.extra}
                        onChange={(e) => set("extra", e.target.value)}
                        placeholder="Key takeaways, links, a date, location, or words to avoid…"
                        maxLength={5000}
                      />
                    </div>
                  </div>
                )}
                <div className="preferences">
                  <button
                    className="toggle-label"
                    role="switch"
                    aria-checked={form.includeHashtags}
                    onClick={() =>
                      set("includeHashtags", !form.includeHashtags)
                    }
                  >
                    <span
                      className={"switch " + (form.includeHashtags ? "on" : "")}
                    />
                    <Hash size={14} /> Add hashtags
                  </button>
                  <button
                    className="toggle-label"
                    role="switch"
                    aria-checked={form.emojis}
                    onClick={() => set("emojis", !form.emojis)}
                  >
                    <span className={"switch " + (form.emojis ? "on" : "")} />
                    <span className="emoji">☺</span> A touch of emoji
                  </button>
                </div>
                {error && (
                  <div role="alert" className="error-message">
                    {error}
                    <button
                      onClick={() => setError("")}
                      aria-label="Dismiss error"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
                <button
                  className="generate"
                  disabled={busy}
                  onClick={() => generate()}
                >
                  {busy ? (
                    <LoaderCircle size={19} className="spin" />
                  ) : (
                    <Sparkles size={19} />
                  )}{" "}
                  {busy ? "Finding the right words…" : "Generate my post"}
                  {!busy && <ArrowRight size={18} />}
                </button>
                <div className="generate-note">
                  <span>
                    <CheckCheck size={13} /> Your voice. A little AI magic.
                  </span>
                  <span>3 variations to choose from</span>
                </div>
              </section>
              <aside className="preview-column">
                <div className="preview-heading">
                  <div>
                    <span className="live-dot" />
                    <h2>Your post, in the wild</h2>
                  </div>
                  <div className="device-switch">
                    <button
                      aria-label="Desktop preview"
                      className={!mobile ? "chosen" : ""}
                      onClick={() => setMobile(false)}
                    >
                      <Monitor size={16} />
                    </button>
                    <button
                      aria-label="Mobile preview"
                      className={mobile ? "chosen" : ""}
                      onClick={() => setMobile(true)}
                    >
                      <Smartphone size={16} />
                    </button>
                  </div>
                </div>
                <div className="preview-panel">
                  <div className="preview-tabs">
                    <div>
                      {["Preview", "Edit text"].map((t) => (
                        <button
                          key={t}
                          className={t === tab ? "selected" : ""}
                          onClick={() => setTab(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <span>
                      <span className="linkedin-tiny">in</span> LinkedIn
                    </span>
                  </div>
                  {posts.length > 0 && (
                    <div className="variations">
                      {posts.map((p, i) => (
                        <button
                          className={selected === i ? "current" : ""}
                          key={i}
                          onClick={() => setSelected(i)}
                        >
                          Option {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    className={
                      "linkedin-card " + (mobile ? "mobile-preview" : "")
                    }
                  >
                    <div className="linkedin-profile">
                      <button
                        className="preview-avatar"
                        onClick={() => setProfile(true)}
                        aria-label="Customize your profile"
                      >
                        {form.name === "Your name" ? (
                          <span className="person-icon">Y</span>
                        ) : (
                          form.name[0]
                        )}
                      </button>
                      <div>
                        <strong>
                          {form.name}{" "}
                          <span className="connection-degree">· You</span>
                        </strong>
                        <small>{form.headline}</small>
                        <small>
                          Just now <span>·</span> <Globe size={12} />
                        </small>
                      </div>
                      <MoreHorizontal size={19} />
                    </div>
                    {tab === "Edit text" ? (
                      <textarea
                        aria-label="Edit generated post"
                        className="post-editor"
                        value={post}
                        placeholder="Your generated draft will appear here. You can also write your own."
                        maxLength={3000}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPosts((a) =>
                            a.length
                              ? a.map((p, i) =>
                                  i === selected ? { ...p, text: value } : p,
                                )
                              : [{ label: "Your draft", text: value }],
                          );
                        }}
                      />
                    ) : post ? (
                      <div className="post-copy">
                        <div
                          className={
                            "post-text " +
                            (!expandedPost && post.length > 260
                              ? "post-collapsed"
                              : "")
                          }
                        >
                          {post
                            .split(
                              /((?:https?:\/\/[^\s]+)|(?:#[\p{L}\p{N}_]+)|(?:@[\p{L}\p{N}_]+))/gu,
                            )
                            .map((part, i) =>
                              /^(#|@|https?:)/.test(part) ? (
                                <span className="linkedin-highlight" key={i}>
                                  {part}
                                </span>
                              ) : (
                                <React.Fragment key={i}>{part}</React.Fragment>
                              ),
                            )}
                        </div>
                        {post.length > 260 && (
                          <button
                            className="see-more"
                            onClick={() => setExpandedPost(!expandedPost)}
                          >
                            {expandedPost ? "Show less" : "…more"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className={
                          "empty-preview " + (busy ? "is-generating" : "")
                        }
                      >
                        <div className="illustration">
                          <div className="orbit orbit-one" />
                          <div className="orbit orbit-two" />
                          <span className="illustration-dot dot-one" />
                          <span className="illustration-dot dot-two" />
                          <span className="tiny-star">✦</span>
                          <div className="paper">
                            <span className="paper-line green" />
                            <span className="paper-line" />
                            <span className="paper-line short" />
                            <div className="paper-image">
                              <Leaf size={24} />
                            </div>
                            <span className="paper-line" />
                            <span className="paper-line short" />
                          </div>
                          <div className="magic-circle">
                            {busy ? (
                              <LoaderCircle className="spin" size={20} />
                            ) : (
                              <Sparkles size={21} />
                            )}
                          </div>
                        </div>
                        <h3>
                          {busy
                            ? "A good story is taking shape…"
                            : "A great post is on its way."}
                        </h3>
                        <p>
                          {busy
                            ? "Connecting your ideas, context, and voice."
                            : "Add your ideas on the left and let’s turn them"}
                          {!busy && (
                            <>
                              <br />
                              into something worth sharing.
                            </>
                          )}
                        </p>
                        <div className="placeholder-lines">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    )}
                    {images.length > 0 && (
                      <div
                        className={
                          "preview-images images-" +
                          images.length +
                          (firstLandscape
                            ? " landscape-first"
                            : " portrait-first")
                        }
                      >
                        {images.map((im, i) => (
                          <img
                            key={im.url}
                            src={im.url}
                            alt={im.name}
                            onLoad={(e) => {
                              if (i === 0)
                                setFirstLandscape(
                                  e.currentTarget.naturalWidth /
                                    e.currentTarget.naturalHeight >
                                    4 / 3,
                                );
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="linkedin-stats">
                      <span>No reactions yet</span>
                      <span>0 comments · 0 reposts</span>
                    </div>
                    <div className="linkedin-actions">
                      <span>
                        <ThumbsUp size={17} /> Like
                      </span>
                      <span>
                        <MessageCircle size={17} /> Comment
                      </span>
                      <span>
                        <Repeat2 size={17} /> Repost
                      </span>
                      <span>
                        <Send size={16} /> Send
                      </span>
                    </div>
                  </div>
                  <div className="preview-caption">
                    <span>
                      {post.length.toLocaleString()} / 3,000 characters
                    </span>
                    <span>
                      {post ? post.trim().split(/\s+/).length : 0} words
                    </span>
                  </div>
                  <div className="draft-actions">
                    <button disabled={!post || busy} onClick={save}>
                      <Bookmark size={16} /> Save draft
                    </button>
                    <button
                      className="copy-button"
                      disabled={!post || busy}
                      onClick={copy}
                    >
                      <Copy size={16} /> Copy post
                    </button>
                  </div>
                  <button
                    className="open-linkedin"
                    disabled={!post.trim() || busy || sharing}
                    onClick={openLinkedIn}
                  >
                    <span className="linkedin-button-logo" aria-hidden="true">
                      in
                    </span>{" "}
                    {sharing
                      ? "Opening share sheet…"
                      : images.length
                        ? "Share post with images"
                        : "Open in LinkedIn"}{" "}
                    <ArrowUpRight size={16} />
                  </button>
                  <p className="linkedin-handoff-note">
                    {images.length
                      ? "Choose LinkedIn in the share sheet. On desktop, we’ll help you transfer your images."
                      : "Review your post in LinkedIn before publishing."}
                  </p>
                  {post && (
                    <div className="refine-actions">
                      <button
                        disabled={busy}
                        onClick={() =>
                          generate(
                            "Make it shorter, preserving the central insight and key facts.",
                          )
                        }
                      >
                        <Sparkles size={13} /> Make shorter
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          generate(
                            "Strengthen the opening hook. Keep the facts accurate.",
                          )
                        }
                      >
                        <RotateCcw size={13} /> Better hook
                      </button>
                      <button onClick={download} aria-label="Download post">
                        <Download size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="tip-card">
                  <span>
                    <Lightbulb size={19} />
                  </span>
                  <div>
                    <h4>A little tip for a better post</h4>
                    <p>
                      The best posts sound like a conversation, not a press
                      release. Add a personal takeaway — it makes all the
                      difference.
                    </p>
                  </div>
                </div>
                <div className="privacy-note">
                  <span className="mini-leaf">
                    <Leaf size={14} />
                  </span>{" "}
                  A thoughtful post starts with your perspective.
                </div>
              </aside>
            </div>
          ) : page === "Templates" ? (
            <div className="template-grid">
              {templates.map((t) => (
                <button
                  className="template-card"
                  key={t.name}
                  onClick={() => loadTemplate(t)}
                >
                  <span className="template-icon">
                    <t.icon size={25} />
                  </span>
                  <small>{t.tag}</small>
                  <h2>{t.name}</h2>
                  <p>{t.text}</p>
                  <span className="use-template">
                    Make it yours <ArrowUpRight size={17} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="saved-grid">
              {saved.length ? (
                saved.map((d) => (
                  <article className="saved-card" key={d.id}>
                    <div>
                      <span>
                        {new Date(d.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        aria-label="Delete draft"
                        onClick={() => {
                          const next = saved.filter((x) => x.id !== d.id);
                          localStorage.setItem(
                            "postly-drafts",
                            JSON.stringify(next),
                          );
                          setSaved(next);
                          notify("Draft deleted.");
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p>{d.text}</p>
                    <button
                      className="subtle-button"
                      onClick={() => {
                        setForm({ ...defaults, ...d.form });
                        setPosts([{ label: "Saved draft", text: d.text }]);
                        setSelected(0);
                        setImages([]);
                        setPage("Create a post");
                      }}
                    >
                      Open draft <ArrowRight size={15} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-library">
                  <Bookmark size={35} />
                  <h2>A home for your next great posts.</h2>
                  <p>
                    Save a draft from the editor and it will be waiting here.
                  </p>
                  <button
                    className="generate"
                    onClick={() => setPage("Create a post")}
                  >
                    Create your first post <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </div>
          )}
          <footer>
            <span>Made for your authentic voice.</span>
            <span>
              Thoughtfully powered by AI <Sparkles size={12} />
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {handoff && (
        <div
          className="modal-backdrop"
          onClick={() => setHandoff(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setHandoff(false);
          }}
        >
          <section
            className="profile-modal image-handoff"
            role="dialog"
            aria-modal="true"
            aria-labelledby="handoff-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              autoFocus
              onClick={() => setHandoff(false)}
              aria-label="Close image sharing"
            >
              <X size={19} />
            </button>
            <span className="template-icon">
              <ImagePlus size={23} />
            </span>
            <h2 id="handoff-title">Take your whole story with you.</h2>
            <p>
              This browser can’t send files to LinkedIn directly. Your images
              are ready below.
            </p>
            <ol className="handoff-steps">
              <li>Download your images, or use the original files.</li>
              <li>
                Open LinkedIn below. Your post text is passed along and copied
                as a backup.
              </li>
              <li>
                Drop the images into LinkedIn’s composer, then review and post.
              </li>
            </ol>
            <div className="handoff-images">
              {images.map((image, i) => (
                <a
                  key={i}
                  href={image.url}
                  download={image.name}
                  className="handoff-file"
                >
                  <img src={image.url} alt={image.name} />
                  <span>{image.name}</span>
                  <Download size={17} />
                </a>
              ))}
            </div>
            <button className="generate" onClick={openLinkedInText}>
              Open LinkedIn & copy text <ArrowUpRight size={17} />
            </button>
            <button className="handoff-copy" onClick={copy}>
              <Copy size={14} /> Copy post text again
            </button>
            <p className="handoff-footnote">
              Images are not attached automatically in this desktop flow.
            </p>
          </section>
        </div>
      )}
      {profile && (
        <div className="modal-backdrop" onClick={() => setProfile(false)}>
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setProfile(false)}
              aria-label="Close profile"
            >
              <X size={19} />
            </button>
            <span className="template-icon">
              <PenLine size={23} />
            </span>
            <h2 id="profile-title">Make yourself at home.</h2>
            <p>Personalize the profile in your post preview.</p>
            <div className="field">
              <label htmlFor="profile-name">Your name</label>
              <input
                id="profile-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="field">
              <label htmlFor="headline">LinkedIn headline</label>
              <input
                id="headline"
                value={form.headline}
                onChange={(e) => set("headline", e.target.value)}
                maxLength={160}
              />
            </div>
            <button
              className="generate"
              onClick={() => {
                setProfile(false);
                notify("Your profile is updated.");
              }}
            >
              Save profile <Check size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
