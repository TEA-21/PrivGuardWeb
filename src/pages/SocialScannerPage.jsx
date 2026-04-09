import { useState, useMemo } from 'react';
import {
  ShieldCheck, AtSign, Mail, RefreshCcw, Bell, CheckCircle,
  AlertTriangle, ScanSearch,
} from 'lucide-react';
import { detectPII } from '../utils/piiDetector';
import { scanTextForPII } from '../utils/piiScanner';
import './SocialScannerPage.css';

const SecurityIcon   = ShieldCheck;
const AtIcon         = AtSign;
const EmailIconSvg   = Mail;
const RefreshIcon    = RefreshCcw;
const BellIcon       = Bell;
const CheckCircleIcon = CheckCircle;
const WarningIcon    = AlertTriangle;
const ShieldCheckIcon = ShieldCheck;
const ScanIcon       = ScanSearch;

// ─── Toggle Switch ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`ss-toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    />
  );
}

// ─── Regular Icons omitted for brevity, keeping existing ───

// ─── Inline PII Highlight Overlay ──────────────────────────────────────────
function PiiHighlightOverlay({ text, entities }) {
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

// ─── Risk color helper ─────────────────────────────────────────────────────
function getRiskColor(score) {
  if (score >= 80) return '#DC2626';
  if (score >= 60) return '#EF4444';
  if (score >= 40) return '#F59E0B';
  if (score >= 20) return '#10B981';
  return '#059669';
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SocialScannerPage() {
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [autoScan, setAutoScan] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Text scanner
  const [scanText, setScanText] = useState('');
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const liveRegexEntities = useMemo(() => {
    if (!scanText.trim()) return [];
    try {
      return scanTextForPII(scanText).entities;
    } catch {
      return [];
    }
  }, [scanText]);

  function validate() {
    const e = {};
    if (!handle.trim()) e.handle = 'Please enter your social media handle';
    if (!email.trim()) e.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSubmitted(true);
  }

  function handleReset() {
    setSubmitted(false);
    setHandle('');
    setEmail('');
  }

  async function handleScan() {
    if (!scanText.trim()) return;
    setIsScanning(true);
    const result = await detectPII(scanText);
    setScanResults(result);
    setIsScanning(false);
  }

  function clearScan() {
    setScanResults(null);
    setScanText('');
  }

  if (submitted) {
    return (
      <div className="ss-screen">
        <div className="ss-card-wrapper">
          <div className="ss-success-screen">
            <div className="ss-success-icon">
              <CheckCircleIcon />
            </div>
            <h2 className="ss-success-title">Report Requested!</h2>
            <p className="ss-success-body">
              Your privacy report for <strong>{handle}</strong> will be sent to <strong>{email}</strong>.
            </p>
            {autoScan && (
              <p className="ss-success-note">
                🔁 Automatic scans every 30 days are enabled.
              </p>
            )}
            {pushNotif && (
              <p className="ss-success-note">
                🔔 You'll be notified of any risk status changes.
              </p>
            )}
            <button className="ss-submit-btn ss-reset-btn" onClick={handleReset}>
              Scan Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const riskColor = scanResults ? getRiskColor(scanResults.riskScore) : null;

  return (
    <div className="ss-screen">
      {/* ─── Left Column: Text Scanner ─── */}
      <div className="ss-card-wrapper">
        <div className="ss-hero">
          <div className="ss-hero-icon">
            <ScanIcon />
          </div>
          <h1 className="ss-hero-title">Scan Text for Privacy Risks</h1>
          <p className="ss-hero-sub">
            Paste or type any text post below to detect sensitive personal information before publishing.
          </p>
        </div>

        <div className="ss-section-label">Content to Scan</div>

        <div className="ss-scan-input-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <textarea
            className="ss-scan-textarea"
            placeholder="Paste your social media post, bio, or any text here... For example: My email is john@example.com and my phone is 555-123-4567"
            value={scanText}
            onChange={(e) => { setScanText(e.target.value); setScanResults(null); }}
            rows={6}
          />
          
          {scanText.trim().length > 0 && (
            <div className="ss-pii-preview-strip" style={{
              display: liveRegexEntities.length > 0 && !scanResults ? 'block' : 'none'
            }}>
              <div className="ss-pii-preview-header">
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>.*</span> Preliminary Regex Check
              </div>
              <PiiHighlightOverlay text={scanText} entities={liveRegexEntities} />
            </div>
          )}
        </div>

        <div className="ss-scan-actions">
          <button
            className="ss-submit-btn"
            onClick={handleScan}
            disabled={!scanText.trim() || isScanning}
          >
            {isScanning ? (
              <>
                <span className="ss-btn-spinner" />
                Scanning Deeply (Regex + AI)...
              </>
            ) : (
              <>
                <ScanIcon /> Execute Advanced PII Deep Scan (Regex+AI)
              </>
            )}
          </button>
          {scanResults && (
            <button className="ss-clear-btn" onClick={clearScan}>
              Clear Results
            </button>
          )}
        </div>

        {/* ─── Scan Results ─── */}
        {scanResults && (
          <div className="ss-results">
            {/* Risk Score Badge */}
            <div className="ss-risk-badge" style={{ '--risk-color': riskColor }}>
              <div className="ss-risk-score-circle" style={{ background: riskColor }}>
                {scanResults.riskScore}
              </div>
              <div className="ss-risk-info">
                <span className="ss-risk-level" style={{ color: riskColor }}>
                  {scanResults.riskLevel} Risk
                </span>
                <span className="ss-risk-count">
                  {scanResults.entities.length} item{scanResults.entities.length !== 1 ? 's' : ''} detected
                </span>
              </div>
            </div>

            {/* Entities found — warning cards */}
            {scanResults.entities.length > 0 ? (
              <>
                <div className="ss-section-label" style={{ marginTop: 4 }}>Highlighted Text</div>
                <PiiHighlightOverlay text={scanText} entities={scanResults.entities} />

                <div className="ss-section-label" style={{ marginTop: 4 }}>Detected PII</div>
                <div className="ss-pii-list">
                  {scanResults.entities.map((entity, i) => (
                    <div className="ss-pii-card" key={i}>
                      <div className="ss-pii-icon">
                        <WarningIcon />
                      </div>
                      <div className="ss-pii-body" style={{gap: 4}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="ss-pii-type">{entity.type}</span>
                            <span className={`source-tag ${entity.source}`}>[{entity.source}]</span>
                        </div>
                        <code className="ss-pii-masked" style={{padding: '4px 6px', fontSize: 13, background: '#f1f5f9'}}>{entity.masked || entity.value}</code>
                        {entity.reason && <p className="entity-reason" style={{margin: 0, marginTop: 4, fontSize: 13, color: '#64748b'}}>{entity.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="ss-section-label" style={{ marginTop: 4 }}>Recommendations</div>
                <ul className="ss-suggestion-list">
                  {scanResults.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            ) : (
              /* Safe to post */
              <div className="ss-safe-card">
                <ShieldCheckIcon />
                <div>
                  <strong>Safe to Post!</strong>
                  <p>No personally identifiable information was detected in your content.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Right Column: Account Report Form ─── */}
      <div className="ss-card-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="ss-hero" style={{ paddingBottom: 4 }}>
          <div className="ss-hero-icon" style={{ width: 56, height: 56 }}>
            <SecurityIcon />
          </div>
          <h2 className="ss-hero-title" style={{ fontSize: 20 }}>Request Account Privacy Report</h2>
          <p className="ss-hero-sub" style={{ fontSize: 13 }}>
            Enter your social handle and email to receive a full privacy report.
          </p>
        </div>

        <div className="ss-section-label">Account Details</div>

        <div className="ss-input-group">
          <div className={`ss-input-wrap ${errors.handle ? 'error' : ''}`}>
            <span className="ss-input-icon"><AtIcon /></span>
            <input
              type="text"
              className="ss-input"
              placeholder="@username"
              value={handle}
              onChange={e => { setHandle(e.target.value); setErrors(p => ({ ...p, handle: '' })); }}
            />
          </div>
          {errors.handle && <p className="ss-field-error">{errors.handle}</p>}
        </div>

        <div className="ss-input-group">
          <div className={`ss-input-wrap ${errors.email ? 'error' : ''}`}>
            <span className="ss-input-icon"><EmailIconSvg /></span>
            <input
              type="email"
              className="ss-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
            />
          </div>
          {errors.email && <p className="ss-field-error">{errors.email}</p>}
        </div>

        <div className="ss-section-label" style={{ marginTop: 4 }}>Scan Settings</div>

        <div className="ss-settings-card">
          <div className="ss-setting-row">
            <div className="ss-setting-icon-wrap"><RefreshIcon /></div>
            <div className="ss-setting-text">
              <span className="ss-setting-title">Automatic Scans</span>
              <span className="ss-setting-sub">Scan every 30 days</span>
            </div>
            <Toggle checked={autoScan} onChange={setAutoScan} />
          </div>
          <div className="ss-divider" />
          <div className="ss-setting-row">
            <div className="ss-setting-icon-wrap"><BellIcon /></div>
            <div className="ss-setting-text">
              <span className="ss-setting-title">Push Notifications</span>
              <span className="ss-setting-sub">Get risk change alerts</span>
            </div>
            <Toggle checked={pushNotif} onChange={setPushNotif} />
          </div>
        </div>
        
        <div className="ss-right-spacer" />

        <button className="ss-submit-btn" onClick={handleSubmit}>
          Get Report
        </button>
      </div>
    </div>
  );
}