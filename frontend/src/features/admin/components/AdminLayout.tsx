import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import logo from "../../../assets/defaults/website_logo.png";
import { useAdminAuth } from "../hooks/useAdminAuth";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `lp-admin-nav-link${isActive ? " lp-admin-nav-link--active" : ""}`;
}

export default function AdminLayout() {
  const { auth, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const email = auth.status === "authenticated" ? auth.email : "";

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((o) => !o);

  return (
    <div className={`lp-admin-shell${sidebarOpen ? " lp-admin-shell--sidebar-open" : ""}`}>
      <div
        className={`lp-admin-backdrop${sidebarOpen ? " lp-admin-backdrop--open" : ""}`}
        aria-hidden={!sidebarOpen}
        onClick={closeSidebar}
      />
      <aside className={`lp-admin-sidebar${sidebarOpen ? " lp-admin-sidebar--open" : ""}`}>
        <div className="lp-admin-sidebar-head">
          <Link to="/" className="lp-admin-sidebar-brand" onClick={closeSidebar}>
            <img src={logo} alt="" className="lp-admin-sidebar-logo" />
            <div>
              <div className="lp-admin-sidebar-name">Learning Hub</div>
              <div className="lp-admin-sidebar-sub">Admin Portal</div>
            </div>
          </Link>
          <button
            type="button"
            className="lp-admin-sidebar-close"
            aria-label="Close menu"
            onClick={closeSidebar}
          >
            ×
          </button>
        </div>
        <nav className="lp-admin-sidebar-nav" onClick={closeSidebar}>
          <NavLink to="/admin" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/editor" className={navLinkClass}>
            Homepage Editor
          </NavLink>
        </nav>
        <div className="lp-admin-sidebar-footer">
          <p className="lp-admin-sidebar-email" title={email}>{email}</p>
          <button type="button" className="lp-admin-sidebar-logout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="lp-admin-column">
        <header className="lp-admin-top-strip">
          <button
            type="button"
            className="lp-mobile-menu-btn"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
            onClick={toggleSidebar}
          >
            <span />
            <span />
            <span />
          </button>
          <span className="lp-admin-top-strip-title">Admin Portal</span>
        </header>
        <main className="lp-admin-outlet">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
