import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainNavigation from './components/MainNavigation';
import GalleryScreen from './pages/GalleryScreen';
import SocialScannerPage from './pages/SocialScannerPage';
import ScanAnalysisPage from './pages/ScanAnalysisPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainNavigation />}>
          <Route path="/gallery" element={<GalleryScreen />} />
          <Route path="/social-scanner" element={<SocialScannerPage />} />
          <Route path="/scan-analysis" element={<ScanAnalysisPage />} />
          <Route path="*" element={<Navigate to="/gallery" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
