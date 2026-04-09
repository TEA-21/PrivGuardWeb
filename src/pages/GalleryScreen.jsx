import { useState, useRef, useCallback, useEffect } from 'react';
import {
  CloudUpload, Search, X, ArrowDownAZ, ArrowUpZA,
  Image as ImageIcon, Type, Lock, PenLine,
  ScanSearch, Trash2, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { encryptAndSaveItem, loadAllEncryptedItems, deleteEncryptedItem, clearAllEncryptedItems } from '../utils/cryptoStorage';
import { detectPII, scanImageWithML } from '../utils/piiDetector';
import './GalleryScreen.css';

// Aliased for drop-in compatibility with JSX below
const CloudUploadIcon = CloudUpload;
const SearchIcon     = Search;
const ClearIcon      = X;
const SortAscIcon    = ArrowDownAZ;
const SortDescIcon   = ArrowUpZA;
const GalleryEmptyIcon = ImageIcon;
const TextIcon       = Type;
const LockIcon       = Lock;
const TextPostIcon   = PenLine;
const CloseIcon      = X;
const ScanIcon       = ScanSearch;
const DeleteIcon     = Trash2;
const ShieldCheckIcon = ShieldCheck;
const WarningIcon    = AlertTriangle;

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
        <h1 className="gallery-title">Secure <span>Gallery</span></h1>
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
          <button className="header-action-btn" onClick={() => setTextPostDialog(true)}>
            <TextPostIcon /> <span>New Post</span>
          </button>
          <button className="header-action-btn danger" onClick={handleClearAll} title="Clear All Data">
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
              <div className="modal-content-right" style={{background: '#f8fafc', padding: 20, borderLeft: '1px solid #e2e8f0', minWidth: 550, overflowY: 'auto'}}>
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
                              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                                  {/* Left Container: Detected Entities */}
                                  <div className="ss-pii-list" style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8}}>
                                      
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

                                  {/* Right Container: Suggestions Table */}
                                  {scanResults.suggestions && scanResults.suggestions.length > 0 && (
                                      <div className="suggestions-section" style={{ flex: 1.2 }}>
                                          <h4 style={{ marginTop: 0, marginBottom: 12, color: '#334155', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommendations</h4>
                                          <table className="suggestions-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left', background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                              <thead style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                                                  <tr>
                                                      <th style={{ padding: '8px 12px', width: '30px', fontWeight: 600 }}>#</th>
                                                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Action</th>
                                                  </tr>
                                              </thead>
                                              <tbody>
                                                  {scanResults.suggestions.map((s, i) => (
                                                      <tr key={i} style={{ borderBottom: i !== scanResults.suggestions.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                                          <td style={{ padding: '10px 12px', color: '#64748b', verticalAlign: 'top', fontWeight: 500 }}>{i + 1}</td>
                                                          <td style={{ padding: '10px 12px', color: '#334155', lineHeight: 1.5, verticalAlign: 'top' }}>{s}</td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  )}
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