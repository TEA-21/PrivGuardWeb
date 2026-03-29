import { scanTextForPII } from './piiScanner';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const SYSTEM_PROMPT = `You are a privacy risk analyzer. Given text, identify ALL personally identifiable information (PII) and sensitive data. Return ONLY a JSON array. Each item: { "type": string, "value": string, "risk": "high"|"medium"|"low", "reason": string }. Types include: name, email, phone, address, financial, health, biometric, credentials, location, relationship, employment, legal, behavioral. If no PII found, return [].`;

function getRiskWeight(riskLevel) {
  switch (riskLevel?.toLowerCase()) {
    case 'high': return 35;
    case 'medium': return 25;
    case 'low': return 15;
    default: return 20;
  }
}

function calculateOverallRisk(entities) {
  if (entities.length === 0) return { riskScore: 0, riskLevel: 'Clean' };
  const rawScore = entities.reduce((sum, e) => sum + (e.riskWeight || 20), 0);
  const riskScore = Math.min(rawScore, 100);
  let riskLevel = 'Low';
  if (riskScore >= 80) riskLevel = 'Critical';
  else if (riskScore >= 60) riskLevel = 'High';
  else if (riskScore >= 40) riskLevel = 'Medium';
  
  return { riskScore, riskLevel };
}

export async function detectPII(text) {
  if (!text || !text.trim()) {
    return { entities: [], riskScore: 0, riskLevel: 'Clean', suggestions: [] };
  }

  // 1. Run Regex Analyzer (synchronous)
  const regexResult = scanTextForPII(text);
  const regexEntities = regexResult.entities.map(e => ({
    ...e,
    source: 'regex',
    // normalize field names to match anthropic outputs
    value: text.substring(e.index, e.index + (e.value ? e.value.length : e.masked.length)), // approximate if value missing
    risk: e.riskWeight >= 30 ? 'high' : e.riskWeight >= 20 ? 'medium' : 'low'
  }));

  // Fix value for regex results since PII scanner might not return the raw value
  regexEntities.forEach(e => {
      if (!e.value && e.index !== undefined) {
          // Find the actual matched string length by scanning forward until a space or we reach the end
          // A bit hacky, but standard scanTextForPII doesn't always return the raw value string
          const matchLength = e.masked ? e.masked.length : 10; // Fallback
          e.value = text.substring(e.index, e.index + matchLength);
      }
  });

  let aiEntities = [];
  
  // 2. Run Claude API (async)
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', // Using exact model from prompt
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: text }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.content[0]?.text || '[]';
        
        // Sometimes Claude wraps the JSON in markdown blocks
        if (content.includes('\`\`\`json')) {
            content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (content.includes('\`\`\`')) {
            content = content.replace(/\`\`\`/g, '').trim();
        }

        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            aiEntities = parsed.map(item => {
              const val = typeof item.value === 'string' ? item.value : (typeof item.content === 'string' ? item.content : (typeof item.masked === 'string' ? item.masked : ''));
              let idx = val ? text.indexOf(val) : -1;
              if (idx === -1 && val) {
                  idx = text.toLowerCase().indexOf(val.toLowerCase());
              }
              return {
                ...item,
                value: val,
                source: 'ai',
                riskWeight: getRiskWeight(item.risk),
                index: idx
              };
            }).filter(item => item.index !== -1); // only keep if found in text
          }
        } catch (parseError) {
          console.error("Failed to parse Claude output:", content);
        }
      } else {
        console.error("Claude API Error:", response.status, await response.text());
      }
    } catch (networkError) {
      console.error("Network error reaching Claude API:", networkError);
    }
  } else {
    console.warn("No VITE_CLAUDE_API_KEY found. Skipping AI detection.");
  }

  // 3. Merge and deduplicate
  const mergedEntities = [...regexEntities];
  
  for (const ai of aiEntities) {
    // Check if duplicate
    const isDuplicate = mergedEntities.find(re => {
      // Check for overlap in indices
      const reEnd = re.index + (re.value ? re.value.length : 10);
      const aiEnd = ai.index + ai.value.length;
      const overlaps = (ai.index >= re.index && ai.index <= reEnd) || 
                       (aiEnd >= re.index && aiEnd <= reEnd) ||
                       (ai.index <= re.index && aiEnd >= reEnd);
      return overlaps;
    });

    if (isDuplicate) {
      isDuplicate.source = 'both';
      if (getRiskWeight(ai.risk) > isDuplicate.riskWeight) {
        isDuplicate.riskWeight = getRiskWeight(ai.risk);
        isDuplicate.risk = ai.risk;
      }
      isDuplicate.reason = isDuplicate.reason || ai.reason;
    } else {
      mergedEntities.push({
        ...ai,
        masked: ai.value.length > 4 
            ? ai.value.substring(0, 2) + '*'.repeat(ai.value.length - 4) + ai.value.substring(ai.value.length - 2) 
            : '*'.repeat(ai.value.length)
      });
    }
  }

  // Sort by index
  mergedEntities.sort((a, b) => a.index - b.index);

  // Recalculate score
  const { riskScore, riskLevel } = calculateOverallRisk(mergedEntities);

  // Combine suggestions
  let suggestions = regexResult.suggestions || [];
  if (mergedEntities.length === 0) {
    suggestions = ['Your content appears privacy-friendly', 'Continue following privacy best practices'];
  } else {
    const newTypes = new Set(mergedEntities.filter(e => e.source === 'ai' || e.source === 'both').map(e => (e.type || 'Unknown').toLowerCase()));
    if (newTypes.has('name') || newTypes.has('person')) suggestions.push('Consider removing real names to protect identities');
    if (newTypes.has('location') || newTypes.has('address')) suggestions.push('Location data can compromise physical safety');
    if (newTypes.has('employment') || newTypes.has('company')) suggestions.push('Workplace details might lead to targeted social engineering');
    if (newTypes.has('financial') || newTypes.has('credit card')) suggestions.push('Financial details present a severe fraud risk');
    if (newTypes.has('health') || newTypes.has('medical')) suggestions.push('Health information is highly sensitive and legally protected');
    if (newTypes.has('phone') || newTypes.has('email')) suggestions.push('Remove contact info to prevent spam or phishing');
  }

  // Ensure "Review all flagged items" is at the end if there are issues
  if (mergedEntities.length > 0) {
      suggestions = suggestions.filter(s => !s.includes('Review all flagged items'));
      suggestions.push('Review all flagged items before posting publicly');
  }

  suggestions = [...new Set(suggestions)];

  return {
    entities: mergedEntities,
    riskScore,
    riskLevel,
    suggestions
  };
}
