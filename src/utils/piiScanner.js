/**
 * PII Scanner Utility
 * Detects sensitive information in text using regular expressions.
 */

// ── Regex Pattern Definitions ──────────────────────────────────────────────
const PII_PATTERNS = [
  {
    type: 'Email Address',
    // Standard email: user@domain.tld
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    riskWeight: 25,
    mask: (val) => {
      const [local, domain] = val.split('@');
      return local.slice(0, 2) + '***@' + domain;
    },
  },
  {
    type: 'Credit Card',
    // Visa (4xxx), Mastercard (5xxx/2xxx), Amex (34/37), Discover (6xxx)
    // Supports optional spaces/dashes between groups
    regex: /\b(?:4[0-9]{3}|5[1-5][0-9]{2}|3[47][0-9]{2}|6(?:011|5[0-9]{2}))[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{1,4}\b/g,
    riskWeight: 35,
    mask: (val) => {
      const digits = val.replace(/[^0-9]/g, '');
      return '**** **** **** ' + digits.slice(-4);
    },
  },
  {
    type: 'PAN Card',
    // Indian PAN: 5 uppercase letters, 4 digits, 1 uppercase letter  (e.g. ABCDE1234F)
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    riskWeight: 30,
    mask: (val) => val.slice(0, 2) + '****' + val.slice(-2),
  },
  {
    type: 'Aadhaar Card',
    // Indian Aadhaar: 12 digits, optionally formatted as XXXX XXXX XXXX or XXXX-XXXX-XXXX
    regex: /\b[2-9][0-9]{3}[- ]?[0-9]{4}[- ]?[0-9]{4}\b/g,
    riskWeight: 30,
    mask: (val) => {
      const digits = val.replace(/[^0-9]/g, '');
      if (digits.length !== 12) return val; // skip if not exactly 12
      return 'XXXX XXXX ' + digits.slice(-4);
    },
    // Extra validation: must be exactly 12 digits
    validate: (val) => val.replace(/[^0-9]/g, '').length === 12,
  },
  {
    type: 'Phone Number',
    // International: +1-xxx-xxx-xxxx, +91 xxxxx xxxxx, etc.
    // Or 10-digit local: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx xxx xxxx
    regex: /(?:\+?[0-9]{1,3}[- ]?)?(?:\(?[0-9]{3}\)?[- ]?)?[0-9]{3}[- ]?[0-9]{4}\b/g,
    riskWeight: 20,
    mask: (val) => {
      const digits = val.replace(/[^0-9]/g, '');
      if (digits.length < 7) return val; // too short, not a real phone
      return '***-***-' + digits.slice(-4);
    },
    // Require at least 7 digits to avoid false positives on short numbers
    validate: (val) => val.replace(/[^0-9]/g, '').length >= 7,
  },
  {
    type: 'URL/Link',
    // http(s) URLs and www. prefixed links
    regex: /https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+/gi,
    riskWeight: 10,
    mask: (val) => {
      try {
        const url = new URL(val.startsWith('www.') ? 'https://' + val : val);
        return url.hostname + '/***';
      } catch {
        return val.slice(0, 15) + '...';
      }
    },
  },
  {
    type: 'SSN',
    // US Social Security Number: XXX-XX-XXXX
    regex: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g,
    riskWeight: 35,
    mask: (val) => '***-**-' + val.slice(-4),
  },
  {
    type: 'IP Address',
    // IPv4: xxx.xxx.xxx.xxx
    regex: /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    riskWeight: 15,
    mask: (val) => val.replace(/\.[0-9]+$/, '.***'),
  },
  {
    type: 'Date of Birth',
    // Common formats: DD/MM/YYYY, MM-DD-YYYY, YYYY/MM/DD
    regex: /\b(?:0?[1-9]|[12][0-9]|3[01])[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:19|20)[0-9]{2}\b|\b(?:19|20)[0-9]{2}[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12][0-9]|3[01])\b/g,
    riskWeight: 15,
    mask: () => '**/**/****',
  },
  {
    type: 'Street Address',
    // Common US address pattern: number + street name + type (St, Ave, Rd, etc.)
    regex: /\b[0-9]{1,5}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\.?\b/gi,
    riskWeight: 12,
    mask: (val) => val.replace(/^[0-9]+/, '***'),
  },
];

// ── Main Scanning Function ─────────────────────────────────────────────────

/**
 * Scans text for PII using regex patterns.
 * @param {string} text - The text to scan
 * @returns {{ entities: Array<{type: string, value: string, masked: string, index: number}>, riskScore: number, riskLevel: string, detectedRisks: string[], suggestions: string[] }}
 */
export function scanTextForPII(text) {
  if (!text || typeof text !== 'string') {
    return {
      entities: [],
      riskScore: 0,
      riskLevel: 'Very Low',
      detectedRisks: ['No content to scan'],
      suggestions: ['Add text content to enable privacy scanning'],
    };
  }

  const entities = [];
  const seenValues = new Set(); // avoid duplicates

  for (const pattern of PII_PATTERNS) {
    // Reset regex lastIndex for global flag
    pattern.regex.lastIndex = 0;
    let match;

    while ((match = pattern.regex.exec(text)) !== null) {
      const value = match[0];

      // Run optional extra validation
      if (pattern.validate && !pattern.validate(value)) continue;

      // Deduplicate by normalized value
      const normalizedKey = pattern.type + ':' + value.toLowerCase().replace(/[\s-]/g, '');
      if (seenValues.has(normalizedKey)) continue;
      seenValues.add(normalizedKey);

      entities.push({
        type: pattern.type,
        value,
        masked: pattern.mask(value),
        index: match.index,
        riskWeight: pattern.riskWeight,
      });
    }
  }

  // Calculate risk score (capped at 100)
  const rawScore = entities.reduce((sum, e) => sum + e.riskWeight, 0);
  const riskScore = Math.min(rawScore, 100);
  const riskLevel = getRiskLevel(riskScore);

  // Build human-readable risk list
  const detectedRisks = entities.length
    ? entities.map((e) => `${e.type} detected: ${e.masked}`)
    : ['No personally identifiable information detected in this content'];

  // Build suggestions
  const suggestions = buildSuggestions(entities);

  return { entities, riskScore, riskLevel, detectedRisks, suggestions };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getRiskLevel(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

function buildSuggestions(entities) {
  if (!entities.length) {
    return [
      'Your content appears privacy-friendly',
      'Continue following privacy best practices',
    ];
  }

  const types = new Set(entities.map((e) => e.type));
  const suggestions = [];

  if (types.has('Email Address'))
    suggestions.push('Remove or redact email addresses before sharing publicly');
  if (types.has('Credit Card'))
    suggestions.push('Never share credit/debit card numbers — remove them immediately');
  if (types.has('PAN Card'))
    suggestions.push('PAN card numbers are sensitive tax IDs — redact before posting');
  if (types.has('Aadhaar Card'))
    suggestions.push('Aadhaar numbers are highly sensitive — never share online');
  if (types.has('Phone Number'))
    suggestions.push('Consider removing phone numbers to prevent unwanted calls');
  if (types.has('SSN'))
    suggestions.push('Social Security Numbers must be removed — critical identity theft risk');
  if (types.has('URL/Link'))
    suggestions.push('Review URLs for potentially sensitive or malicious links');
  if (types.has('IP Address'))
    suggestions.push('IP addresses can reveal your location — consider removing');
  if (types.has('Date of Birth'))
    suggestions.push('Date of birth can be used for identity verification — remove it');
  if (types.has('Street Address'))
    suggestions.push('Physical addresses reveal your location — redact before sharing');

  suggestions.push('Review all flagged items before posting publicly');
  return suggestions;
}
