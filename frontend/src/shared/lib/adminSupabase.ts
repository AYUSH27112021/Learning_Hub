import { createClient } from "@supabase/supabase-js";

// Separate client for admin dashboard — session is never written to localStorage.
// The authenticated session lives only in memory and is cleared on inactivity/tab hide.
export const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      storageKey: "sb-admin-dashboard-auth",
    },
  }
);
