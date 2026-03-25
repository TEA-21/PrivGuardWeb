import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import GalleryScreen from './pages/GalleryScreen';
import ScanAnalysisPage from './pages/ScanAnalysisPage';
import SocialScannerPage from './pages/SocialScannerPage';
import './App.css';

// ── Bottom Nav Icons ───────────────────────────────────────────────────────
const GalleryNavIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const ScanNavIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);
const SocialNavIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ── Nav items config ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/',              label: 'Gallery',        Icon: GalleryNavIcon },
  { path: '/scan-analysis', label: 'Scan Analysis',  Icon: ScanNavIcon    },
  { path: '/social-scanner',label: 'Social Scanner', Icon: SocialNavIcon  },
];

// ── Bottom Nav Bar ─────────────────────────────────────────────────────────
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on the scan-analysis page (it's a detail screen)
  if (location.pathname === '/scan-analysis') return null;

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, label, Icon }) => {
        // For scan-analysis we skip it from nav since it's a detail page
        if (path === '/scan-analysis') return null;
        const active = location.pathname === path;
        return (
          <button
            key={path}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
          >
            <span className="bottom-nav-icon">
              <Icon active={active} />
            </span>
            <span className="bottom-nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
function AppInner() {
  return (
    <div className="app-root">
      <div className="app-content">
        <Routes>
          <Route path="/"               element={<GalleryScreen />} />
          <Route path="/scan-analysis"  element={<ScanAnalysisPage />} />
          <Route path="/social-scanner" element={<SocialScannerPage />} />
        </Routes>
      </div>
      <BottomNav />
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