import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/defaults/website_logo.png";
import { useAdminAuth } from "../hooks/useAdminAuth";

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
  );
}

function PasswordInput({ name, placeholder, autoComplete }: { name: string; placeholder: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input-wrap">
      <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <input
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        required
        autoComplete={autoComplete ?? "new-password"}
        minLength={8}
        className="auth-input"
      />
      <button
        type="button"
        className="auth-eye-btn"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export default function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const { auth, signIn, completeNewPassword } = useAdminAuth();
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // ── Loading ──
  if (auth.status === "loading") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-spinner" />
          <p style={{ color: "#64748b", fontSize: 14, textAlign: "center" }}>Checking session…</p>
        </div>
      </div>
    );
  }

  // ── Login ──
  if (auth.status === "unauthenticated") {
    async function handleLogin(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError("");
      setLoading(true);
      const fd = new FormData(e.currentTarget);
      try {
        await signIn(String(fd.get("email")), String(fd.get("password")));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Login failed.");
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

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your admin account</p>

          <form onSubmit={handleLogin} className="auth-form" autoComplete="off">
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
                  required
                  autoComplete="off"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <Link to="/admin/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput name="password" placeholder="Enter your password" autoComplete="off" />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="lp-callback-submit" disabled={loading}>
              {loading ? <span className="auth-btn-spinner" /> : null}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── First-time password set ──
  if (auth.status === "new_password_required") {
    async function handleSetPassword(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError("");
      setLoading(true);
      const fd  = new FormData(e.currentTarget);
      const pw  = String(fd.get("password"));
      const pw2 = String(fd.get("confirm"));
      if (pw !== pw2) { setError("Passwords do not match."); setLoading(false); return; }
      try {
        await completeNewPassword(pw);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to set password.");
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

          <div className="auth-badge auth-badge--warn">First-time setup</div>
          <h1 className="auth-title">Set your password</h1>
          <p className="auth-subtitle">Create a permanent password for your account. Must be at least 8 characters.</p>

          <form onSubmit={handleSetPassword} className="auth-form" autoComplete="off">
            <div className="auth-field">
              <label className="auth-label">New password</label>
              <PasswordInput name="password" placeholder="Min. 8 characters" />
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm new password</label>
              <PasswordInput name="confirm" placeholder="Re-enter password" />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="lp-callback-submit" disabled={loading}>
              {loading ? <span className="auth-btn-spinner" /> : null}
              {loading ? "Saving…" : "Set Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated ──
  return <>{children}</>;
}
