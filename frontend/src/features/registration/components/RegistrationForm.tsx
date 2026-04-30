import { FormEvent, useRef, useState } from "react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

const EDGE_FN  = "https://klcuvymeijrtbqjmjxfr.supabase.co/functions/v1/register";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;

const SCHOOL_CLASSES = [
  "Class VI", "Class VII", "Class VIII", "Class IX", "Class X",
];

const STREAM_CLASSES = ["Class XI", "Class XII", "Class XII Pass"];
const STREAMS = ["Math", "Bio"];

const COMPETITIVE_EXAMS = [
  { id: "JEE MAIN",     label: "JEE MAIN"     },
  { id: "JEE ADVANCED", label: "JEE ADVANCED" },
  { id: "KVPY",         label: "KVPY"         },
  { id: "NTSE",         label: "NTSE"         },
  { id: "OLYMPIADS",    label: "OLYMPIADS"    },
];

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type CourseType = "school" | "competitive" | "";

export default function RegistrationForm() {
  const [courseType, setCourseType]           = useState<CourseType>("");
  const [selectedClass, setSelectedClass]     = useState("");
  const [selectedStream, setSelectedStream]   = useState("");
  const [selectedExam, setSelectedExam]       = useState("");
  const [gender, setGender]                   = useState("");
  const [maritalStatus, setMaritalStatus]     = useState("");
  const [nationality, setNationality]         = useState("Indian");
  const [otherNationality, setOtherNationality] = useState("");
  const [pincode, setPincode]                 = useState("");
  const [pincodeError, setPincodeError]       = useState("");
  const [phone, setPhone]                     = useState("");
  const [phoneError, setPhoneError]           = useState("");
  const [email, setEmail]                     = useState("");
  const [emailError, setEmailError]           = useState("");
  const [cfToken, setCfToken]                 = useState("");
  const [submitting, setSubmitting]           = useState(false);
  const [message, setMessage]                 = useState<{ text: string; ok: boolean } | null>(null);
  const turnstileRef                          = useRef<TurnstileInstance>(null);
  const formRef                               = useRef<HTMLFormElement>(null);

  const needsStream = STREAM_CLASSES.includes(selectedClass);

  function getCourseName() {
    if (courseType === "school") {
      if (needsStream) return selectedStream ? `${selectedClass} - ${selectedStream}` : "";
      return selectedClass;
    }
    if (courseType === "competitive") return selectedExam;
    return "";
  }

  function validatePincode(v: string) {
    if (!v) return "PIN code is required.";
    if (!/^\d{6}$/.test(v)) return "PIN code must be exactly 6 digits.";
    return "";
  }

  function validatePhone(v: string) {
    if (!v) return "Phone number is required.";
    if (!/^\d{10}$/.test(v)) return "Enter exactly 10 digits.";
    return "";
  }

  function validateEmail(v: string) {
    if (!v) return "Email is required.";
    if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
    return "";
  }

  function resetForm() {
    formRef.current?.reset();
    setCourseType(""); setSelectedClass(""); setSelectedStream(""); setSelectedExam("");
    setGender(""); setMaritalStatus("");
    setNationality("Indian"); setOtherNationality("");
    setPincode(""); setPincodeError("");
    setPhone(""); setEmail("");
    setCfToken("");
    turnstileRef.current?.reset();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const pincodeErr = validatePincode(pincode);
    const phoneErr   = validatePhone(phone);
    const emailErr   = email ? validateEmail(email) : "";
    setPincodeError(pincodeErr);
    setPhoneError(phoneErr);
    setEmailError(emailErr);
    if (pincodeErr || phoneErr || emailErr) return;

    const courseName = getCourseName();
    if (!courseName) {
      setMessage({ text: "Please select a course before submitting.", ok: false });
      return;
    }
    if (!gender) {
      setMessage({ text: "Please select a gender.", ok: false });
      return;
    }
    const fd0 = new FormData(e.currentTarget);
    if (!fd0.get("bloodGroup")) {
      setMessage({ text: "Please select a blood group.", ok: false });
      return;
    }
    if (!cfToken) {
      setMessage({ text: "Please complete the security check.", ok: false });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const fd = new FormData(e.currentTarget);

    try {
      const res  = await fetch(EDGE_FN, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          cfToken,
          courseName,
          studentName:  (fd.get("studentName") as string).trim(),
          fatherName:   (fd.get("fatherName")  as string).trim(),
          motherName:   (fd.get("motherName")  as string).trim(),
          birthDate:    fd.get("birthDate"),
          gender,
          fullAddress:  (fd.get("fullAddress") as string).trim(),
          district:     (fd.get("district")    as string).trim(),
          pincode:      (fd.get("pincode")     as string).trim(),
          religion:     (fd.get("religion")    as string) || null,
          nationality:  nationality === "Other" ? otherNationality.trim() : "Indian",
          phone:        "+91" + phone,
          email:        email.trim().toLowerCase() || null,
          bloodGroup:   (fd.get("bloodGroup")  as string) || null,
          occupation:   (fd.get("occupation")  as string) || null,
          maritalStatus: maritalStatus || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message ?? "Registration submitted successfully!", ok: true });
        resetForm();
      } else {
        setMessage({ text: data.message ?? "Submission failed. Please try again.", ok: false });
        turnstileRef.current?.reset();
        setCfToken("");
      }
    } catch {
      setMessage({ text: "Network error. Please check your connection and try again.", ok: false });
      turnstileRef.current?.reset();
      setCfToken("");
    }

    setSubmitting(false);
  }

  return (
    <form className="reg-form" onSubmit={onSubmit} noValidate ref={formRef}>

      {/* ── Course Selection ── */}
      <section className="reg-section">
        <h2 className="reg-section-title"><span className="reg-section-icon">📚</span> Select Your Course</h2>
        <div className="reg-course-tabs">
          <button type="button" className={`reg-course-tab${courseType === "school" ? " reg-course-tab--active" : ""}`}
            onClick={() => { setCourseType("school"); setSelectedExam(""); setSelectedClass(""); setSelectedStream(""); }}>
            School Syllabus<span className="reg-course-tab-sub">CBSE &amp; ICSE</span>
          </button>
          <button type="button" className={`reg-course-tab${courseType === "competitive" ? " reg-course-tab--active" : ""}`}
            onClick={() => { setCourseType("competitive"); setSelectedClass(""); setSelectedStream(""); }}>
            Competitive Exams<span className="reg-course-tab-sub">JEE · KVPY · NTSE · Olympiads</span>
          </button>
        </div>

        {courseType === "school" && (
          <>
            <div className="reg-class-grid">
              {SCHOOL_CLASSES.map(cls => (
                <button key={cls} type="button"
                  className={`reg-class-chip${selectedClass === cls ? " reg-class-chip--active" : ""}`}
                  onClick={() => { setSelectedClass(cls); setSelectedStream(""); }}>{cls}</button>
              ))}
              {STREAM_CLASSES.map(cls => (
                <button key={cls} type="button"
                  className={`reg-class-chip${selectedClass === cls ? " reg-class-chip--active" : ""}`}
                  onClick={() => { setSelectedClass(cls); setSelectedStream(""); }}>{cls}</button>
              ))}
            </div>

            {needsStream && (
              <div className="reg-stream-row">
                <span className="reg-stream-label">Select Stream</span>
                {STREAMS.map(s => (
                  <button key={s} type="button"
                    className={`reg-class-chip${selectedStream === s ? " reg-class-chip--active" : ""}`}
                    onClick={() => setSelectedStream(s)}>{s}</button>
                ))}
              </div>
            )}
          </>
        )}

        {courseType === "competitive" && (
          <div className="reg-class-grid">
            {COMPETITIVE_EXAMS.map(ex => (
              <button key={ex.id} type="button"
                className={`reg-class-chip${selectedExam === ex.id ? " reg-class-chip--active" : ""}`}
                onClick={() => setSelectedExam(ex.id)}>{ex.label}</button>
            ))}
          </div>
        )}

        {courseType && (
          <div className="reg-course-selected">
            {getCourseName()
              ? <><span className="reg-tick">✓</span> Selected: <strong>{getCourseName()}</strong></>
              : <span className="reg-hint">Please pick an option above.</span>}
          </div>
        )}
      </section>

      {/* ── Student Information ── */}
      <section className="reg-section">
        <h2 className="reg-section-title"><span className="reg-section-icon">🎓</span> Student Information</h2>
        <div className="reg-grid">
          <div className="reg-field">
            <label className="reg-label">Student's Name <span className="reg-req">*</span></label>
            <input className="reg-input" name="studentName" placeholder="Full name of student" required />
          </div>
          <div className="reg-field">
            <label className="reg-label">Father's Name <span className="reg-req">*</span></label>
            <input className="reg-input" name="fatherName" placeholder="Father's full name" required />
          </div>
          <div className="reg-field">
            <label className="reg-label">Mother's Name <span className="reg-req">*</span></label>
            <input className="reg-input" name="motherName" placeholder="Mother's full name" required />
          </div>
          <div className="reg-field">
            <label className="reg-label">Date of Birth <span className="reg-req">*</span></label>
            <input className="reg-input" name="birthDate" type="date" required />
          </div>
        </div>
        <div className="reg-field reg-field--mt">
          <label className="reg-label">Gender <span className="reg-req">*</span></label>
          <div className="reg-radio-group">
            {["Male", "Female", "Other"].map(g => (
              <label key={g} className={`reg-radio-opt${gender === g ? " reg-radio-opt--active" : ""}`}>
                <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} required />
                {g}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── Address Details ── */}
      <section className="reg-section">
        <h2 className="reg-section-title"><span className="reg-section-icon">🏠</span> Address Details</h2>
        <div className="reg-field">
          <label className="reg-label">Full Address <span className="reg-req">*</span></label>
          <textarea className="reg-input reg-textarea" name="fullAddress" placeholder="House / Flat no., Street, Locality, City" rows={3} required />
        </div>
        <div className="reg-grid reg-grid--mt">
          <div className="reg-field">
            <label className="reg-label">District <span className="reg-req">*</span></label>
            <input className="reg-input" name="district" placeholder="District" required />
          </div>
          <div className="reg-field">
            <label className="reg-label">PIN Code <span className="reg-req">*</span></label>
            <input
              className={`reg-input${pincodeError ? " reg-input--error" : ""}`}
              name="pincode"
              placeholder="6-digit PIN code"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPincode(v);
                if (pincodeError) setPincodeError(validatePincode(v));
              }}
              onBlur={() => setPincodeError(validatePincode(pincode))}
            />
            {pincodeError && <span className="reg-field-error">{pincodeError}</span>}
          </div>
        </div>
      </section>

      {/* ── Contact & Identity ── */}
      <section className="reg-section">
        <h2 className="reg-section-title"><span className="reg-section-icon">📱</span> Contact &amp; Identity Details</h2>
        <div className="reg-grid">
          <div className="reg-field">
            <label className="reg-label">Phone Number <span className="reg-req">*</span></label>
            <div className={`reg-phone-wrap${phoneError ? " reg-phone-wrap--error" : ""}`}>
              <span className="reg-phone-prefix">+91</span>
              <input className="reg-phone-input" type="tel" placeholder="10-digit number" maxLength={10} inputMode="numeric"
                value={phone}
                onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0,10); setPhone(v); if (phoneError) setPhoneError(validatePhone(v)); }}
                onBlur={() => setPhoneError(validatePhone(phone))} />
            </div>
            {phoneError && <span className="reg-field-error">{phoneError}</span>}
          </div>
          <div className="reg-field">
            <label className="reg-label">Email Address</label>
            <input className={`reg-input${emailError ? " reg-input--error" : ""}`} type="email" placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(e.target.value ? validateEmail(e.target.value) : ""); }}
              onBlur={() => setEmailError(email ? validateEmail(email) : "")} />
            {emailError && <span className="reg-field-error">{emailError}</span>}
            <span className="reg-optional-hint">Optional — validated if entered</span>
          </div>
          <div className="reg-field">
            <label className="reg-label">Religion</label>
            <input className="reg-input" name="religion" placeholder="e.g. Hindu, Muslim, Christian…" />
            <span className="reg-optional-hint">Optional</span>
          </div>
          <div className="reg-field">
            <label className="reg-label">Nationality <span className="reg-req">*</span></label>
            <select className="reg-input" value={nationality} onChange={e => setNationality(e.target.value)} required>
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </select>
            {nationality === "Other" && (
              <input className="reg-input reg-input--mt" placeholder="Please specify nationality"
                value={otherNationality} onChange={e => setOtherNationality(e.target.value)} required />
            )}
          </div>
          <div className="reg-field">
            <label className="reg-label">Blood Group <span className="reg-req">*</span></label>
            <select className="reg-input" name="bloodGroup" required>
              <option value="">— Select —</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ── Personal Details ── */}
      <section className="reg-section">
        <h2 className="reg-section-title"><span className="reg-section-icon">👤</span> Personal Details <span className="reg-section-optional">(Optional)</span></h2>
        <div className="reg-grid">
          <div className="reg-field">
            <label className="reg-label">Occupation</label>
            <input className="reg-input" name="occupation" placeholder="e.g. Student, Self-employed…" />
          </div>
        </div>
        <div className="reg-field reg-field--mt">
          <label className="reg-label">Marital Status</label>
          <div className="reg-radio-group">
            {["Single", "Married"].map(s => (
              <label key={s} className={`reg-radio-opt${maritalStatus === s ? " reg-radio-opt--active" : ""}`}>
                <input type="radio" name="maritalStatus" value={s} checked={maritalStatus === s} onChange={() => setMaritalStatus(s)} />
                {s}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── Course Summary ── */}
      <section className="reg-section reg-section--summary">
        <h2 className="reg-section-title"><span className="reg-section-icon">📘</span> Course Information</h2>
        <div className="reg-field">
          <label className="reg-label">Selected Course / Program</label>
          <input className="reg-input reg-input--readonly" readOnly value={getCourseName() || "No course selected yet — please choose above"} />
        </div>
      </section>

      {message && (
        <div className={`reg-message${message.ok ? " reg-message--ok" : " reg-message--err"}`}>
          {message.ok ? "✓ " : "✕ "}{message.text}
        </div>
      )}

      {/* ── Captcha + Submit ── */}
      <div className="reg-bottom-row">
        <div className="reg-turnstile-wrap">
          <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY}
            onSuccess={token => setCfToken(token)}
            onExpire={() => setCfToken("")}
            onError={() => setCfToken("")}
            options={{ theme: "light", size: "normal" }} />
          {!cfToken && <p className="reg-turnstile-hint">Complete the security check to enable submit.</p>}
        </div>
        <button className="reg-submit" type="submit" disabled={submitting || !cfToken}>
          {submitting ? "Submitting…" : "Submit Registration"}
        </button>
      </div>
    </form>
  );
}
