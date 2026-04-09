import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Shield, Image as ImageIcon, Type,
  AlertTriangle, Lightbulb, Lock, ShieldCheck,
} from 'lucide-react';
import { scanTextForPII } from '../utils/piiScanner';
import './ScanAnalysisPage.css';

const BackIcon     = ChevronLeft;
const ShieldIcon   = Shield;
const TextIcon     = Type;
const WarningIcon  = AlertTriangle;
const BulbIcon     = Lightbulb;
const LockIcon     = Lock;
const SecurityIcon = ShieldCheck;

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

  function runScan() {
    setIsScanning(true);
    setError(null);

    // Small delay for visual scanning feedback
    setTimeout(() => {
      if (item?.type === 'text' && item?.text) {
        // Use local regex PII scanner
        const scanResult = scanTextForPII(item.text);
        setResult({
          riskScore: scanResult.riskScore,
          riskLevel: scanResult.riskLevel,
          entities: scanResult.entities,
          detectedRisks: scanResult.detectedRisks,
          suggestions: scanResult.suggestions,
        });
      } else if (item?.type === 'image') {
        // Demo data for images (OCR not implemented yet)
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
        setResult({
          riskScore: 5,
          riskLevel: 'Very Low',
          entities: [],
          detectedRisks: ['No content available to scan'],
          suggestions: ['Add text content to enable privacy scanning'],
        });
      }

      setIsScanning(false);
    }, 800);
  }

  if (!item) {
    return (
      <div className="sa-screen">
        <div className="sa-empty">
          <ShieldIcon />
          <h2>No item selected</h2>
          <p>Go back to the Gallery and click "Scan for Risks" on an item.</p>
          <button className="sa-back-btn-lg" onClick={() => navigate('/')}>Back to Gallery</button>
        </div>
      </div>
    );
  }

  const riskColor = getRiskColor(result?.riskScore);

  return (
    <div className="sa-screen">
      {/* ── Back link ── */}
      <button className="sa-back-link" onClick={() => navigate(-1)}>
        <BackIcon />
        <span>Back to Gallery</span>
      </button>

      {/* ── Body ── */}
      {isScanning ? (
        <div className="sa-loading-screen">
          <ScanningLoader itemTitle={item.title || 'content'} />
        </div>
      ) : (
        <div className="sa-dashboard">

          {/* ── Top Row: Preview + Risk Score ── */}
          <div className="sa-top-grid">
            {/* Media Preview Card */}
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

            {/* Risk Score Card */}
            <div className="sa-card sa-risk-card">
              <h3 className="sa-section-label">Risk Score</h3>
              <RiskDial
                score={result?.riskScore}
                level={result?.riskLevel}
                color={riskColor}
              />
              {/* Summary chips */}
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
            </div>
          </div>

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

          {/* ── Tab Content — multi-column grid ── */}
          <div className="sa-tab-content">
            {activeTab === 'risks' && result?.detectedRisks?.map((risk, i) => (
              <div className="sa-risk-item" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
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
              <div className="sa-suggestion-item" key={i} style={{ animationDelay: `${i * 0.05}s` }}>
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
        </div>
      )}
    </div>
  );
}