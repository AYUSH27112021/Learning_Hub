import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import defaultHeroImage   from "../../../assets/defaults/hero-banner.svg";
import defaultPersonImage from "../../../assets/defaults/about-image.svg";
import phoneIcon          from "../../../assets/defaults/phone.svg";
import websiteLogo        from "../../../assets/defaults/website_logo.png";
import { submitCallback } from "../services/callbackService";

const S3_BASE = (import.meta.env.VITE_S3_BASE_URL as string).replace(/\/$/, "");

type StarEntry    = { name: string; course: string; exam: string; highlight: string };
type FacultyEntry = { name: string; sub: string; points: string[]; highlight: string; highlightLabel: string };
type Content      = { notice: string; heroCount?: number; stars: StarEntry[]; faculty: FacultyEntry[] };

const DEFAULT_CONTENT: Content = { notice: "", heroCount: 3, stars: [], faculty: [] };

const MARQUEE_ROW1 = [
  { label: "Live Classes", emoji: "🎥" },
  { label: "24×7 Doubt Solving", emoji: "💬" },
  { label: "Mock Tests", emoji: "📝" },
  { label: "Flashcards", emoji: "🃏" },
  { label: "Career Guidance", emoji: "🧭" },
];

const MARQUEE_ROW2 = [
  { label: "Revision Notes", emoji: "📋" },
  { label: "PYQ Tests", emoji: "📚" },
  { label: "Mentorship", emoji: "🎓" },
  { label: "Improvement Book", emoji: "📖" },
  { label: "PYQ Practice", emoji: "✏️" },
  { label: "Meditation Session", emoji: "🧘" },
];

const MARQUEE_ROW3 = [
  { label: "Topic-wise Videos", emoji: "🎬" },
  { label: "Subjective Tests", emoji: "📄" },
  { label: "Important Questions", emoji: "❓" },
  { label: "Topic-wise Tests", emoji: "📊" },
  { label: "Regular Homework", emoji: "🏠" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown]             = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen]     = useState(false);
  const [activeBanner, setActiveBanner]             = useState(0);
  const [autoResetKey, setAutoResetKey]             = useState(0);
  const [touchStartX, setTouchStartX]               = useState<number | null>(null);
  const [cbName, setCbName]       = useState("");
  const [cbPhone, setCbPhone]     = useState("");
  const [cbStatus, setCbStatus]   = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [content, setContent]                       = useState<Content>(DEFAULT_CONTENT);
  const [starsFilter, setStarsFilter]               = useState<"all" | "competitive" | "classes">("all");

  const heroImageSize = useRef(
    window.innerWidth <= 480 ? 480 : window.innerWidth <= 768 ? 768 : window.innerWidth <= 1200 ? 1200 : 1600
  );
  const personImageSize = useRef(window.innerWidth <= 480 ? 240 : 480);

  const wheelGestureActiveRef       = useRef(false);
  const wheelGestureResetTimerRef   = useRef<number | null>(null);
  const heroCardRef                 = useRef<HTMLDivElement | null>(null);
  const starsTrackRef               = useRef<HTMLDivElement | null>(null);
  const starsAutoScrollFrameRef     = useRef<number | null>(null);
  const starsResumeTimerRef         = useRef<number | null>(null);
  const starsTouchActiveRef         = useRef(false);

  const heroCount     = Math.min(Math.max(content.heroCount ?? 3, 1), 5);
  const BANNER_IMAGES = Array.from({ length: heroCount }, (_, i) => `${S3_BASE}/images/hero_${i + 1}.png`);
  const isCbse = (s: StarEntry) => [s.course, s.exam, s.highlight].some(v => v?.toLowerCase().includes("cbse"));
  const filteredStars = starsFilter === "all" ? content.stars : content.stars.filter(s => starsFilter === "classes" ? isCbse(s) : !isCbse(s));
  const LOOPED_STARS  = filteredStars.length ? [...filteredStars, ...filteredStars] : [];

  type NavItem =
    | { label: string; items: string[]; columns?: never; path?: never; hash?: string }
    | { label: string; columns: { left: { title: string; desc: string }[]; right: { title: string; desc: string }[] }; items?: never; path?: never; hash?: string }
    | { label: string; path?: string; hash?: string; items?: never; columns?: never };

  const NAV_ITEMS: NavItem[] = [
    { label: "Programs", items: ["Syllabus: CBSE & ICSE", "Class VI", "Class VII", "Class VIII", "Class IX", "Class X", "Class XI", "Class XII", "Class XII Pass"] },
    { label: "Target Exams", columns: {
        left: [
          { title: "JEE MAIN",     desc: "Build strong problem-solving skills and secure admission to top engineering colleges across India." },
          { title: "JEE ADVANCED", desc: "Prepare deeply for conceptual and challenging questions needed for IIT admissions." },
        ],
        right: [
          { title: "KVPY",      desc: "Develop scientific aptitude early with focused preparation for competitive fellowship-level exams." },
          { title: "NTSE",      desc: "Strengthen school fundamentals with guided practice for national-level scholarship selection." },
          { title: "OLYMPIADS", desc: "Master advanced topics through rigorous training for national and international olympiad stages." },
        ],
      }
    },
    { label: "Results",            hash: "results" },
    { label: "Why Learning Hub",   path: "/why-learning-hub" },
    { label: "About Us",           path: "/about-us" },
  ];

  // ── Fetch content.json from S3 ────────────────────────────────────────────
  useEffect(() => {
    fetch(`${S3_BASE}/content.json?_=${Date.now()}`)
      .then((r) => r.json())
      .then((data: Content) => setContent(data))
      .catch(() => {});
  }, []);

  // ── Reset activeBanner if heroCount shrinks ───────────────────────────────
  useEffect(() => {
    setActiveBanner((prev) => Math.min(prev, BANNER_IMAGES.length - 1));
  }, [BANNER_IMAGES.length]);

  // ── Preload hero images (size fixed at page load, never changes on resize) ──
  useEffect(() => {
    for (let i = 1; i <= heroCount; i++) {
      const img = new Image();
      img.src = `${S3_BASE}/images/hero_${i}-${heroImageSize.current}.webp`;
    }
  }, [heroCount]);

  // ── Hero auto-advance ─────────────────────────────────────────────────────
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveBanner((prev) => (prev >= BANNER_IMAGES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [BANNER_IMAGES.length, autoResetKey]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (wheelGestureResetTimerRef.current)  window.clearTimeout(wheelGestureResetTimerRef.current);
      if (starsAutoScrollFrameRef.current)    window.cancelAnimationFrame(starsAutoScrollFrameRef.current);
      if (starsResumeTimerRef.current)        window.clearTimeout(starsResumeTimerRef.current);
    };
  }, []);

  // ── Stars auto-scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    const track = starsTrackRef.current;
    if (!track) return;
    const tick = () => {
      if (!starsTouchActiveRef.current) {
        track.scrollLeft += 0.35;
        const halfWidth = track.scrollWidth / 2;
        if (track.scrollLeft >= halfWidth) track.scrollLeft -= halfWidth;
      }
      starsAutoScrollFrameRef.current = window.requestAnimationFrame(tick);
    };
    starsAutoScrollFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (starsAutoScrollFrameRef.current) {
        window.cancelAnimationFrame(starsAutoScrollFrameRef.current);
        starsAutoScrollFrameRef.current = null;
      }
    };
  }, []);

  // ── Hero card wheel gesture (non-passive so preventDefault works) ─────────
  const wheelHandlerRef = useRef<((e: WheelEvent) => void) | null>(null);
  wheelHandlerRef.current = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 6) return;
    e.preventDefault();
    if (wheelGestureResetTimerRef.current) window.clearTimeout(wheelGestureResetTimerRef.current);
    wheelGestureResetTimerRef.current = window.setTimeout(() => { wheelGestureActiveRef.current = false; }, 320);
    if (wheelGestureActiveRef.current) return;
    wheelGestureActiveRef.current = true;
    if (e.deltaX > 0) showNextBanner();
    if (e.deltaX < 0) showPrevBanner();
  };

  useEffect(() => {
    const el = heroCardRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => wheelHandlerRef.current?.(e);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ── Hash scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.location.hash !== "#results") return;
    const id = window.setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const scrollToSection = (elementId: string) =>
    document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const resetAutoAdvance = () => setAutoResetKey((k) => k + 1);

  const showNextBanner = () => {
    setActiveBanner((prev) => (prev >= BANNER_IMAGES.length - 1 ? 0 : prev + 1));
    resetAutoAdvance();
  };

  const showPrevBanner = () => {
    setActiveBanner((prev) => (prev <= 0 ? BANNER_IMAGES.length - 1 : prev - 1));
    resetAutoAdvance();
  };

  const imgFallback = (fallback: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallback;
    e.currentTarget.onerror = null;
  };

  return (
    <div className="lp-wrapper">

      {/* ── Sticky Header ── */}
      <header className="lp-header">
        <div className="lp-brand-bar">
          <div className="lp-brand-inner">
            <button
              type="button"
              className="lp-mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span /><span /><span />
            </button>

            <Link to="/">
              <img src={websiteLogo} alt="Learning Hub logo" className="lp-brand-logo" />
            </Link>

            <div className="lp-brand-right">
              <div className="lp-brand-top-row">
                <span className="lp-brand-phone" aria-label="Phone">
                  <img src={phoneIcon} alt="" className="lp-brand-phone-icon" />
                </span>
                <Link to="/register" className="lp-register-btn lp-register-btn--header">Register Now</Link>
              </div>

              <nav className="lp-brand-nav">
                {NAV_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="lp-brand-nav-wrap"
                    onMouseEnter={() => { if (item.items || item.columns) setOpenDropdown(item.label); }}
                    onMouseLeave={() => { if (item.items || item.columns) setOpenDropdown(null); }}
                  >
                    <button
                      className="lp-brand-nav-item"
                      onClick={() => {
                        if (item.hash) { scrollToSection(item.hash); setOpenDropdown(null); return; }
                        if (!item.items && !item.columns && item.path) { navigate(item.path); setOpenDropdown(null); return; }
                        setOpenDropdown(openDropdown === item.label ? null : item.label);
                      }}
                    >
                      {item.label} {(item.items || item.columns) && <span className="lp-brand-nav-arrow" />}
                    </button>
                    {openDropdown === item.label && item.items && (
                      <div className="lp-dropdown">
                        {item.items.map((sub) => <div key={sub} className="lp-dropdown-item">{sub}</div>)}
                      </div>
                    )}
                    {openDropdown === item.label && item.columns && (
                      <div className="lp-dropdown lp-dropdown--columns">
                        <div className="lp-dropdown-col">
                          {item.columns.left.map((e) => (
                            <div key={e.title} className="lp-dropdown-exam">
                              <div className="lp-dropdown-exam-title">{e.title}</div>
                              <div className="lp-dropdown-exam-desc">{e.desc}</div>
                            </div>
                          ))}
                        </div>
                        <div className="lp-dropdown-col">
                          {item.columns.right.map((e) => (
                            <div key={e.title} className="lp-dropdown-exam">
                              <div className="lp-dropdown-exam-title">{e.title}</div>
                              <div className="lp-dropdown-exam-desc">{e.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div
          className={`lp-mobile-menu-backdrop ${isMobileMenuOpen ? "lp-mobile-menu-backdrop--open" : ""}`}
          onClick={() => { setIsMobileMenuOpen(false); setMobileOpenDropdown(null); }}
        />
        <aside className={`lp-mobile-menu-drawer ${isMobileMenuOpen ? "lp-mobile-menu-drawer--open" : ""}`}>
          <div className="lp-mobile-menu-head">
            <span>Menu</span>
            <button type="button" aria-label="Close menu" onClick={() => { setIsMobileMenuOpen(false); setMobileOpenDropdown(null); }}>×</button>
          </div>
          <nav className="lp-mobile-menu-nav">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="lp-mobile-menu-item">
                <button
                  type="button"
                  className="lp-mobile-menu-main"
                  onClick={() => {
                    if (item.hash) { scrollToSection(item.hash); setIsMobileMenuOpen(false); setMobileOpenDropdown(null); return; }
                    if (!item.items && !item.columns && item.path) { navigate(item.path); setIsMobileMenuOpen(false); setMobileOpenDropdown(null); return; }
                    setMobileOpenDropdown((prev) => (prev === item.label ? null : item.label));
                  }}
                >
                  <span>{item.label}</span>
                  {(item.items || item.columns) && <span className="lp-mobile-menu-chevron">▾</span>}
                </button>
                {mobileOpenDropdown === item.label && item.items && (
                  <div className="lp-mobile-sub-list">
                    {item.items.map((sub) => <div key={sub} className="lp-mobile-sub-item">{sub}</div>)}
                  </div>
                )}
                {mobileOpenDropdown === item.label && item.columns && (
                  <div className="lp-mobile-sub-list">
                    {[...item.columns.left, ...item.columns.right].map((exam) => (
                      <div key={exam.title} className="lp-mobile-sub-item">
                        <strong>{exam.title}</strong>
                        <span>{exam.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>
      </header>

      <main className="lp-home-main">

        {/* ── Notice strip ── */}
        {content.notice && (
          <section className="lp-notice-strip">
            <div className="lp-notice-strip-inner">{content.notice}</div>
          </section>
        )}

        {/* ── Hero carousel ── */}
        <section className="lp-home-hero-wrap">
          <div
            ref={heroCardRef}
            className="lp-home-hero-card"
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const deltaX = e.changedTouches[0].clientX - touchStartX;
              if (deltaX < -40) showNextBanner();
              if (deltaX > 40) showPrevBanner();
              setTouchStartX(null);
            }}
          >
            <img
              key={activeBanner}
              src={`${S3_BASE}/images/hero_${activeBanner + 1}-${heroImageSize.current}.webp`}
              alt="Hero banner"
              loading="eager"
              onError={imgFallback(defaultHeroImage)}
            />
          </div>
          <div className="lp-home-dots" aria-label="carousel indicators">
            {BANNER_IMAGES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`lp-home-dot ${activeBanner === idx ? "lp-home-dot--active" : ""}`}
                onClick={() => { setActiveBanner(idx); resetAutoAdvance(); }}
                aria-label={`Show banner ${idx + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ── Stars ── */}
        {content.stars.length > 0 && (
          <section id="results" className="lp-stars-section">
            <div className="lp-stars-head">
              <h3>Top Performers ✨</h3>
              <div className="lp-stars-filters">
                <button type="button" className={`lp-stars-chip${starsFilter === "all" ? " lp-stars-chip--active" : ""}`} onClick={() => setStarsFilter("all")}>ALL</button>
                <button type="button" className={`lp-stars-chip${starsFilter === "classes" ? " lp-stars-chip--active" : ""}`} onClick={() => setStarsFilter("classes")}>Classes 6-10</button>
                <button type="button" className={`lp-stars-chip${starsFilter === "competitive" ? " lp-stars-chip--active" : ""}`} onClick={() => setStarsFilter("competitive")}>Competitive Exam</button>
              </div>
            </div>
            <div
              ref={starsTrackRef}
              className="lp-stars-track"
              onTouchStart={() => {
                starsTouchActiveRef.current = true;
                if (starsResumeTimerRef.current) window.clearTimeout(starsResumeTimerRef.current);
              }}
              onTouchEnd={() => {
                if (starsResumeTimerRef.current) window.clearTimeout(starsResumeTimerRef.current);
                starsResumeTimerRef.current = window.setTimeout(() => { starsTouchActiveRef.current = false; }, 1200);
              }}
              onTouchCancel={() => { starsTouchActiveRef.current = false; }}
            >
              {LOOPED_STARS.map((s, idx) => (
                <article key={`${s.name}-${idx}`} className="lp-stars-card">
                  <div className="lp-stars-img-wrap">
                    <img
                      src={`${S3_BASE}/images/star_${(idx % filteredStars.length) + 1}-${personImageSize.current}.webp`}
                      alt={s.name}
                      loading="lazy"
                      onError={imgFallback(defaultPersonImage)}
                    />
                  </div>
                  <div className="lp-stars-body">
                    <h4>{s.name}</h4>
                    <p>{s.course}</p>
                    <p>{s.exam}</p>
                    <span>{s.highlight}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── Faculty ── */}
        {content.faculty.length > 0 && (
          <section className="lp-faculty-section">
            <h2>Meet Our Faculty</h2>
            <div className="lp-faculty-grid">
              {content.faculty.map((f, idx) => (
                <article key={f.name + idx} className="lp-faculty-card">
                  <div className="lp-faculty-img-wrap">
                    <img
                      src={`${S3_BASE}/images/faculty_${idx + 1}-${personImageSize.current === 240 ? 300 : 600}.webp`}
                      alt={f.name}
                      loading="lazy"
                      onError={imgFallback(defaultPersonImage)}
                    />
                  </div>
                  <div className="lp-faculty-name-row">
                    <span className="lp-faculty-name">{f.name}</span>
                    <span className="lp-faculty-exp"> · {f.sub}</span>
                    <div className="lp-faculty-badge-wrap lp-faculty-badge-wrap--inline">
                      <span className="lp-faculty-badge">{f.highlight}</span>
                      <span className="lp-faculty-badge-label">{f.highlightLabel}</span>
                    </div>
                  </div>
                  <div className="lp-faculty-bottom">
                    <ul className="lp-faculty-points">
                      {(f.points ?? []).filter(Boolean).map((p) => <li key={p}>{p}</li>)}
                    </ul>
                    <div className="lp-faculty-badge-wrap lp-faculty-badge-wrap--bottom">
                      <span className="lp-faculty-badge">{f.highlight}</span>
                      <span className="lp-faculty-badge-label">{f.highlightLabel}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ── YouTube banner ── */}
      <section className="lp-app-banner">
        <div className="lp-app-banner-inner">
          <div className="lp-app-banner-left">
            <p className="lp-app-banner-eyebrow">Stay connected</p>
            <h2 className="lp-app-banner-title">
              Learn more about <span className="lp-app-banner-title--accent">Learning Hub</span>
            </h2>
            <p className="lp-app-banner-sub">Free lectures, tips & exam strategies — all on YouTube.</p>
          </div>
          <div className="lp-app-banner-meta">
            <a
              href="https://www.youtube.com/@letslearnwithaloksir2528"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-app-banner-btn"
            >
              <svg className="lp-app-banner-yt-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
              </svg>
              Subscribe to our YouTube Channel
            </a>
          </div>
        </div>
      </section>

      {/* ── Feature Marquee ── */}
      <section className="lp-marquee-section">
        {[
          { items: MARQUEE_ROW1, dir: "left" },
          { items: MARQUEE_ROW2, dir: "right" },
          { items: MARQUEE_ROW3, dir: "left" },
        ].map(({ items, dir }, rowIdx) => (
          <div key={rowIdx} className="lp-marquee-row">
            <div className={`lp-marquee-track lp-marquee-track--${dir}`}>
              {[...items, ...items, ...items, ...items, ...items, ...items].map((item, i) => (
                <span key={i} className="lp-marquee-chip">
                  <span className="lp-marquee-chip-icon">{item.emoji}</span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── Callback ── */}
      <section className="lp-callback-section">
        <div className="lp-callback-card">
          <div className="lp-callback-deco" aria-hidden="true" />
          <div className="lp-callback-left">
            <div className="lp-callback-top">
              <img src={websiteLogo} alt="" className="lp-callback-icon" />
              <span className="lp-callback-title">Request a callback</span>
              <p className="lp-callback-sub">Or call +91 98765 43210</p>
            </div>
          </div>
          <div className="lp-callback-right">
            {cbStatus === "done" ? (
              <div className="lp-callback-success">
                <p>✅ We'll call you back shortly!</p>
              </div>
            ) : (
              <form
                className="lp-callback-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCbStatus("submitting");
                  try {
                    await submitCallback(cbName, cbPhone);
                    setCbStatus("done");
                    setCbName("");
                    setCbPhone("");
                  } catch {
                    setCbStatus("error");
                  }
                }}
              >
                <div className="lp-callback-field">
                  <label htmlFor="cb-name">Full Name</label>
                  <div className="lp-callback-input-wrap">
                    <input id="cb-name" type="text" placeholder="Ex: Rohit Sharma" value={cbName} onChange={(e) => setCbName(e.target.value)} />
                  </div>
                </div>
                <div className="lp-callback-field">
                  <label htmlFor="cb-phone">Mobile Number</label>
                  <div className="lp-callback-input-wrap">
                    <input id="cb-phone" type="tel" placeholder="Ex: 9876543210" value={cbPhone} onChange={(e) => setCbPhone(e.target.value)} />
                  </div>
                </div>
                {cbStatus === "error" && (
                  <p className="lp-callback-error">Something went wrong. Please try again.</p>
                )}
                <div className="lp-callback-submit-wrap">
                  <button type="submit" className="lp-callback-submit" disabled={!cbName || !cbPhone || cbStatus === "submitting"}>
                    {cbStatus === "submitting" ? "Sending…" : "Let's get started"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── App section ── */}
      <section className="lp-app-section">
        <div className="lp-app-inner">
          <div className="lp-app-text">
            <h2>Join <span>Learning Hub now</span></h2>
            <p>Everything you need to ace your exams is here.</p>
            <div className="lp-app-points-row">
              <ul className="lp-app-features">
                {["Live Classes","Doubt Solving","Mock Tests","Revision Notes","PYQ Practice","Topic-wise Videos","Mentorship Sessions","Career Guidance"].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="lp-app-img-wrap">
                <img src={websiteLogo} alt="Learning Hub App" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-col">
            <div className="lp-footer-brand">
              <img src={websiteLogo} alt="Learning Hub logo" className="lp-footer-logo" />
              <span>Learning Hub</span>
            </div>
            <p className="lp-footer-about">Empowering students across India with expert guidance for JEE, NEET, and Olympiad success.</p>
            <div className="lp-footer-contact-row">
              <p className="lp-footer-contact"><strong>Phone:</strong> +91 98765 43210</p>
              <p className="lp-footer-contact"><strong>Email:</strong> hello@learninghub.com</p>
            </div>
          </div>
          <div className="lp-footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Programs</a></li>
              <li><a href="#results">Results</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} Learning Hub · All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
}
