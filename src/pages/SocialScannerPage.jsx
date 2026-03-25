import './PlaceholderPage.css';

function SocialScannerPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0c7ff2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>
      <h1 className="placeholder-title">Social Scanner</h1>
      <p className="placeholder-description">
        Scan your social media profiles for potential privacy risks and data exposure.
      </p>
    </div>
  );
}

export default SocialScannerPage;
