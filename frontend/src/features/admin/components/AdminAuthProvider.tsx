import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import {
  cognitoCompleteNewPassword,
  cognitoGetEmail,
  cognitoGetSession,
  cognitoSignIn,
  cognitoSignOut,
} from "../services/cognitoAuth";
import { AdminAuthContext, AdminAuthState } from "../hooks/useAdminAuth";

export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth]               = useState<AdminAuthState>({ status: "loading" });
  const [pendingUser, setPendingUser] = useState<CognitoUser | null>(null);
  const signOutGuard                  = useRef<(() => boolean) | null>(null);

  const forceSignOut = useCallback(() => {
    cognitoSignOut();
    setPendingUser(null);
    setAuth({ status: "unauthenticated" });
  }, []);

  // ── Initial session check ─────────────────────────────────────────────────
  useEffect(() => {
    cognitoGetSession().then(async (session) => {
      if (session) {
        const email = await cognitoGetEmail();
        setAuth({ status: "authenticated", email: email ?? "" });
      } else {
        setAuth({ status: "unauthenticated" });
      }
    });
    return () => { cognitoSignOut(); };
  }, []);

  // ── Re-validate session on window focus (catches stale tabs) ─────────────
  useEffect(() => {
    const handleFocus = async () => {
      const session = await cognitoGetSession();
      if (!session) forceSignOut();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [forceSignOut]);

  // ── Cognito inactivity logout (10 min) ────────────────────────────────────
  const inactivityTimer = useRef<number | null>(null);

  useEffect(() => {
    if (auth.status !== "authenticated") return;

    const EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

    const reset = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = window.setTimeout(forceSignOut, 10 * 60_000);
    };

    EVENTS.forEach(ev => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      EVENTS.forEach(ev => window.removeEventListener(ev, reset));
      if (inactivityTimer.current) { clearTimeout(inactivityTimer.current); inactivityTimer.current = null; }
    };
  }, [auth.status, forceSignOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await cognitoSignIn(email, password);
    if (result.type === "new_password_required") {
      setPendingUser(result.user);
      setAuth({ status: "new_password_required", email });
    } else {
      setAuth({ status: "authenticated", email });
    }
  }, []);

  const completeNewPassword = useCallback(async (newPassword: string) => {
    if (!pendingUser) throw new Error("No pending user");
    await cognitoCompleteNewPassword(pendingUser, newPassword);
    const email = await cognitoGetEmail();
    setPendingUser(null);
    setAuth({ status: "authenticated", email: email ?? "" });
  }, [pendingUser]);

  const signOut = useCallback(() => {
    if (signOutGuard.current && !signOutGuard.current()) return;
    forceSignOut();
  }, [forceSignOut]);

  const setSignOutGuard = useCallback((guard: (() => boolean) | null) => {
    signOutGuard.current = guard;
  }, []);

  return (
    <AdminAuthContext.Provider value={{ auth, signIn, completeNewPassword, signOut, setSignOutGuard }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
