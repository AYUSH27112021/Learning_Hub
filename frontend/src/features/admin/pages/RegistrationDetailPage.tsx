import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminSupabase } from "../../../shared/lib/adminSupabase";
import { useDashboardSession } from "../hooks/useDashboardSession";

type Registration = {
  id: string;
  created_at: string;
  course_name: string;
  student_name: string;
  father_name: string;
  mother_name: string;
  birth_date: string;
  gender: string;
  full_address: string;
  district: string;
  pincode: string;
  religion: string | null;
  nationality: string;
  phone: string;
  email: string | null;
  blood_group: string;
  occupation: string | null;
  marital_status: string | null;
  closed: boolean;
  notes: string;
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="reg-detail-field">
      <span className="reg-detail-label">{label}</span>
      <span className="reg-detail-value">{value || "—"}</span>
    </div>
  );
}

export default function RegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, signOut } = useDashboardSession();

  const [reg,           setReg          ] = useState<Registration | null>(null);
  const [fetchError,    setFetchError   ] = useState("");
  const [notes,         setNotes        ] = useState("");
  const [notesSaving,   setNotesSaving  ] = useState(false);
  const [notesSaved,    setNotesSaved   ] = useState(false);
  const [togglingClose, setTogglingClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting     ] = useState(false);

  // Redirect to dashboard if session expired
  useEffect(() => {
    if (state.status === "unauthenticated") navigate("/admin", { replace: true });
  }, [state.status, navigate]);

  useEffect(() => {
    if (state.status !== "authenticated" || !id) return;
    adminSupabase
      .from("registrations")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setFetchError("Registration not found."); return; }
        setReg(data as Registration);
        setNotes(data.notes ?? "");
      });
  }, [state.status, id]);

  async function saveNotes(e: FormEvent) {
    e.preventDefault();
    if (!reg) return;
    setNotesSaving(true);
    const { error } = await adminSupabase.from("registrations").update({ notes }).eq("id", reg.id);
    setNotesSaving(false);
    if (!error) { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2500); }
  }

  async function deleteReg() {
    if (!reg) return;
    setDeleting(true);
    const { error } = await adminSupabase.from("registrations").delete().eq("id", reg.id);
    setDeleting(false);
    if (!error) navigate("/admin", { replace: true });
  }

  async function toggleClosed() {
    if (!reg) return;
    setTogglingClose(true);
    const { error } = await adminSupabase.from("registrations").update({ closed: !reg.closed }).eq("id", reg.id);
    if (!error) setReg(r => r ? { ...r, closed: !r.closed } : r);
    setTogglingClose(false);
  }

  if (state.status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <div className="auth-spinner" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: 32 }}>
        <button onClick={() => navigate("/admin")} className="reg-detail-back">← Back</button>
        <p style={{ color: "#991b1b", marginTop: 16 }}>{fetchError}</p>
      </div>
    );
  }

  if (!reg) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <div className="auth-spinner" />
      </div>
    );
  }

  return (
    <div className="reg-detail-page">
      {/* ── Header ── */}
      <div className="reg-detail-header">
        <button onClick={() => navigate("/admin")} className="reg-detail-back">← Back to Dashboard</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {state.status === "authenticated" ? state.email : ""}
          </span>
          <button
            onClick={signOut}
            style={{ width: "auto", padding: "4px 12px", fontSize: 12, background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 7, cursor: "pointer" }}
          >
            Clear session
          </button>
        </div>
      </div>

      {/* ── Title row ── */}
      <div className="reg-detail-title-row">
        <div>
          <h1 className="reg-detail-title">{reg.student_name}</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{reg.course_name} · Submitted {new Date(reg.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={toggleClosed}
            disabled={togglingClose}
            style={{
              width: "auto", padding: "8px 20px", fontSize: 13, fontWeight: 700,
              borderRadius: 999, border: "none", cursor: togglingClose ? "default" : "pointer",
              background: reg.closed ? "#d1fae5" : "#fee2e2",
              color:      reg.closed ? "#065f46" : "#991b1b",
            }}
          >
            {togglingClose ? "…" : reg.closed ? "Mark as Open" : "Mark as Closed"}
          </button>

          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "6px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>Delete this registration?</span>
              <button
                onClick={deleteReg}
                disabled={deleting}
                style={{ width: "auto", padding: "5px 14px", fontSize: 12, fontWeight: 700, background: "#dc2626", color: "#fff", border: "none", borderRadius: 7, cursor: deleting ? "default" : "pointer" }}
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ width: "auto", padding: "5px 12px", fontSize: 12, fontWeight: 600, background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 7, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ width: "auto", padding: "8px 18px", fontSize: 13, fontWeight: 700, background: "#fff", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: 999, cursor: "pointer" }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Details card ── */}
      <section className="card reg-detail-card">
        <h2 className="reg-detail-section-title">Registration Details</h2>
        <div className="reg-detail-grid">
          <Field label="Course"         value={reg.course_name} />
          <Field label="Student Name"   value={reg.student_name} />
          <Field label="Father's Name"  value={reg.father_name} />
          <Field label="Mother's Name"  value={reg.mother_name} />
          <Field label="Date of Birth"  value={reg.birth_date} />
          <Field label="Gender"         value={reg.gender} />
          <Field label="Phone"          value={reg.phone} />
          <Field label="Email"          value={reg.email} />
          <Field label="Blood Group"    value={reg.blood_group} />
          <Field label="Nationality"    value={reg.nationality} />
          <Field label="Religion"       value={reg.religion} />
          <Field label="Marital Status" value={reg.marital_status} />
          <Field label="Occupation"     value={reg.occupation} />
          <Field label="District"       value={reg.district} />
          <Field label="Pincode"        value={reg.pincode} />
          <div className="reg-detail-field reg-detail-field--full">
            <span className="reg-detail-label">Full Address</span>
            <span className="reg-detail-value">{reg.full_address}</span>
          </div>
        </div>
      </section>

      {/* ── Notes card ── */}
      <section className="card reg-detail-card">
        <h2 className="reg-detail-section-title">Admin Notes</h2>
        <form onSubmit={saveNotes} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add internal notes about this registration…"
            rows={5}
            style={{ resize: "vertical", fontSize: 14, padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="submit"
              disabled={notesSaving}
              className="lp-callback-submit"
              style={{ maxWidth: 160 }}
            >
              {notesSaving ? "Saving…" : "Save Notes"}
            </button>
            {notesSaved && <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </form>
      </section>
    </div>
  );
}
