import { useState } from 'react';
import { scanTextForPII } from '../utils/piiScanner';
import './SocialScannerPage.css';

// ─── Icons ────────────────────────────────────────────────────────────────
const SecurityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const AtIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </svg>
);
const EmailIconSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

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

  function handleScan() {
    if (!scanText.trim()) return;
    setIsScanning(true);
    // Small delay to show scanning animation
    setTimeout(() => {
      const result = scanTextForPII(scanText);
      setScanResults(result);
      setIsScanning(false);
    }, 600);
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

        <textarea
          className="ss-scan-textarea"
          placeholder="Paste your social media post, bio, or any text here... For example: My email is john@example.com and my phone is 555-123-4567"
          value={scanText}
          onChange={(e) => { setScanText(e.target.value); setScanResults(null); }}
          rows={6}
        />

        <div className="ss-scan-actions">
          <button
            className="ss-submit-btn"
            onClick={handleScan}
            disabled={!scanText.trim() || isScanning}
          >
            {isScanning ? (
              <>
                <span className="ss-btn-spinner" />
                Scanning...
              </>
            ) : (
              <>
                <ScanIcon /> Scan for PII
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
                <div className="ss-section-label" style={{ marginTop: 4 }}>Detected PII</div>
                <div className="ss-pii-list">
                  {scanResults.entities.map((entity, i) => (
                    <div className="ss-pii-card" key={i}>
                      <div className="ss-pii-icon">
                        <WarningIcon />
                      </div>
                      <div className="ss-pii-body">
                        <span className="ss-pii-type">{entity.type}</span>
                        <code className="ss-pii-masked">{entity.masked}</code>
                      </div>
                      <span className="ss-pii-weight" style={{ color: riskColor }}>
                        +{entity.riskWeight}
                      </span>
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
      <div className="ss-card-wrapper">
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

        <button className="ss-submit-btn" onClick={handleSubmit}>
          Get Report
        </button>
      </div>
    </div>
  );
}