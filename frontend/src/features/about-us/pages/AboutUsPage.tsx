import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import phoneIcon from "../../../assets/defaults/phone.svg";
import websiteLogo from "../../../assets/defaults/website_logo.png";
import whyLearningHubImage from "../../../assets/defaults/why_learning_hub.webp";
import interaction1 from "../../../assets/defaults/interaction1.webp";
import interaction2 from "../../../assets/defaults/interaction2.webp";
import alokPhoto from "../../../assets/defaults/Alok.webp";

export default function AboutUsPage() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [activeFeatureSlide, setActiveFeatureSlide] = useState(0);
  const [featureTouchStartX, setFeatureTouchStartX] = useState<number | null>(null);

  type NavItem =
    | { label: string; items: string[]; columns?: never; path?: never }
    | { label: string; columns: { left: { title: string; desc: string }[]; right: { title: string; desc: string }[] }; items?: never; path?: never }
    | { label: string; path?: string; items?: never; columns?: never };

  const NAV_ITEMS: NavItem[] = [
    { label: "Programs", items: ["Syllabus: CBSE & ICSE", "Class VI", "Class VII", "Class VIII", "Class IX", "Class X", "Class XI", "Class XII", "Class XII Pass"] },
    {
      label: "Target Exams", columns: {
        left: [
          { title: "JEE MAIN", desc: "Build strong problem-solving skills and secure admission to top engineering colleges across India." },
          { title: "JEE ADVANCED", desc: "Prepare deeply for conceptual and challenging questions needed for IIT admissions." },
        ],
        right: [
          { title: "KVPY", desc: "Develop scientific aptitude early with focused preparation for competitive fellowship-level exams." },
          { title: "NTSE", desc: "Strengthen school fundamentals with guided practice for national-level scholarship selection." },
          { title: "OLYMPIADS", desc: "Master advanced topics through rigorous training for national and international olympiad stages." },
        ],
      }
    },
    { label: "Results" },
    { label: "Why Learning Hub", path: "/why-learning-hub" },
    { label: "About Us", path: "/about-us" },
  ];

  type WhyFeature = {
    title: string;
    description: string;
    icon: JSX.Element;
  };

  const WHY_FEATURES: WhyFeature[] = [
    {
      title: "Clarity-Driven Goal Setting",
      description: "Every student is different. We help learners define realistic academic goals based on their current level and guide them step-by-step toward achieving them.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16L21 21" />
          <path d="M11 8V14" />
          <path d="M8 11H14" />
        </svg>
      ),
    },
    {
      title: "Concept-First Teaching",
      description: "We simplify even the toughest topics into easy, relatable ideas. When concepts are clear, problem-solving becomes natural.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 7.5L12 4L20 7.5L12 11L4 7.5Z" />
          <path d="M6 10.5V14.5C6 16.5 8.8 18 12 18C15.2 18 18 16.5 18 14.5V10.5" />
          <path d="M20 7.5V13" />
        </svg>
      ),
    },
    {
      title: "Focused Student Attention",
      description: "We keep learning interactive and personal-ensuring every student gets the attention they need to improve steadily.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="16" cy="8" r="2.5" />
          <path d="M3.5 18C3.8 15.9 5.5 14.5 8 14.5C10.5 14.5 12.2 15.9 12.5 18" />
          <path d="M11.5 18C11.8 15.9 13.5 14.5 16 14.5C18.5 14.5 20.2 15.9 20.5 18" />
        </svg>
      ),
    },
    {
      title: "Smart Problem-Solving Skills",
      description: "Students are trained to approach questions logically, not mechanically. This builds strong analytical and reasoning ability.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3L14.5 8.5L20.5 9L16 13L17.3 19L12 15.8L6.7 19L8 13L3.5 9L9.5 8.5L12 3Z" />
        </svg>
      ),
    },
    {
      title: "Multiple Methods, Deeper Understanding",
      description: "Wherever possible, we teach more than one way to solve a problem-helping students think flexibly and confidently.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3V21" />
          <path d="M5 7L12 3L19 7L12 11L5 7Z" />
          <path d="M5 17L12 13L19 17L12 21L5 17Z" />
        </svg>
      ),
    },
    {
      title: "Exam-Oriented Yet Conceptual",
      description: "Our preparation balances strong fundamentals with real exam patterns, so students are ready for any level of difficulty.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 18H20" />
          <path d="M6.5 18V11.5" />
          <path d="M11.5 18V8.5" />
          <path d="M16.5 18V5.5" />
          <path d="M6.5 9L11.5 6L16.5 3L20 5.2" />
        </svg>
      ),
    },
    {
      title: "Stress-Free Learning Approach",
      description: "We believe students perform best without pressure. Our teaching style promotes understanding over overload.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2.8L14.6 8.2L20.6 8.8L16.1 12.8L17.3 18.9L12 15.8L6.7 18.9L7.9 12.8L3.4 8.8L9.4 8.2L12 2.8Z" />
          <path d="M12 10V13.2" />
          <circle cx="12" cy="15.7" r="0.8" />
        </svg>
      ),
    },
    {
      title: "Curated Study Support",
      description: "From class notes to practice problems, everything is designed to reinforce learning-not confuse it.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" rx="2.5" />
          <path d="M8 9H16" />
          <path d="M8 13H13" />
          <path d="M8 16H12" />
        </svg>
      ),
    },
  ];

  const renderFeatureCard = (feature: WhyFeature, key: string) => (
    <div key={key} className="lp-why-feature-card">
      <div className="lp-why-feature-icon" aria-hidden="true">
        {feature.icon}
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  );

  const mobileScrollableFeatureGroups: WhyFeature[][] = [];
  for (let i = 0; i < WHY_FEATURES.length; i += 2) {
    mobileScrollableFeatureGroups.push(WHY_FEATURES.slice(i, i + 2));
  }

  const showNextFeatureSlide = () => {
    setActiveFeatureSlide((prev) => (prev + 1) % mobileScrollableFeatureGroups.length);
  };

  const showPrevFeatureSlide = () => {
    setActiveFeatureSlide((prev) => (prev - 1 + mobileScrollableFeatureGroups.length) % mobileScrollableFeatureGroups.length);
  };

  return (
    <div className="lp-wrapper">
      <header className="lp-header">
        <div className="lp-brand-bar">
          <div className="lp-brand-inner">
            <button
              type="button"
              className="lp-mobile-menu-btn"
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span />
              <span />
              <span />
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
                    onMouseEnter={() => {
                      if (item.items || item.columns) {
                        setOpenDropdown(item.label);
                      }
                    }}
                    onMouseLeave={() => {
                      if (item.items || item.columns) {
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    <button
                      className="lp-brand-nav-item"
                      onClick={() => {
                        if (!item.items && !item.columns && item.path) {
                          navigate(item.path);
                          setOpenDropdown(null);
                          return;
                        }
                        setOpenDropdown(openDropdown === item.label ? null : item.label);
                      }}
                    >
                      {item.label} {(item.items || item.columns) && <span className="lp-brand-nav-arrow" />}
                    </button>
                    {openDropdown === item.label && item.items && (
                      <div className="lp-dropdown">
                        {item.items.map((sub) => (
                          <div key={sub} className="lp-dropdown-item">{sub}</div>
                        ))}
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
          onClick={() => {
            setIsMobileMenuOpen(false);
            setMobileOpenDropdown(null);
          }}
        />
        <aside className={`lp-mobile-menu-drawer ${isMobileMenuOpen ? "lp-mobile-menu-drawer--open" : ""}`}>
          <div className="lp-mobile-menu-head">
            <span>Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setMobileOpenDropdown(null);
              }}
            >
              ×
            </button>
          </div>
          <nav className="lp-mobile-menu-nav">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="lp-mobile-menu-item">
                <button
                  type="button"
                  className="lp-mobile-menu-main"
                  onClick={() => {
                    if (!item.items && !item.columns && item.path) {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                      setMobileOpenDropdown(null);
                      return;
                    }
                    setMobileOpenDropdown((prev) => (prev === item.label ? null : item.label));
                  }}
                >
                  <span>{item.label}</span>
                  {(item.items || item.columns) && <span className="lp-mobile-menu-chevron">▾</span>}
                </button>
                {mobileOpenDropdown === item.label && item.items && (
                  <div className="lp-mobile-sub-list">
                    {item.items.map((sub) => (
                      <div key={sub} className="lp-mobile-sub-item">{sub}</div>
                    ))}
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
        <section className="lp-why-page-intro">
          <div className="lp-why-page-breadcrumb-wrap">
            <Link to="/" className="lp-why-page-breadcrumb-link">Home</Link>
            <span className="lp-why-page-breadcrumb-sep">›</span>
            <span className="lp-why-page-breadcrumb-current">About Us</span>
          </div>

          {/* ── Section 1: About the institute ── */}
          <div className="au-intro-section">
            <div className="au-intro-text">
              <h2 className="au-intro-heading">The Learning Hub Coaching Institute</h2>
              <p>
                Learning Hub was founded by <strong>Alok Ranjan</strong> with a single clear vision — to make quality education accessible to every student, regardless of their background. What began as a small classroom has grown into a trusted coaching institute helping hundreds of students achieve their academic goals each year.
              </p>
              <p>
                At Learning Hub, we believe that every student has the potential to excel. Our teaching methodology focuses on building strong conceptual foundations rather than rote learning, ensuring students are prepared not just for exams but for lifelong problem-solving.
              </p>
              <p>
                From Class VI to competitive entrance exams like JEE and NEET, we offer structured, personalized guidance that has helped students transform their academic journeys and realize their true potential.
              </p>
            </div>
            <div className="au-intro-collage">
              <img src={interaction1} alt="Teacher at whiteboard" className="au-collage-img au-collage-img--top" />
              <img src={interaction2} alt="Students with teacher" className="au-collage-img au-collage-img--bottom" />
            </div>
          </div>

          <hr className="lp-why-divider" />

          {/* ── Section 2: Founder ── */}
          <div className="au-founder-section">
            <div className="au-founder-photo-wrap">
              <img src={alokPhoto} alt="Alok Ranjan" className="au-founder-photo" />
            </div>
            <div className="au-founder-bio">
              <h2 className="au-founder-name">Alok Ranjan</h2>
              <p className="au-founder-title">Founder</p>
              <p>
                Alok Ranjan is a passionate educator with over a decade of experience in teaching Mathematics and Science. Known for his ability to simplify complex topics and make learning engaging, he has mentored thousands of students across CBSE, ICSE, and competitive exam streams.
              </p>
              <p>
                His teaching style is rooted in patience, clarity, and genuine care for every student&apos;s growth. Whether it&apos;s a struggling student or a top performer, Alok Sir ensures that each individual receives the attention and guidance they need to succeed.
              </p>
              <p>
                Beyond the classroom, he actively creates free educational content on YouTube, helping students across India access quality learning without barriers.
              </p>
            </div>
          </div>

          <hr className="lp-why-divider" />

          <h2>Our Promise</h2>
          <p>
            <span className="lp-why-nowrap-line">
              We don&apos;t claim to create toppers overnight. We focus on building <strong>strong students</strong>—and strong students naturally achieve great results.
            </span>
          </p>

          <hr className="lp-why-divider lp-why-divider--final" />
        </section>
      </main>

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
            <form className="lp-callback-form" onSubmit={(e) => e.preventDefault()}>
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
              <div className="lp-callback-submit-wrap">
                <button type="submit" className="lp-callback-submit" disabled={!cbName || !cbPhone}>
                  Let's get started
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

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
              <li><a href="#">Results</a></li>
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
