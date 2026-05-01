import { useEffect, useRef, useState } from "react";
import { cognitoGetAccessToken } from "../services/cognitoAuth";
import { useAdminAuth } from "../hooks/useAdminAuth";
import defaultPersonImage from "../../../assets/defaults/about-image.svg";
import defaultHeroImage   from "../../../assets/defaults/hero-banner.svg";

const S3_BASE    = (import.meta.env.VITE_S3_BASE_URL       as string).replace(/\/$/, "");
const LAMBDA_URL = (import.meta.env.VITE_UPLOAD_LAMBDA_URL as string).replace(/\/$/, "");

type StarEntry    = { name: string; course: string; exam: string; highlight: string };
type FacultyEntry = { name: string; sub: string; points: string[]; highlight: string; highlightLabel: string };
type Content      = { notice: string; heroCount: number; stars: StarEntry[]; faculty: FacultyEntry[] };
type SizeSpec     = { maxPx: number; suffix: number; maxKB?: number };

const HERO_SPECS:    SizeSpec[] = [{ maxPx: 480, suffix: 480, maxKB: 300 }, { maxPx: 768, suffix: 768, maxKB: 300 }, { maxPx: 1200, suffix: 1200, maxKB: 300 }, { maxPx: 1600, suffix: 1600, maxKB: 300 }];
const STAR_SPECS:    SizeSpec[] = [{ maxPx: 240, suffix: 240, maxKB: 50 }, { maxPx: 480, suffix: 480, maxKB: 50 }];
const FACULTY_SPECS: SizeSpec[] = [{ maxPx: 300, suffix: 300, maxKB: 50 }, { maxPx: 600, suffix: 600, maxKB: 50 }];

const BLANK_STAR:    StarEntry    = { name: "", course: "", exam: "", highlight: "" };
const BLANK_FACULTY: FacultyEntry = { name: "", sub: "", points: ["", "", ""], highlight: "", highlightLabel: "" };

// ── Image helpers ─────────────────────────────────────────────────────────────

async function resizeTo(img: HTMLImageElement, maxPx: number, quality: number): Promise<string> {
  const scale  = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const w      = Math.round(img.naturalWidth  * scale);
  const h      = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width  = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/webp", quality).split(",")[1];
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

async function compressToLimit(img: HTMLImageElement, maxPx: number, maxKB: number): Promise<string> {
  for (const q of [0.85, 0.75, 0.65, 0.5, 0.4]) {
    const data = await resizeTo(img, maxPx, q);
    if (data.length <= maxKB * 1024 * 1.37) return data;
  }
  return resizeTo(img, maxPx, 0.4);
}

class AuthExpiredError extends Error {}

async function lambdaPost(body: object) {
  const token = await cognitoGetAccessToken();
  const res = await fetch(LAMBDA_URL, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (res.status === 401) throw new AuthExpiredError("Session expired");
  if (!res.ok) throw new Error(await res.text());
}

async function uploadAllSizes(file: File, baseKey: string, specs: SizeSpec[]) {
  const img = await loadImage(file);
  await Promise.all(specs.map(async ({ maxPx, suffix, maxKB }) => {
    const data = maxKB
      ? await compressToLimit(img, maxPx, maxKB)
      : await resizeTo(img, maxPx, 0.85);
    await lambdaPost({ type: "image", key: `${baseKey}-${suffix}.webp`, data, contentType: "image/webp" });
  }));
}

function imgFallback(fallback: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src     = fallback;
    e.currentTarget.onerror = null;
  };
}

// ── Image slot ────────────────────────────────────────────────────────────────

function ImageSlot({
  baseKey,
  specs,
  previewSuffix,
  fallback,
  wrapClass = "",
}: {
  baseKey:       string;
  specs:         SizeSpec[];
  previewSuffix: number;
  fallback:      string;
  wrapClass?:    string;
}) {
  const [ver,       setVer]       = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      await uploadAllSizes(file, baseKey, specs);
      setVer((v) => v + 1);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`lp-editor-img-slot ${wrapClass}`}>
      <img
        key={ver}
        src={`${S3_BASE}/${baseKey}-${previewSuffix}.webp?v=${ver}`}
        alt=""
        onError={imgFallback(fallback)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/webp"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        className="lp-editor-upload-btn"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading…" : "📷 Upload"}
      </button>
    </div>
  );
}

// ── Inline field ──────────────────────────────────────────────────────────────

function Field({
  value, onChange, placeholder, maxLength, className = "", multiline = false,
}: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  maxLength:   number;
  className?:  string;
  multiline?:  boolean;
}) {
  const [focused, setFocused] = useState(false);
  const cls  = `lp-editor-field ${className}`;
  const near = value.length >= maxLength * 0.85;
  const shared = {
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
  };
  return (
    <div className="lp-editor-field-wrap">
      {multiline ? (
        <textarea className={cls} value={value} maxLength={maxLength} placeholder={placeholder} rows={2} onChange={(e) => onChange(e.target.value)} {...shared} />
      ) : (
        <input className={cls} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} {...shared} />
      )}
      {focused && (
        <span className={`lp-editor-field-count${near ? " lp-editor-field-count--near" : ""}`}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomepageEditorPage() {
  const { signOut, setSignOutGuard } = useAdminAuth();
  const [content,    setContent]     = useState<Content>({ notice: "", heroCount: 3, stars: [], faculty: [] });
  const [saving,     setSaving]      = useState(false);
  const [saveStatus, setSaveStatus]  = useState<"idle" | "saved" | "error">("idle");
  const [hasUnsaved, setHasUnsaved]  = useState(false);

  const contentLoaded = useRef(false);

  useEffect(() => {
    fetch(`${S3_BASE}/content.json?_=${Date.now()}`)
      .then((r) => r.json())
      .then((d: Content) => {
        const normalized: Content = {
          ...d,
          faculty: (d.faculty ?? []).map((f) => ({
            ...f,
            points: [f.points?.[0] ?? "", f.points?.[1] ?? "", f.points?.[2] ?? ""],
          })),
        };
        setContent(normalized);
        contentLoaded.current = true;
      })
      .catch(() => { contentLoaded.current = true; });
  }, []);

  // ── Mark unsaved on any content change after initial load ─────────────────
  useEffect(() => {
    if (!contentLoaded.current) return;
    setHasUnsaved(true);
    setSaveStatus("idle");
  }, [content]);

  // ── Warn before browser unload/refresh if unsaved ─────────────────────────
  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  // ── Register sign-out guard while on this page ────────────────────────────
  useEffect(() => {
    setSignOutGuard(() => {
      if (!hasUnsaved) return true;
      return window.confirm("You have unsaved changes. Sign out anyway? Changes will be lost.");
    });
    return () => setSignOutGuard(null);
  }, [hasUnsaved, setSignOutGuard]);

  const saveContent = async (c: Content) => {
    setSaving(true);
    try {
      await lambdaPost({ type: "content", content: c });
      setHasUnsaved(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        alert("Your session has expired. You will be signed out.");
        signOut();
        return;
      }
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // ── Star helpers ──────────────────────────────────────────────────────────

  const updateStar = (i: number, key: keyof StarEntry, val: string) =>
    setContent((c) => ({ ...c, stars: c.stars.map((s, idx) => idx === i ? { ...s, [key]: val } : s) }));

  const addStar = () => {
    if (content.stars.length >= 10) return;
    setContent((c) => ({ ...c, stars: [...c.stars, { ...BLANK_STAR }] }));
  };

  const removeStar = (i: number) => {
    if (!window.confirm("Remove this star? Any unsaved changes will also be lost if you haven't saved.")) return;
    setContent((c) => ({ ...c, stars: c.stars.filter((_, idx) => idx !== i) }));
  };

  // ── Faculty helpers ───────────────────────────────────────────────────────

  const updateFaculty = (i: number, key: keyof Omit<FacultyEntry, "points">, val: string) =>
    setContent((c) => ({ ...c, faculty: c.faculty.map((f, idx) => idx === i ? { ...f, [key]: val } : f) }));

  const updatePoint = (i: number, pi: number, val: string) =>
    setContent((c) => ({
      ...c,
      faculty: c.faculty.map((f, idx) =>
        idx === i ? { ...f, points: f.points.map((p, j) => j === pi ? val : p) } : f
      ),
    }));

  const addFaculty = () => {
    if (content.faculty.length >= 5) return;
    setContent((c) => ({ ...c, faculty: [...c.faculty, { ...BLANK_FACULTY, points: ["", "", ""] }] }));
  };

  const removeFaculty = (i: number) => {
    if (!window.confirm("Remove this faculty member? Any unsaved changes will also be lost if you haven't saved.")) return;
    setContent((c) => ({ ...c, faculty: c.faculty.filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="lp-editor-page">

      {/* ── Save bar ── */}
      <div className="lp-editor-save-bar">
        <span className="lp-editor-save-bar-title">Homepage Editor</span>
        <div className="lp-editor-save-bar-right">
          {hasUnsaved  && !saving && <span className="lp-editor-status lp-editor-status--pending">Unsaved changes</span>}
          {saveStatus === "saved"  && !hasUnsaved && <span className="lp-editor-status lp-editor-status--ok">Saved ✓</span>}
          {saveStatus === "error"  && <span className="lp-editor-status lp-editor-status--err">Save failed</span>}
          <button type="button" className="lp-editor-save-btn" onClick={() => saveContent(content)} disabled={saving || !hasUnsaved}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Editable content (overlay targets this on small screens) ── */}
      <div className="lp-editor-content">

        {/* ── Screen-too-small overlay ── */}
        <div className="lp-editor-small-screen-overlay">
          <span>🖥️</span>
          <p>Screen too small to edit</p>
          <p>Please use a wider screen (1000px+).</p>
        </div>

      {/* ── Notice ── */}
      <section className="lp-editor-section">
        <div className="lp-editor-section-head">
          <h2>Notice strip</h2>
          <span className="lp-editor-char-hint">{content.notice.length}/150</span>
        </div>
        <div className="lp-notice-strip lp-editor-notice-preview">
          <input
            className="lp-editor-notice-input"
            value={content.notice}
            maxLength={150}
            placeholder="e.g. 🎉 ASAT starts 03rd May • Win up to 90% scholarship"
            onChange={(e) => setContent((c) => ({ ...c, notice: e.target.value }))}
          />
        </div>
      </section>

      {/* ── Hero ── */}
      <section className="lp-editor-section">
        <div className="lp-editor-section-head">
          <h2>Hero carousel</h2>
          <label className="lp-editor-hero-count-label">
            Visible slides
            <select value={content.heroCount} onChange={(e) => setContent((c) => ({ ...c, heroCount: Number(e.target.value) }))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="lp-editor-hero-grid">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`lp-editor-hero-slot${i >= content.heroCount ? " lp-editor-hero-slot--dim" : ""}`}>
              <span className="lp-editor-slot-label">
                Slide {i + 1}{i >= content.heroCount ? " · hidden" : ""}
              </span>
              <ImageSlot
                baseKey={`images/hero_${i + 1}`}
                specs={HERO_SPECS}
                previewSuffix={768}
                fallback={defaultHeroImage}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Stars ── */}
      <section className="lp-editor-section">
        <div className="lp-editor-section-head">
          <h2>Stars <span className="lp-editor-badge">{content.stars.length}/10</span></h2>
          {content.stars.length < 10 && (
            <button type="button" className="lp-editor-add-btn" onClick={addStar}>+ Add star</button>
          )}
        </div>
        <div className="lp-editor-cards-wrap">
          {content.stars.map((s, i) => (
            <article key={i} className="lp-stars-card lp-editor-card">
              <button type="button" className="lp-editor-remove-btn" onClick={() => removeStar(i)} aria-label="Remove">×</button>
              <ImageSlot baseKey={`images/star_${i + 1}`} specs={STAR_SPECS} previewSuffix={480} fallback={defaultPersonImage} wrapClass="lp-stars-img-wrap" />
              <div className="lp-stars-body">
                <Field value={s.name}      onChange={(v) => updateStar(i, "name",      v)} placeholder="Name"            maxLength={35} className="lp-editor-field--h4" />
                <Field value={s.course}    onChange={(v) => updateStar(i, "course",    v)} placeholder="Course"          maxLength={25} />
                <Field value={s.exam}      onChange={(v) => updateStar(i, "exam",      v)} placeholder="Exam"            maxLength={25} />
                <Field value={s.highlight} onChange={(v) => updateStar(i, "highlight", v)} placeholder="Result (AIR 74)" maxLength={12} className="lp-editor-field--highlight" />
              </div>
            </article>
          ))}
          {content.stars.length === 0 && <p className="lp-editor-empty">No stars yet. Click "+ Add star" to add one.</p>}
        </div>
      </section>

      {/* ── Faculty ── */}
      <section className="lp-editor-section">
        <div className="lp-editor-section-head">
          <h2>Faculty <span className="lp-editor-badge">{content.faculty.length}/5</span></h2>
          {content.faculty.length < 5 && (
            <button type="button" className="lp-editor-add-btn" onClick={addFaculty}>+ Add faculty</button>
          )}
        </div>
        <div className="lp-editor-cards-wrap">
          {content.faculty.map((f, i) => (
            <article key={i} className="lp-faculty-card lp-editor-card">
              <button type="button" className="lp-editor-remove-btn" onClick={() => removeFaculty(i)} aria-label="Remove">×</button>
              <ImageSlot baseKey={`images/faculty_${i + 1}`} specs={FACULTY_SPECS} previewSuffix={600} fallback={defaultPersonImage} wrapClass="lp-faculty-img-wrap" />
              <div className="lp-faculty-name-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <Field value={f.name} onChange={(v) => updateFaculty(i, "name", v)} placeholder="Faculty name"           maxLength={40 - f.sub.length}  className="lp-editor-field--h4" />
                <Field value={f.sub}  onChange={(v) => updateFaculty(i, "sub",  v)} placeholder="e.g. 15+ Yrs Experience" maxLength={40 - f.name.length} />
              </div>
              <div className="lp-faculty-bottom">
                <ul className="lp-faculty-points" style={{ flex: "4 1 0" }}>
                  {(f.points.length ? f.points : ["", "", ""]).map((p, pi) => (
                    <li key={pi}>
                      <Field value={p} onChange={(v) => updatePoint(i, pi, v)} placeholder={`Point ${pi + 1}`} maxLength={55} />
                    </li>
                  ))}
                </ul>
                <div className="lp-faculty-badge-wrap lp-faculty-badge-wrap--bottom" style={{ flexDirection: "column", gap: 4, flex: "1 1 0" }}>
                  <Field value={f.highlight}      onChange={(v) => updateFaculty(i, "highlight",      v)} placeholder="500+"        maxLength={10} className="lp-editor-field--badge" />
                  <Field value={f.highlightLabel} onChange={(v) => updateFaculty(i, "highlightLabel", v)} placeholder="Selections" maxLength={10} className="lp-editor-field--badge" />
                </div>
              </div>
            </article>
          ))}
          {content.faculty.length === 0 && <p className="lp-editor-empty">No faculty yet. Click "+ Add faculty" to add one.</p>}
        </div>
      </section>

      </div>{/* end lp-editor-content */}
    </div>
  );
}
