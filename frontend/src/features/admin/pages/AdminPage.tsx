import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabase";
import { useAdminAuth } from "../hooks/useAdminAuth";

const IMAGE_KEYS = [
  { value: "hero_banner", label: "Hero Banner" },
  { value: "about_image", label: "About Image" },
  { value: "gallery_1",   label: "Gallery Image 1" },
  { value: "gallery_2",   label: "Gallery Image 2" },
];

type Registration = {
  id: string;
  created_at: string;
  student_name: string;
  father_name: string;
  phone: string;
  email: string;
  course_name: string;
  district: string;
  gender: string;
  closed: boolean;
};

export default function AdminPage() {
  const { auth } = useAdminAuth();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs]     = useState(false);
  const [togglingId, setTogglingId]       = useState<string | null>(null);
  const [filter, setFilter]               = useState<"all" | "open" | "closed">("all");
  const [search, setSearch]               = useState("");
  const [status, setStatus]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [previewUrl, setPreviewUrl]       = useState("");
  const [uploadedUrl, setUploadedUrl]     = useState("");

  useEffect(() => {
    if (auth.status === "authenticated") fetchRegistrations();
  }, [auth.status]);

  function showStatus(msg: string, ok: boolean) {
    setStatus({ msg, ok });
    setTimeout(() => setStatus(null), 4000);
  }

  async function fetchRegistrations() {
    setLoadingRegs(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, created_at, student_name, father_name, phone, email, course_name, district, gender, closed")
      .order("created_at", { ascending: false });
    if (error) showStatus("Failed to load registrations.", false);
    else setRegistrations(data ?? []);
    setLoadingRegs(false);
  }

  async function toggleClosed(id: string, current: boolean) {
    setTogglingId(id);
    const { error } = await supabase
      .from("registrations")
      .update({ closed: !current })
      .eq("id", id);
    if (error) showStatus("Failed to update status.", false);
    else setRegistrations(prev => prev.map(r => r.id === id ? { ...r, closed: !current } : r));
    setTogglingId(null);
  }

  const filtered = registrations.filter(r => {
    const matchFilter =
      filter === "all" ? true :
      filter === "open" ? !r.closed :
      r.closed;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.student_name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.course_name.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <main className="container admin-panel-main">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#003087" }}>Admin Panel</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Upload assets, landing copy, and registrations.</p>
      </div>

      {status && (
        <p className={`admin-status ${status.ok ? "admin-status--ok" : "admin-status--err"}`}>
          {status.msg}
        </p>
      )}

      <div className="admin-grid">
        {/* ── Image Upload ── */}
        <section className="card">
          <h2 style={{ marginBottom: 4 }}>Upload Landing Image</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Select which image to replace, then upload a file.</p>
          <form className="form" onSubmit={async e => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const file = fd.get("image") as File;
            const key  = fd.get("key_name") as string;
            if (!file) return;
            showStatus("Uploading…", true);
            const ext  = file.name.split(".").pop();
            const path = `uploads/${key}-${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
            if (error) { showStatus("Upload failed: " + error.message, false); return; }
            const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
            setUploadedUrl(data.publicUrl);
            showStatus("Uploaded successfully", true);
          }}>
            <select name="key_name" required>
              {IMAGE_KEYS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
            <input name="image" type="file" accept="image/*" required
              onChange={e => { const f = e.target.files?.[0]; if (f) setPreviewUrl(URL.createObjectURL(f)); }} />
            {previewUrl && <img src={previewUrl} alt="Preview" className="admin-img-preview" />}
            <button type="submit">Upload Image</button>
          </form>
          {uploadedUrl && (
            <div style={{ marginTop: 12 }}>
              <img src={uploadedUrl} alt="Uploaded" className="admin-img-preview" />
              <p style={{ fontSize: 11, color: "#9ca3af", wordBreak: "break-all", marginTop: 4 }}>{uploadedUrl}</p>
            </div>
          )}
        </section>

        {/* ── Text Content ── */}
        <section className="card">
          <h2 style={{ marginBottom: 4 }}>Manage Landing Text</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Leave blank to keep existing values.</p>
          <form className="form" onSubmit={e => { e.preventDefault(); showStatus("Saved (connect to DB when ready)", true); }}>
            <input name="hero_title"    placeholder="Hero title" />
            <input name="hero_subtitle" placeholder="Hero subtitle" />
            <textarea name="about_text"    placeholder="About section text" />
            <textarea name="services_text" placeholder="Features / services description" />
            <textarea name="contact_text"  placeholder="Footer / contact line" />
            <button type="submit">Save Content</button>
          </form>
        </section>
      </div>

      {/* ── Registrations Table ── */}
      <section className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h2>Registrations
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
              {filtered.length} of {registrations.length}
            </span>
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Search name, phone, email, course…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, width: 240 }}
            />
            {(["all", "open", "closed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                width: "auto", padding: "7px 16px", fontSize: 13, fontWeight: 600,
                background: filter === f ? "#0f9f84" : "#f3f4f6",
                color: filter === f ? "#fff" : "#374151",
                border: "none", borderRadius: 8,
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button onClick={fetchRegistrations} style={{ width: "auto", padding: "7px 16px", fontSize: 13 }}>
              {loadingRegs ? "Loading…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {loadingRegs ? (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading registrations…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>No registrations found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Father</th>
                  <th>Course</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>District</th>
                  <th>Gender</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ opacity: r.closed ? 0.55 : 1 }}>
                    <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                    <td>{r.father_name}</td>
                    <td>{r.course_name}</td>
                    <td>{r.phone}</td>
                    <td>{r.email}</td>
                    <td>{r.district}</td>
                    <td>{r.gender}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <button
                        disabled={togglingId === r.id}
                        onClick={() => toggleClosed(r.id, r.closed)}
                        style={{
                          width: "auto", padding: "4px 12px", fontSize: 12, fontWeight: 700,
                          borderRadius: 999, border: "none", cursor: "pointer",
                          background: r.closed ? "#d1fae5" : "#fee2e2",
                          color:      r.closed ? "#065f46" : "#991b1b",
                        }}
                      >
                        {togglingId === r.id ? "…" : r.closed ? "Closed" : "Open"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
