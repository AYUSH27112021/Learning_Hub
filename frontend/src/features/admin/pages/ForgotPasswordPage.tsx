import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { cognitoConfirmForgotPassword, cognitoForgotPassword } from "../services/cognitoAuth";
import logo from "../../../assets/defaults/website_logo.png";

type Step = "email" | "code" | "done";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>
    </svg>
  ) ;
}

export default function ForgotPasswordPage() {
  const [step, setStep]       = useState<Step>("email");
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);

  async function handleSendCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await cognitoForgotPassword(email);
      setStep("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd  = new FormData(e.currentTarget);
    const code = String(fd.get("code")).trim();
    const pw   = String(fd.get("password"));
    const pw2  = String(fd.get("confirm"));
    if (pw !== pw2) { setError("Passwords do not match."); setLoading(false); return; }
    try {
      await cognitoConfirmForgotPassword(email, code, pw);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="Learning Hub" className="auth-logo" />
          <div>
            <div className="auth-brand-name">Learning Hub</div>
            <div className="auth-brand-sub">Admin Portal</div>
          </div>
        </Link>

        {/* ── Step 1: enter email ── */}
        {step === "email" && (
          <>
            <div className="auth-back-row">
              <Link to="/admin" className="auth-back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back to login
              </Link>
            </div>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
              Enter your admin email and we'll send a verification code to reset your password.
            </p>
            <form onSubmit={handleSendCode} className="auth-form" autoComplete="off">
              <div className="auth-field">
                <label className="auth-label">Email address</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                    className="auth-input"
                  />
                </div>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-btn-spinner" /> : null}
                {loading ? "Sending…" : "Send Reset Code"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: code + new password ── */}
        {step === "code" && (
          <>
            <div className="auth-back-row">
              <button className="auth-back-link" onClick={() => { setStep("email"); setError(""); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
            </div>
            <div className="auth-badge auth-badge--info">Code sent</div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below along with your new password.
            </p>
            <form onSubmit={handleConfirm} className="auth-form" autoComplete="off">
              <div className="auth-field">
                <label className="auth-label">Verification code</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <input
                    name="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="auth-input auth-input--code"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">New password</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="auth-input"
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Confirm new password</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    name="confirm"
                    type={showCf ? "text" : "password"}
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="auth-input"
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowCf(s => !s)} tabIndex={-1}>
                    <EyeIcon open={showCf} />
                  </button>
                </div>
              </div>

              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-btn-spinner" /> : null}
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: done ── */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div className="auth-success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle">Your password has been updated. You can now sign in with your new password.</p>
            <Link to="/admin" className="auth-submit" style={{ display: "block", textAlign: "center", marginTop: 24, textDecoration: "none" }}>
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
