import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ScanAnalysisPage.css';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
  </svg>
);
const TextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);
const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const BulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18" /><line x1="10" y1="22" x2="14" y2="22" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SecurityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

// ─── Risk Score Dial (SVG Arc) ─────────────────────────────────────────────
function RiskDial({ score, level, color }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? Math.min(score / 100, 1) : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="risk-dial-wrapper">
      <svg className="risk-dial-svg" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="10" />
        {/* Progress arc */}
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="risk-dial-center">
        <span className="risk-dial-score" style={{ color }}>
          {score != null ? score : '--'}
        </span>
        <span className="risk-dial-level">{level || 'Unknown'}</span>
      </div>
    </div>
  );
}

// ─── Loading Spinner ───────────────────────────────────────────────────────
function ScanningLoader({ itemTitle }) {
  const dots = [0, 1, 2];
  return (
    <div className="scanning-loader">
      <div className="scan-pulse-ring">
        <div className="scan-icon-center">
          <ShieldIcon />
        </div>
      </div>
      <h2 className="scanning-title">Scanning</h2>
      <p className="scanning-subtitle">
        Analyzing privacy risks in<br />
        <strong>{itemTitle}</strong>
      </p>
      <div className="scanning-dots">
        {dots.map(i => (
          <span key={i} className="scanning-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function getRiskColor(score) {
  if (score == null) return '#94A3B8';
  if (score >= 80) return '#DC2626';
  if (score >= 60) return '#EF4444';
  if (score >= 40) return '#F59E0B';
  if (score >= 20) return '#10B981';
  return '#059669';
}

function getRiskLevel(score) {
  if (score == null) return 'Unknown';
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

// ─── Claude API PII Detection ─────────────────────────────────────────────
async function scanWithClaude(text) {
  const systemPrompt = `You are a privacy risk analyzer. Analyze the given text for Personally Identifiable Information (PII) and privacy risks.

Respond ONLY with a valid JSON object — no markdown, no backticks, no explanation. Use exactly this format:
{
  "entities": [
    { "type": "EMAIL", "value": "the detected value" },
    { "type": "PHONE", "value": "the detected value" }
  ],
  "riskScore": 45,
  "detectedRisks": ["Risk description 1", "Risk description 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Entity types to detect: EMAIL, PHONE, ADDRESS, FULL_NAME, USERNAME, DATE_OF_BIRTH, CREDIT_CARD, SSN, PASSWORD, ID_NUMBER, ACCOUNT_NUMBER, IP_ADDRESS.

Risk score rules (0-100):
- Each EMAIL: +25, PHONE: +20, NAME: +15, ADDRESS: +12, USERNAME: +18
- CREDIT_CARD/SSN/PASSWORD/ID_NUMBER: +35 each
- Cap at 100

If no PII found, return riskScore: 5 and empty arrays with a note in detectedRisks that content appears safe.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analyze this text for privacy risks:\n\n${text}` }],
    }),
  });

  const data = await response.json();
  const raw = data.content?.map(b => b.text || '').join('') || '';
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Failed to parse Claude response');
  }
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function ScanAnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.mediaItem;

  const [isScanning, setIsScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('risks');
  const hasScanned = useRef(false);

  useEffect(() => {
    if (!item || hasScanned.current) return;
    hasScanned.current = true;
    runScan();
  }, [item]);

  async function runScan() {
    setIsScanning(true);
    setError(null);

    try {
      if (item?.type === 'text' && item?.text) {
        const scanResult = await scanWithClaude(item.text);
        const score = Math.min(scanResult.riskScore ?? 0, 100);
        setResult({
          riskScore: score,
          riskLevel: getRiskLevel(score),
          entities: scanResult.entities || [],
          detectedRisks: scanResult.detectedRisks?.length
            ? scanResult.detectedRisks
            : ['No significant privacy risks detected in this content'],
          suggestions: scanResult.suggestions?.length
            ? scanResult.suggestions
            : ['Your content appears privacy-friendly', 'Continue following privacy best practices'],
        });
      } else if (item?.type === 'image') {
        // Demo data for images (OCR not implemented yet)
        await new Promise(r => setTimeout(r, 2000));
        setResult({
          riskScore: 85,
          riskLevel: 'High',
          entities: [],
          detectedRisks: [
            'Faces detected in image',
            'EXIF location data may be present',
            'Personal items or documents may be visible',
            'Background may contain identifiable information',
          ],
          suggestions: [
            'Blur or crop faces before sharing',
            'Strip EXIF metadata from the image',
            'Cover sensitive documents visible in the background',
            'Check for reflective surfaces that may expose personal info',
          ],
          isImageDemo: true,
        });
      } else {
        await new Promise(r => setTimeout(r, 1500));
        setResult({
          riskScore: 5,
          riskLevel: 'Very Low',
          entities: [],
          detectedRisks: ['No content available to scan'],
          suggestions: ['Add text content to enable privacy scanning'],
        });
      }
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
      // Fallback demo result
      setResult({
        riskScore: 60,
        riskLevel: 'Medium',
        entities: [],
        detectedRisks: ['Could not connect to scanner — showing demo data', 'Phone number mentioned', 'Workplace information shared'],
        suggestions: ['Remove or redact phone numbers', 'Avoid sharing specific workplace details', 'Review content before sharing publicly'],
      });
    }

    setIsScanning(false);
  }

  if (!item) {
    return (
      <div className="sa-screen">
        <div className="sa-empty">
          <ShieldIcon />
          <h2>No item selected</h2>
          <p>Go back to the Gallery and tap "Scan for Risks" on an item.</p>
          <button className="sa-back-btn-lg" onClick={() => navigate('/')}>Back to Gallery</button>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(result?.riskScore);

  return (
    <div className="sa-screen">
      {/* ── App Bar ── */}
      <div className="sa-appbar">
        <button className="sa-back-btn" onClick={() => navigate(-1)}>
          <BackIcon />
        </button>
        <span className="sa-appbar-title" title={item.title}>{item.title || 'Privacy Analysis'}</span>
        <div className="sa-appbar-spacer" />
      </div>

      {/* ── Body ── */}
      {isScanning ? (
        <div className="sa-loading-screen">
          <ScanningLoader itemTitle={item.title || 'content'} />
        </div>
      ) : (
        <div className="sa-scroll">

          {/* ── Media Preview Card ── */}
          <div className="sa-card sa-preview-card">
            <div className="sa-preview-header">
              <div className="sa-avatar">
                {item.type === 'image' ? <ImageIcon /> : <TextIcon />}
              </div>
              <div className="sa-preview-meta">
                <span className="sa-preview-username">User</span>
                <span className="sa-preview-handle">@username</span>
              </div>
            </div>
            <div className="sa-preview-content">
              {item.type === 'text' ? (
                <p className="sa-preview-text">{item.text}</p>
              ) : (
                <div className="sa-preview-image-box">
                  {item.dataUrl ? (
                    <img src={item.dataUrl} alt={item.title} className="sa-preview-img" />
                  ) : (
                    <div className="sa-preview-image-placeholder">
                      <ImageIcon />
                      <span>Encrypted Image</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {result?.isImageDemo && (
              <div className="sa-demo-badge">
                <span>⚡ Demo results — OCR scanning coming soon</span>
              </div>
            )}
            {error && (
              <div className="sa-error-badge">
                <span>⚠ Scanner offline — showing fallback results</span>
              </div>
            )}
          </div>

          {/* ── Risk Score ── */}
          <div className="sa-section-label">Risk Score</div>
          <div className="sa-card sa-risk-card">
            <RiskDial
              score={result?.riskScore}
              level={result?.riskLevel}
              color={riskColor}
            />
          </div>

          {/* ── Summary Cards ── */}
          {result && (
            <div className="sa-summary-row">
              <div className="sa-summary-card" style={{ '--accent': '#0C7FF2', '--accent-bg': '#EFF6FF', '--accent-border': '#BFDBFE' }}>
                <div className="sa-summary-icon" style={{ color: '#0C7FF2' }}>
                  <SecurityIcon />
                </div>
                <div className="sa-summary-value" style={{ color: '#0C7FF2' }}>
                  {result.entities?.length ?? result.detectedRisks?.length ?? 0}
                </div>
                <div className="sa-summary-label">Detected Entities</div>
              </div>
              <div className="sa-summary-card" style={{ '--accent': riskColor, '--accent-bg': `${riskColor}18`, '--accent-border': `${riskColor}44` }}>
                <div className="sa-summary-icon" style={{ color: riskColor }}>
                  <WarningIcon />
                </div>
                <div className="sa-summary-value" style={{ color: riskColor }}>
                  {result.riskLevel}
                </div>
                <div className="sa-summary-label">Risk Level</div>
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="sa-tabs">
            <button
              className={`sa-tab ${activeTab === 'risks' ? 'active' : ''}`}
              onClick={() => setActiveTab('risks')}
            >
              Detected Risks
            </button>
            <button
              className={`sa-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
            >
              Suggestions
            </button>
          </div>

          {/* ── Tab Content ── */}
          <div className="sa-tab-content">
            {activeTab === 'risks' && result?.detectedRisks?.map((risk, i) => (
              <div className="sa-risk-item" key={i}>
                <div className="sa-risk-icon-wrap">
                  <WarningIcon />
                </div>
                <div className="sa-risk-text">
                  <span className="sa-risk-title">{risk}</span>
                  <span className="sa-risk-sub">Risk identified</span>
                </div>
              </div>
            ))}

            {activeTab === 'suggestions' && result?.suggestions?.map((s, i) => (
              <div className="sa-suggestion-item" key={i}>
                <div className="sa-suggestion-icon-wrap">
                  <BulbIcon />
                </div>
                <span className="sa-suggestion-text">{s}</span>
              </div>
            ))}
          </div>

          {/* ── Safe Footer ── */}
          {result?.riskScore != null && result.riskScore < 20 && (
            <div className="sa-safe-banner">
              <LockIcon />
              <span>This content appears privacy-safe to share</span>
            </div>
          )}

          <div className="sa-bottom-pad" />
        </div>
      )}
    </div>
  );
}