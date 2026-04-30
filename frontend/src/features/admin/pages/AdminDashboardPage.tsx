import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminSupabase } from "../../../shared/lib/adminSupabase";
import { useDashboardSession } from "../hooks/useDashboardSession";

const PAGE_SIZE = 10;

// ── Types ──────────────────────────────────────────────────────────────────────
type Stats = { totalReg: number; openReg: number; totalCb: number; openCb: number };

type Reg = {
  id: string; created_at: string; student_name: string;
  father_name: string; phone: string; email: string | null;
  course_name: string; district: string; closed: boolean;
};

type Cb = { id: string; created_at: string; name: string; phone: string; closed: boolean };

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusPill({ closed, loading, onToggle }: { closed: boolean; loading: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      style={{
        width: "auto", padding: "4px 12px", fontSize: 12, fontWeight: 700,
        borderRadius: 999, border: "none", cursor: loading ? "default" : "pointer",
        background: closed ? "#d1fae5" : "#fee2e2",
        color:      closed ? "#065f46" : "#991b1b",
      }}
    >
      {loading ? "…" : closed ? "Closed" : "Open"}
    </button>
  );
}

// ── Gate login form ────────────────────────────────────────────────────────────
function GateForm({
  signIn,
  prevError,
}: {
  signIn: (email: string, password: string) => Promise<void>;
  prevError?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(prevError ?? "");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await signIn(String(fd.get("email")), String(fd.get("password")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adash-gate">
      <div className="adash-gate-card">
        <div className="adash-gate-icon">🔐</div>
        <h2 className="adash-gate-title">Data Access Required</h2>
        <p className="adash-gate-sub">
          Enter your Supabase admin credentials to populate the dashboard.
          Session clears after 1 minute of inactivity or when you leave the page.
        </p>
        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <input
                name="email" type="email" required
                className="auth-input" placeholder="admin@example.com"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                name="password" type="password" required
                className="auth-input" placeholder="Password"
                autoComplete="off"
              />
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="lp-callback-submit" disabled={loading}>
            {loading ? <span className="auth-btn-spinner" /> : null}
            {loading ? "Verifying…" : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat cards ─────────────────────────────────────────────────────────────────
function StatsRow() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const [
      { count: totalReg },
      { count: openReg  },
      { count: totalCb  },
      { count: openCb   },
    ] = await Promise.all([
      adminSupabase.from("registrations").select("*", { count: "exact", head: true }),
      adminSupabase.from("registrations").select("*", { count: "exact", head: true }).eq("closed", false),
      adminSupabase.from("callbacks"    ).select("*", { count: "exact", head: true }),
      adminSupabase.from("callbacks"    ).select("*", { count: "exact", head: true }).eq("closed", false),
    ]);
    setStats({
      totalReg: totalReg ?? 0,
      openReg:  openReg  ?? 0,
      totalCb:  totalCb  ?? 0,
      openCb:   openCb   ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cards = [
    { label: "Total Registrations",   value: stats?.totalReg ?? 0, accent: "#003087" },
    { label: "Open Registrations",    value: stats?.openReg  ?? 0, accent: "#0f9f84" },
    { label: "Callbacks Requested",   value: stats?.totalCb  ?? 0, accent: "#7c3aed" },
    { label: "Open Callbacks",        value: stats?.openCb   ?? 0, accent: "#f59e0b" },
  ];

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 className="lp-admin-dashboard-title" style={{ marginBottom: 0 }}>Dashboard</h2>
        <button
          onClick={fetchStats}
          disabled={loading}
          style={{ width: "auto", padding: "6px 14px", fontSize: 13, background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 8 }}
        >
          {loading ? "…" : "↻ Refresh stats"}
        </button>
      </div>
      <div className="adash-stats">
        {cards.map(c => (
          <div key={c.label} className="adash-stat-card" style={{ borderTop: `3px solid ${c.accent}` }}>
            {loading
              ? <div className="adash-stat-skeleton" />
              : <div className="adash-stat-value" style={{ color: c.accent }}>{c.value.toLocaleString()}</div>
            }
            <div className="adash-stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── Registrations table ────────────────────────────────────────────────────────
function RegsTable() {
  const [rows,       setRows      ] = useState<Reg[]>([]);
  const [count,      setCount     ] = useState(0);
  const [page,       setPage      ] = useState(0);
  const [search,     setSearch    ] = useState("");
  const [showClosed, setShowClosed] = useState(true);
  const [loading,    setLoading   ] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const fetchRows = useCallback(async (pg: number, q: string, closed: boolean) => {
    setLoading(true);
    let query = adminSupabase
      .from("registrations")
      .select("id,created_at,student_name,father_name,phone,email,course_name,district,closed", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(pg * PAGE_SIZE, pg * PAGE_SIZE + PAGE_SIZE - 1);

    if (!closed) query = query.eq("closed", false);
    if (q.trim()) {
      const s = q.trim();
      query = query.or(
        `student_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,course_name.ilike.%${s}%,district.ilike.%${s}%`
      );
    }

    const { data, count: total, error } = await query;
    if (!error) { setRows(data ?? []); setCount(total ?? 0); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(0, "", true); }, [fetchRows]);

  function onSearch(q: string) {
    setSearch(q);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchRows(0, q, showClosed), 500);
  }

  function onToggleClosed() {
    const next = !showClosed;
    setShowClosed(next);
    setPage(0);
    fetchRows(0, search, next);
  }

  function onPage(pg: number) {
    setPage(pg);
    fetchRows(pg, search, showClosed);
  }

  async function toggleRow(id: string, current: boolean) {
    setTogglingId(id);
    const { error } = await adminSupabase.from("registrations").update({ closed: !current }).eq("id", id);
    if (!error) setRows(prev => prev.map(r => r.id === id ? { ...r, closed: !current } : r));
    setTogglingId(null);
  }

  const pages = Math.ceil(count / PAGE_SIZE);

  return (
    <section className="adash-table-section card">
      <div className="adash-table-header">
        <div>
          <h3 className="adash-table-title">Registrations</h3>
          <span className="adash-table-count">{count} total</span>
        </div>
        <div className="adash-table-controls">
          <input
            className="adash-search"
            placeholder="Search name, phone, course…"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          <button
            className={`adash-toggle ${!showClosed ? "adash-toggle--active" : ""}`}
            onClick={onToggleClosed}
          >
            {showClosed ? "Hide closed" : "Show closed"}
          </button>
          <button
            className="adash-refresh-btn"
            onClick={() => fetchRows(page, search, showClosed)}
            disabled={loading}
          >
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Student</th>
              <th>Father</th>
              <th>Course</th>
              <th>Phone</th>
              <th>District</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="adash-table-empty">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="adash-table-empty">No records found.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ opacity: r.closed ? 0.6 : 1 }}>
                <td>
                  <button
                    onClick={() => navigate(`/admin/registration/${r.id}`)}
                    title="View details"
                    style={{ width: "auto", padding: "4px 6px", background: "none", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
                  >
                    <EyeIcon />
                  </button>
                </td>
                <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                <td>{r.father_name}</td>
                <td>{r.course_name}</td>
                <td>{r.phone}</td>
                <td>{r.district}</td>
                <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{fmtDate(r.created_at)}</td>
                <td>
                  <StatusPill
                    closed={r.closed}
                    loading={togglingId === r.id}
                    onToggle={() => toggleRow(r.id, r.closed)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="adash-pagination">
          <button className="adash-page-btn" disabled={page === 0} onClick={() => onPage(page - 1)}>‹ Prev</button>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              className={`adash-page-btn ${i === page ? "adash-page-btn--active" : ""}`}
              onClick={() => onPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button className="adash-page-btn" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next ›</button>
        </div>
      )}
    </section>
  );
}

// ── Callbacks table ────────────────────────────────────────────────────────────
function CbTable() {
  const [rows,       setRows      ] = useState<Cb[]>([]);
  const [count,      setCount     ] = useState(0);
  const [page,       setPage      ] = useState(0);
  const [search,     setSearch    ] = useState("");
  const [showClosed, setShowClosed] = useState(true);
  const [loading,    setLoading   ] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchRows = useCallback(async (pg: number, q: string, closed: boolean) => {
    setLoading(true);
    let query = adminSupabase
      .from("callbacks")
      .select("id,created_at,name,phone,closed", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(pg * PAGE_SIZE, pg * PAGE_SIZE + PAGE_SIZE - 1);

    if (!closed) query = query.eq("closed", false);
    if (q.trim()) {
      const s = q.trim();
      query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%`);
    }

    const { data, count: total, error } = await query;
    if (!error) { setRows(data ?? []); setCount(total ?? 0); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(0, "", true); }, [fetchRows]);

  function onSearch(q: string) {
    setSearch(q);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchRows(0, q, showClosed), 500);
  }

  function onToggleClosed() {
    const next = !showClosed;
    setShowClosed(next);
    setPage(0);
    fetchRows(0, search, next);
  }

  function onPage(pg: number) {
    setPage(pg);
    fetchRows(pg, search, showClosed);
  }

  async function toggleRow(id: string, current: boolean) {
    setTogglingId(id);
    const { error } = await adminSupabase.from("callbacks").update({ closed: !current }).eq("id", id);
    if (!error) setRows(prev => prev.map(r => r.id === id ? { ...r, closed: !current } : r));
    setTogglingId(null);
  }

  const pages = Math.ceil(count / PAGE_SIZE);

  return (
    <section className="adash-table-section card">
      <div className="adash-table-header">
        <div>
          <h3 className="adash-table-title">Callback Requests</h3>
          <span className="adash-table-count">{count} total</span>
        </div>
        <div className="adash-table-controls">
          <input
            className="adash-search"
            placeholder="Search name, phone…"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          <button
            className={`adash-toggle ${!showClosed ? "adash-toggle--active" : ""}`}
            onClick={onToggleClosed}
          >
            {showClosed ? "Hide closed" : "Show closed"}
          </button>
          <button
            className="adash-refresh-btn"
            onClick={() => fetchRows(page, search, showClosed)}
            disabled={loading}
          >
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 480 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="adash-table-empty">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="adash-table-empty">No records found.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ opacity: r.closed ? 0.6 : 1 }}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{r.phone}</td>
                <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{fmtDate(r.created_at)}</td>
                <td>
                  <StatusPill
                    closed={r.closed}
                    loading={togglingId === r.id}
                    onToggle={() => toggleRow(r.id, r.closed)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="adash-pagination">
          <button className="adash-page-btn" disabled={page === 0} onClick={() => onPage(page - 1)}>‹ Prev</button>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              className={`adash-page-btn ${i === page ? "adash-page-btn--active" : ""}`}
              onClick={() => onPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button className="adash-page-btn" disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next ›</button>
        </div>
      )}
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { state, signIn, signOut } = useDashboardSession();

  if (state.status === "loading") {
    return (
      <div className="adash-gate">
        <div className="adash-gate-card" style={{ alignItems: "center" }}>
          <div className="auth-spinner" />
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 12 }}>Verifying…</p>
        </div>
      </div>
    );
  }

  if (state.status === "unauthenticated" || state.status === "error") {
    return (
      <GateForm
        signIn={signIn}
        prevError={state.status === "error" ? state.message : undefined}
      />
    );
  }

  // ── Authenticated ──
  return (
    <div className="admin-panel-main" style={{ maxWidth: 1200, padding: "0 4px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#94a3b8", marginRight: 10, alignSelf: "center" }}>
          {state.email} · session expires after 1 min idle
        </span>
        <button
          onClick={signOut}
          style={{ width: "auto", padding: "5px 14px", fontSize: 12, background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 8 }}
        >
          Clear session
        </button>
      </div>

      <StatsRow />

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
        <RegsTable />
        <CbTable />
      </div>
    </div>
  );
}
