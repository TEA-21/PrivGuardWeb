import './PlaceholderPage.css';

function GalleryPage() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0c7ff2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <h1 className="placeholder-title">Gallery</h1>
      <p className="placeholder-description">
        Browse and manage your media library. Scan images for privacy-sensitive content.
      </p>
    </div>
  );
}

export default GalleryPage;
