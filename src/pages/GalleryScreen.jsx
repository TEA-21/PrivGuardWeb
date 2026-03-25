import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryScreen.css';

// SVG icon components
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
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

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TextPostIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const NoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
);

// Default items mimicking the Flutter app's initial data
const DEFAULT_ITEMS = [
  {
    id: 1,
    type: 'text',
    title: 'Welcome Post',
    text: 'Welcome to PrivGuard! Contact us at support@privguard.com or call (555) 123-4567.',
  },
  {
    id: 5,
    type: 'text',
    title: 'Test Data',
    text: 'My email is john.doe@example.com and my phone is +1-555-987-6543. I live at 123 Main Street.',
  },
];

function GalleryScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [mediaItems, setMediaItems] = useState(DEFAULT_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sheetItem, setSheetItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [captionDialog, setCaptionDialog] = useState(null); // { resolve, initial, title }
  const [textPostDialog, setTextPostDialog] = useState(false);
  const textPostRef = useRef(null);

  // Derived display items: filtered + sorted
  const displayItems = getDisplayItems(mediaItems, searchQuery, sortAscending);

  function getDisplayItems(items, query, asc) {
    let filtered = [...items];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter((it) => {
        const caption = (it.caption || '').toLowerCase();
        const title = (it.title || '').toLowerCase();
        const text = (it.text || '').toLowerCase();
        return caption.includes(q) || title.includes(q) || text.includes(q);
      });
    }
    filtered.sort((a, b) => {
      const aKey = (a.caption || a.title || '').toLowerCase();
      const bKey = (b.caption || b.title || '').toLowerCase();
      return asc ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
    });
    return filtered;
  }

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- File input handler ---
  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newItems = [];
    let loaded = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newItems.push({
          id: Date.now() + loaded,
          type: 'image',
          title: file.name,
          fileName: file.name,
          dataUrl: ev.target.result,
          caption: '',
        });
        loaded++;
        if (loaded === files.length) {
          setMediaItems((prev) => [...prev, ...newItems]);
          showToast(`Added ${files.length} image${files.length > 1 ? 's' : ''}`);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }

  // --- FAB actions ---
  function handleUploadClick() {
    setShowAddOptions(false);
    fileInputRef.current?.click();
  }

  function handleTextPostClick() {
    setShowAddOptions(false);
    setTextPostDialog(true);
  }

  function submitTextPost() {
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
    setMediaItems((prev) => [...prev, newPost]);
    setTextPostDialog(false);
    showToast('Text post created');
  }

  // --- Delete ---
  function handleDelete(item) {
    if (window.confirm(`Delete "${item.title}"? This action cannot be undone.`)) {
      setMediaItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedItem(null);
      setSheetItem(null);
      showToast('Item deleted');
    }
  }

  // --- Edit caption (images) ---
  function handleEditCaption(item) {
    setSheetItem(null);
    const newCaption = prompt('Image caption:', item.caption || '');
    if (newCaption !== null) {
      setMediaItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, caption: newCaption.trim() } : i))
      );
      showToast('Caption updated');
    }
  }

  // --- Edit text (text posts) ---
  function handleEditText(item) {
    setSheetItem(null);
    const newText = prompt('Edit text post:', item.text || '');
    if (newText !== null && newText.trim()) {
      setMediaItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                text: newText.trim(),
                title: newText.trim().length > 20 ? newText.trim().substring(0, 20) + '...' : newText.trim(),
              }
            : i
        )
      );
      showToast('Text updated');
    }
  }

  // --- Navigate to scan analysis ---
  function handleScan(item) {
    setSelectedItem(null);
    setSheetItem(null);
    navigate('/scan-analysis', { state: { mediaItem: item } });
  }

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="gallery-screen">
      {/* App Bar */}
      <div className="gallery-appbar">
        <ShieldIcon />
        <span className="gallery-appbar-title">PrivGuard</span>
      </div>

      {/* Header: title + search + sort */}
      <div className="gallery-header">
        <h1 className="gallery-title">Gallery</h1>
        <div className="gallery-toolbar">
          <div className="gallery-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by caption or title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <ClearIcon />
              </button>
            )}
          </div>
          <button className="sort-btn" onClick={() => setSortAscending((p) => !p)} title={sortAscending ? 'Sort Z-A' : 'Sort A-Z'}>
            {sortAscending ? <SortAscIcon /> : <SortDescIcon />}
          </button>
        </div>
      </div>

      {/* Grid or Empty State */}
      <div className="gallery-grid-container">
        {displayItems.length === 0 ? (
          <div className="gallery-empty">
            <GalleryEmptyIcon />
            <h3>{searchQuery ? 'No such posts found' : 'No media yet'}</h3>
            <p>{searchQuery ? 'Try a different search term' : 'Add or upload media to get started'}</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="gallery-item"
                onClick={() => setSelectedItem(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSheetItem(item);
                }}
              >
                {item.type === 'image' && item.dataUrl ? (
                  <>
                    <img src={item.dataUrl} alt={item.title} />
                    {item.caption && <div className="item-caption-overlay">{item.caption}</div>}
                  </>
                ) : item.type === 'text' ? (
                  <div className="text-post-card">
                    <div className="text-post-icons">
                      <TextIcon />
                      <LockIcon style={{ color: '#10b981' }} />
                    </div>
                    <p className="text-post-content">{item.text || 'No content'}</p>
                  </div>
                ) : (
                  <div className="icon-card">
                    <ImageIcon />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-file-input"
        onChange={handleFileSelect}
      />

      {/* FAB backdrop */}
      {showAddOptions && <div className="fab-backdrop" onClick={() => setShowAddOptions(false)} />}

      {/* FAB */}
      <div className="fab-container">
        {showAddOptions && (
          <>
            <div className="fab-option">
              <span className="fab-label">Upload</span>
              <button className="fab-mini" onClick={handleUploadClick}><UploadIcon /></button>
            </div>
            <div className="fab-option">
              <span className="fab-label">Text Post</span>
              <button className="fab-mini" onClick={handleTextPostClick}><TextPostIcon /></button>
            </div>
          </>
        )}
        <button className={`fab-main${showAddOptions ? ' open' : ''}`} onClick={() => setShowAddOptions((p) => !p)}>
          <PlusIcon />
        </button>
      </div>

      {/* ---- Full Content Modal ---- */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {selectedItem.type === 'text' ? <TextIcon /> : <ImageIcon />}
              <span className="modal-header-title">{selectedItem.title}</span>
              <button className="modal-close-btn" onClick={() => setSelectedItem(null)}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              {selectedItem.type === 'text' ? (
                <>
                  <div className="text-content-box">{selectedItem.text || 'No content available'}</div>
                  <div className="encrypted-notice"><LockIcon /> Encrypted and stored securely</div>
                </>
              ) : selectedItem.type === 'image' && selectedItem.dataUrl ? (
                <>
                  <img src={selectedItem.dataUrl} alt={selectedItem.title} />
                  <div className="modal-meta">
                    <ImageIcon />
                    <span>Image • {selectedItem.fileName || 'Unknown file'}</span>
                  </div>
                  {selectedItem.caption && (
                    <div className="modal-caption">
                      <NoteIcon />
                      <span>{selectedItem.caption}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="icon-card" style={{ height: 200 }}>
                  <ImageIcon />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-scan" onClick={() => handleScan(selectedItem)}>
                <ScanIcon /> Scan
              </button>
              <button className="btn-options" onClick={() => { setSelectedItem(null); setSheetItem(selectedItem); }}>
                <MoreIcon /> Options
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Bottom Sheet ---- */}
      {sheetItem && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setSheetItem(null)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              {sheetItem.type === 'text' ? <TextIcon /> : <ImageIcon />}
              <span>{sheetItem.title}</span>
            </div>
            <button className="sheet-option" onClick={() => handleScan(sheetItem)}>
              <ScanIcon style={{ color: '#0c7ff2' }} />
              <div className="sheet-option-text">
                <h4>Scan for Privacy Risks</h4>
                <p>Analyze this item before posting</p>
              </div>
            </button>
            {sheetItem.type === 'text' && (
              <button className="sheet-option" onClick={() => handleEditText(sheetItem)}>
                <EditIcon style={{ color: '#0c7ff2' }} />
                <div className="sheet-option-text">
                  <h4>Edit text</h4>
                  <p>Modify the text content</p>
                </div>
              </button>
            )}
            {sheetItem.type === 'image' && (
              <button className="sheet-option" onClick={() => handleEditCaption(sheetItem)}>
                <EditIcon style={{ color: '#0c7ff2' }} />
                <div className="sheet-option-text">
                  <h4>Edit caption</h4>
                  <p>Add or modify the image caption</p>
                </div>
              </button>
            )}
            <button className="sheet-option danger" onClick={() => handleDelete(sheetItem)}>
              <DeleteIcon />
              <div className="sheet-option-text">
                <h4>Delete</h4>
                <p>Remove this item permanently</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* ---- Text Post Dialog ---- */}
      {textPostDialog && (
        <div className="dialog-overlay" onClick={() => setTextPostDialog(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <h3>Create Text Post</h3>
            <textarea
              ref={textPostRef}
              placeholder="What's on your mind?"
              maxLength={1000}
              rows={3}
              autoFocus
            />
            <div className="dialog-actions">
              <button className="btn-cancel" onClick={() => setTextPostDialog(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitTextPost}>Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default GalleryScreen;
