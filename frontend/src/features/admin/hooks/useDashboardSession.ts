import { useCallback, useEffect, useRef, useState } from "react";
import { adminSupabase } from "../../../shared/lib/adminSupabase";

export type DashboardSessionState =
  | { status: "unauthenticated" }
  | { status: "loading" }
  | { status: "authenticated"; email: string }
  | { status: "error"; message: string };

const INACTIVITY_MS = 60_000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

export function useDashboardSession() {
  // Start loading so we can check if adminSupabase already holds an in-memory session
  // (happens when navigating back from the detail page).
  const [state, setState] = useState<DashboardSessionState>({ status: "loading" });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    adminSupabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setState({ status: "authenticated", email: data.session.user.email ?? "" });
      } else {
        setState({ status: "unauthenticated" });
      }
    });
  }, []);

  const doSignOut = useCallback(() => {
    adminSupabase.auth.signOut();
    setState({ status: "unauthenticated" });
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(doSignOut, INACTIVITY_MS);
  }, [doSignOut]);

  useEffect(() => {
    if (state.status !== "authenticated") return;

    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));

    const onVisibility = () => { if (document.visibilityState === "hidden") doSignOut(); };
    document.addEventListener("visibilitychange", onVisibility);

    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [state.status, resetTimer, doSignOut]);

  const signIn = async (email: string, password: string) => {
    setState({ status: "loading" });
    const { data, error } = await adminSupabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }
    setState({ status: "authenticated", email: data.user?.email ?? email });
  };

  return { state, signIn, signOut: doSignOut };
}
