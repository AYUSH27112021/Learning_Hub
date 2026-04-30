import { createContext, useContext } from "react";

export type AdminAuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "new_password_required"; email: string }
  | { status: "authenticated"; email: string };

export interface AdminAuthCtx {
  auth: AdminAuthState;
  signIn: (email: string, password: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  signOut: () => void;
  setSignOutGuard: (guard: (() => boolean) | null) => void;
}

export const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export function useAdminAuth(): AdminAuthCtx {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
