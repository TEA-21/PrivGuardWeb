import { NavLink, Outlet } from "react-router-dom";
import "./MainNavigation.css";

function MainNavigation() {
  return (
    <div className="main-layout">
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <div className="footer">© 2024 PrivGuard - Your Privacy Guardian</div>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <NavLink
          to="/gallery"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="nav-label">Gallery</span>
        </NavLink>

        <NavLink
          to="/social-scanner"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <span className="nav-label">Scan Socials</span>
        </NavLink>

        <NavLink
          to="/scan-analysis"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <svg
            className="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className="nav-label">Scan Analysis</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default MainNavigation;
