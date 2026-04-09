import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Image as ImageIcon, ScanSearch, BarChart3, ShieldCheck } from 'lucide-react';
import GalleryScreen from './pages/GalleryScreen';
import ScanAnalysisPage from './pages/ScanAnalysisPage';
import SocialScannerPage from './pages/SocialScannerPage';
import './App.css';

// ── Nav items config ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/',               label: 'Gallery',        Icon: ImageIcon   },
  { path: '/social-scanner', label: 'Social Scanner', Icon: ScanSearch  },
  { path: '/scan-analysis',  label: 'Scan Analysis',  Icon: BarChart3   },
];

// ── Top Navigation Bar (desktop) ────────────────────────────────────────────
function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="topnav" role="banner">
      <div className="topnav-inner">
        {/* Logo / Brand */}
        <button className="topnav-brand" onClick={() => navigate('/')} aria-label="Go to Gallery">
          <Shield className="topnav-logo-icon" />
          <span className="topnav-brand-text">PrivGuard</span>
        </button>

        {/* Nav Links */}
        <nav className="topnav-links" aria-label="Main navigation">
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const active = location.pathname === path ||
              (path === '/' && location.pathname === '/');
            return (
              <button
                key={path}
                id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`topnav-link${active ? ' active' : ''}`}
                onClick={() => navigate(path)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Security Status Badge */}
        <div className="topnav-security-badge" aria-label="Security status: Protected">
          <ShieldCheck aria-hidden="true" />
          Protected
        </div>
      </div>
    </header>
  );
}

// ── Bottom Navigation Bar (mobile) ──────────────────────────────────────────
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              id={`bottom-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`bottom-nav-item${active ? ' active' : ''}`}
              onClick={() => navigate(path)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Root App ────────────────────────────────────────────────────────────────
function AppInner() {
  return (
    <div className="app-root">
      <TopNav />
      <main className="app-content" id="main-content">
        <Routes>
          <Route path="/"               element={<GalleryScreen />} />
          <Route path="/scan-analysis"  element={<ScanAnalysisPage />} />
          <Route path="/social-scanner" element={<SocialScannerPage />} />
        </Routes>
      </main>
      <BottomNav />
      <footer className="app-footer">
        © 2026 PrivGuard — Your Privacy Guardian · All data stays on your device
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