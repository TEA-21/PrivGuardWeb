import { useState } from 'react';
import './SocialScannerPage.css';

// ─── Icons ────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
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
const EmailIcon = () => (
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

// ─── Main Component ────────────────────────────────────────────────────────
export default function SocialScannerPage() {
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [autoScan, setAutoScan] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

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

  if (submitted) {
    return (
      <div className="ss-screen">
        <div className="ss-appbar">
          <button className="ss-back-btn" onClick={handleReset}>
            <BackIcon />
          </button>
          <span className="ss-appbar-title">Social Scanner</span>
          <div className="ss-appbar-spacer" />
        </div>
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
    );
  }

  return (
    <div className="ss-screen">
      {/* App Bar */}
      <div className="ss-appbar">
        <button className="ss-back-btn" onClick={() => window.history.back()}>
          <BackIcon />
        </button>
        <span className="ss-appbar-title">Social Media Scanner</span>
        <div className="ss-appbar-spacer" />
      </div>

      {/* Scrollable Body */}
      <div className="ss-scroll">
        {/* Hero */}
        <div className="ss-hero">
          <div className="ss-hero-icon">
            <SecurityIcon />
          </div>
          <h1 className="ss-hero-title">Get Your Detailed Privacy Report</h1>
          <p className="ss-hero-sub">
            Enter your social media handle and email to receive insights into your online privacy.
          </p>
        </div>

        {/* Account Details */}
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
            <span className="ss-input-icon"><EmailIcon /></span>
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

        {/* Scan Settings */}
        <div className="ss-section-label" style={{ marginTop: 8 }}>Scan Settings</div>

        <div className="ss-settings-card">
          <div className="ss-setting-row">
            <div className="ss-setting-icon-wrap">
              <RefreshIcon />
            </div>
            <div className="ss-setting-text">
              <span className="ss-setting-title">Automatic Scans</span>
              <span className="ss-setting-sub">Scan your account every 30 days</span>
            </div>
            <Toggle checked={autoScan} onChange={setAutoScan} />
          </div>

          <div className="ss-divider" />

          <div className="ss-setting-row">
            <div className="ss-setting-icon-wrap">
              <BellIcon />
            </div>
            <div className="ss-setting-text">
              <span className="ss-setting-title">Push Notifications</span>
              <span className="ss-setting-sub">Get notified of risk status changes</span>
            </div>
            <Toggle checked={pushNotif} onChange={setPushNotif} />
          </div>
        </div>

        <div className="ss-bottom-pad" />
      </div>

      {/* Sticky Bottom CTA */}
      <div className="ss-footer">
        <button className="ss-submit-btn" onClick={handleSubmit}>
          Get Report
        </button>
      </div>
    </div>
  );
}