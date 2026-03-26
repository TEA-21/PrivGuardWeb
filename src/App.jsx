import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import GalleryScreen from './pages/GalleryScreen';
import ScanAnalysisPage from './pages/ScanAnalysisPage';
import SocialScannerPage from './pages/SocialScannerPage';
import './App.css';

// ── Logo Icon ──────────────────────────────────────────────────────────────
const ShieldLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="topnav-logo-icon">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

// ── Nav link icons ─────────────────────────────────────────────────────────
const GalleryNavIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const SocialNavIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ── Nav items config ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/',               label: 'Gallery',        Icon: GalleryNavIcon },
  { path: '/social-scanner', label: 'Social Scanner', Icon: SocialNavIcon  },
];

// ── Top Navigation Bar ─────────────────────────────────────────────────────
function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        {/* Logo / Brand */}
        <button className="topnav-brand" onClick={() => navigate('/')}>
          <ShieldLogo />
          <span className="topnav-brand-text">PrivGuard</span>
        </button>

        {/* Nav Links */}
        <nav className="topnav-links">
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                className={`topnav-link${active ? ' active' : ''}`}
                onClick={() => navigate(path)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
function AppInner() {
  return (
    <div className="app-root">
      <TopNav />
      <main className="app-content">
        <Routes>
          <Route path="/"               element={<GalleryScreen />} />
          <Route path="/scan-analysis"  element={<ScanAnalysisPage />} />
          <Route path="/social-scanner" element={<SocialScannerPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        © 2024 PrivGuard — Your Privacy Guardian
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}