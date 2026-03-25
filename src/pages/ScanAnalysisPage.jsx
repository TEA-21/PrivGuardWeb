import './PlaceholderPage.css';

function ScanAnalysisPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0c7ff2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </div>
      <h1 className="placeholder-title">Scan Analysis</h1>
      <p className="placeholder-description">
        View detailed analysis reports of your privacy scans and track improvements over time.
      </p>
    </div>
  );
}

export default ScanAnalysisPage;
