import { useState, useRef, useCallback, useEffect } from 'react';

import { encryptAndSaveItem, loadAllEncryptedItems, deleteEncryptedItem, clearAllEncryptedItems } from '../utils/cryptoStorage';
import { detectPII, scanImageWithML } from '../utils/piiDetector';
import './GalleryScreen.css';

// --- SVG ICON COMPONENTS ---
const CloudUploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" /><path d="m16 16-4-4-4 4" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const ClearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SortAscIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10" /><path d="M11 9h7" /><path d="M11 13h4" /><path d="M3 17l3 3 3-3" /><path d="M6 18V4" />
  </svg>
);
const SortDescIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h4" /><path d="M11 9h7" /><path d="M11 13h10" /><path d="M3 17l3 3 3-3" /><path d="M6 18V4" />
  </svg>
);
const GalleryEmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const TextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const TextPostIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);
const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// ─── Inline PII Highlight Overlay ──────────────────────────────────────────
export function PiiHighlightOverlay({ text, entities }) {
  if (!text || !entities || !entities.length) return <span>{text}</span>;

  const sorted = [...entities]
    .filter(e => e.index != null)
    .sort((a, b) => a.index - b.index);

  const parts = [];
  let lastIdx = 0;

  for (let i = 0; i < sorted.length; i++) {
    const entity = sorted[i];
    if (!entity) continue;
    let start = parseInt(entity.index, 10);
    if (isNaN(start)) continue;
    const len = entity.value ? entity.value.length : (entity.masked ? entity.masked.length : 0);
    if (len === 0) continue;
    
    let end = start + len;
    // Adjust start index to render consecutive/overlapping highlights properly 
    if (start < lastIdx) {
      start = lastIdx;
    }
    if (start >= end) continue; // Skip if fully overlapped

    if (start > lastIdx) {
      parts.push(<span key={`t-${lastIdx}-${start}`} className="pii-overlay-plain">{text.slice(lastIdx, start)}</span>);
    }

    parts.push(
      <span key={`m-${start}-${end}-${i}`} className="pii-overlay-match" title={`${entity.type} [${entity.source || 'regex'}]`}>
        <span className={`pii-overlay-text risk-${entity.risk || 'low'}`}>{text.slice(start, end)}</span>
      </span>
    );
    lastIdx = end;
  }

  if (lastIdx < text.length) {
    parts.push(<span key={`t-${lastIdx}`} className="pii-overlay-plain">{text.slice(lastIdx)}</span>);
  }

  return <div className="pii-overlay-container">{parts}</div>;
}

function getRiskColor(score) {
  if (score >= 80) return '#DC2626';
  if (score >= 60) return '#EF4444';
  if (score >= 40) return '#F59E0B';
  if (score >= 20) return '#10B981';
  return '#059669';
}

function GalleryScreen() {

  const fileInputRef = useRef(null);
  const textPostRef = useRef(null);

  const [mediaItems, setMediaItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [isScanningPII, setIsScanningPII] = useState(false);
  const [sheetItem, setSheetItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [textPostDialog, setTextPostDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load encrypted items on mount
  useEffect(() => {
    loadAllEncryptedItems().then(items => {
      setMediaItems(items || []);
    });
  }, []);

  // Toast Helper
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- File input handler (IMAGE UPLOAD) ---
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Convert each file to a dataURL using a Promise wrapper
    const filePromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          resolve({
            id: Date.now() + Math.random(),
            type: 'image',
            title: file.name,
            fileName: file.name,
            dataUrl: ev.target.result,
            caption: '',
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const newItems = await Promise.all(filePromises);
      for (const item of newItems) {
        await encryptAndSaveItem(item.id, item);
      }
      setMediaItems((prev) => [...prev, ...newItems]);
      showToast(`Added ${files.length} image${files.length > 1 ? 's' : ''}`);
    } catch (err) {
      showToast("Error uploading image");
      console.error(err);
    }

    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  // --- Filtering and Sorting ---
  const displayItems = [...mediaItems]
    .filter((it) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (it.caption || '').toLowerCase().includes(q) ||
        (it.title || '').toLowerCase().includes(q) ||
        (it.text || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aKey = (a.caption || a.title || '').toLowerCase();
      const bKey = (b.caption || b.title || '').toLowerCase();
      return sortAscending ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
    });

  // --- Drag & Drop ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleFileSelect({ target: { files: e.dataTransfer.files, value: '' } });
    }
  };

  // --- Upload/Post actions ---
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const submitTextPost = async () => {
    const text = textPostRef.current?.value?.trim();
    if (!text) {
      showToast('Please enter some text');
      return;
    }
    const newPost = {
      id: Date.now(),
      type: 'text',
      title: text.length > 20 ? text.substring(0, 20) + '...' : text,
      text,
    };
    await encryptAndSaveItem(newPost.id, newPost);
    setMediaItems((prev) => [...prev, newPost]);
    setTextPostDialog(false);
    showToast('Text post created');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all app data? This cannot be undone.')) {
      clearAllEncryptedItems();
      setMediaItems([]);
      showToast('All app data cleared');
    }
  };

  // --- CRUD Handlers ---
  const handleDelete = (item) => {
    if (window.confirm(`Delete "${item.title}"?`)) {
      deleteEncryptedItem(item.id);
      setMediaItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedItem(null);
      setSheetItem(null);
      showToast('Item deleted');
    }
  };



  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setSheetItem(null);
    setScanResults(null);
    
    setIsScanningPII(true);

    if (item.type === 'image') {
      try {
        // Convert the dataURL back into a Native Byte Blob to upload natively to Python
        // Manually decode Base64 to guarantee a pure binary Blob instead of relying on fetch()
        const dataUrlParts = item.dataUrl.split(',');
        const byteString = atob(dataUrlParts[1]);
        const mimeString = dataUrlParts[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        
        // Scan with Local Machine Learning Backend over Port 8000
        const results = await scanImageWithML(blob);
        setScanResults(results);
      } catch (e) {
        console.error("Local ML Backend Error", e);
        setScanResults({ entities: [], riskScore: 0, riskLevel: 'Clean', suggestions: ['Local ML Backend connection failed.'] });
      }
    } else {
      const textToScan = item.text || '';
      if (!textToScan.trim()) {
        setScanResults({ entities: [], riskScore: 0, riskLevel: 'Clean', suggestions: [] });
      } else {
        const results = await detectPII(textToScan);
        setScanResults(results);
      }
    }

    setIsScanningPII(false);
  };

  return (
    <div className="gallery-screen">
      {/* Header row: title + search + actions */}
      <div className="gallery-header">
        <h1 className="gallery-title">Gallery</h1>
        <div className="gallery-toolbar">
          <div className="gallery-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <ClearIcon />
              </button>
            )}
          </div>
          <button className="sort-btn" onClick={() => setSortAscending(!sortAscending)} title={sortAscending ? 'Sort Z→A' : 'Sort A→Z'}>
            {sortAscending ? <SortAscIcon /> : <SortDescIcon />}
          </button>
          <button className="header-action-btn secondary" onClick={() => setTextPostDialog(true)} style={{ marginLeft: 8 }}>
            <TextPostIcon /> <span>New Post</span>
          </button>
          <button className="header-action-btn" onClick={handleClearAll} style={{ marginLeft: 8, background: '#FEF2F2', color: '#EF4444', borderColor: '#FCA5A5' }} title="Clear All Data">
            <DeleteIcon />
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={`drop-zone${dragActive ? ' active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <CloudUploadIcon />
        <p className="drop-zone-title">Drop images here or click to browse</p>
        <p className="drop-zone-sub">Supports PNG, JPG, GIF — multiple files allowed</p>
      </div>

      {/* Main Grid */}
      <div className="gallery-grid-container">
        {displayItems.length === 0 ? (
          <div className="gallery-empty">
            <GalleryEmptyIcon />
            <h3>{searchQuery ? 'No matches found' : 'Gallery is empty'}</h3>
            <p>Upload a photo or write a post to start scanning.</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="gallery-item"
                onClick={() => handleItemClick(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSheetItem(item);
                }}
              >
                {item.type === 'image' ? (
                  <>
                    <img src={item.dataUrl} alt={item.title} />
                    {item.caption && <div className="item-caption-overlay">{item.caption}</div>}
                  </>
                ) : (
                  <div className="text-post-card">
                    <div className="text-post-icons">
                      <TextIcon />
                      <LockIcon style={{ color: '#10b981' }} />
                    </div>
                    <p className="text-post-content">{item.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Hidden file input */}

      {/* Full Preview Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {selectedItem.type === 'text' ? <TextIcon /> : <ImageIcon />}
              <span className="modal-header-title">{selectedItem.title}</span>
              <button className="modal-close-btn" onClick={() => setSelectedItem(null)}><CloseIcon /></button>
            </div>
            
            <div className="modal-body split-view">
              {/* Left side: Actual content */}
              <div className="modal-content-left">
                  {selectedItem.type === 'text' ? (
                    <div className="text-content-box" style={{height: '100%', overflowY: 'auto'}}>
                        {isScanningPII || !scanResults ? selectedItem.text : (
                            <PiiHighlightOverlay text={selectedItem.text} entities={scanResults.entities} />
                        )}
                    </div>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                        <img src={selectedItem.dataUrl} alt={selectedItem.title} className="modal-img-preview" style={{objectFit: 'contain', maxHeight: '60vh'}} />
                        {selectedItem.caption && (
                            <div className="caption-box" style={{marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8}}>
                                {isScanningPII || !scanResults ? selectedItem.caption : (
                                    <PiiHighlightOverlay text={selectedItem.caption} entities={scanResults.entities} />
                                )}
                            </div>
                        )}
                    </div>
                  )}
              </div>

              {/* Right side: Scan Results */}
              <div className="modal-content-right" style={{background: '#f8fafc', padding: 20, borderLeft: '1px solid #e2e8f0', minWidth: 350, overflowY: 'auto'}}>
                  <h3 style={{marginTop: 0, marginBottom: 16}}>Privacy Risk Scan</h3>
                  {isScanningPII ? (
                      <div className="scan-loading" style={{display: 'flex', alignItems: 'center', gap: 10, color: '#64748b'}}>
                          <span className="ss-btn-spinner" style={{ borderColor: 'rgba(12, 127, 242, 0.2)', borderTopColor: '#0C7FF2', width: 20, height: 20, borderWidth: 3 }} />
                          <p>Scanning (Regex + AI)...</p>
                      </div>
                  ) : scanResults ? (
                      <div className="scan-results-panel">
                          <div className="ss-risk-badge" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, borderLeft: `4px solid ${getRiskColor(scanResults.riskScore)}`, marginBottom: 16 }}>
                              <div className="ss-risk-score-circle" style={{ background: getRiskColor(scanResults.riskScore), width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                                {scanResults.riskScore}
                              </div>
                              <div className="ss-risk-info" style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="ss-risk-level" style={{ color: getRiskColor(scanResults.riskScore), fontWeight: 'bold' }}>
                                  {scanResults.riskLevel} Risk
                                </span>
                                <span className="ss-risk-count" style={{ fontSize: 13, color: '#64748b' }}>
                                  {scanResults.entities.length} item{scanResults.entities.length !== 1 ? 's' : ''} detected
                                </span>
                              </div>
                          </div>

                          {(scanResults.entities && scanResults.entities.length > 0) || scanResults.facesDetected > 0 ? (
                              <div className="ss-pii-list" style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                                  
                                  {/* Face Component Warning Output */}
                                  {scanResults.facesDetected > 0 && (
                                    <div className="face-warning" style={{background: '#fff0f2', border: '1px solid #ffe4e6', padding: 12, borderRadius: 8, color: '#e11d48', display: 'flex', alignItems: 'center', gap: 8}}>
                                        <WarningIcon />
                                        <strong style={{fontSize: 13}}>Warning: {scanResults.facesDetected} Human Face(s) natively mapped in image payload.</strong>
                                    </div>
                                  )}

                                  {scanResults.entities.map((entity, i) => (
                                      <div className="ss-pii-card" key={i} style={{background: '#fff', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8}}>
                                          <div className="ss-pii-body" style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="ss-pii-type" style={{fontWeight: 700, fontSize: 12, color: '#dc2626', textTransform: 'uppercase'}}>{entity.type}</span>
                                                <span className={`source-tag`} style={{fontSize: 10, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', color: '#475569'}}>[{entity.source}]</span>
                                            </div>
                                            <code className="ss-pii-masked" style={{background: '#f1f5f9', padding: '2px 4px', borderRadius: 4, fontSize: 13}}>{entity.masked || entity.value}</code>
                                            {entity.reason && <p className="entity-reason" style={{margin: 0, marginTop: 4, fontSize: 12, color: '#64748b'}}>{entity.reason}</p>}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="ss-safe-card" style={{display: 'flex', alignItems: 'center', gap: 14, padding: 20, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 14, color: '#065f46'}}>
                                <ShieldCheckIcon />
                                <div>
                                  <strong style={{display: 'block', fontSize: 16}}>✓ Clean</strong>
                                  <p style={{margin: 0, fontSize: 13}}>No privacy risks detected.</p>
                                </div>
                              </div>
                          )}
                      </div>
                  ) : null}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Options Bottom Sheet */}
      {sheetItem && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setSheetItem(null)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <button className="sheet-option" onClick={() => { handleItemClick(sheetItem); setSheetItem(null); }}>
              <ScanIcon style={{ color: '#0c7ff2' }} />
              <div><h4>Scan</h4><p>Analyze for privacy leaks</p></div>
            </button>
            <button className="sheet-option danger" onClick={() => handleDelete(sheetItem)}>
              <DeleteIcon />
              <div><h4>Delete</h4><p>Remove permanently</p></div>
            </button>
          </div>
        </>
      )}

      {/* Text Post Dialog */}
      {textPostDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>New Text Post</h3>
            <textarea ref={textPostRef} placeholder="Paste or type content here..." rows={5} autoFocus />
            <div className="dialog-actions">
              <button className="btn-cancel" onClick={() => setTextPostDialog(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitTextPost}>Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default GalleryScreen;