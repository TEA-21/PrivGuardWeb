import { scanTextForPII } from './piiScanner';



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
  
  // 2. Run Local Backend (async)
  try {
    const response = await fetch('http://localhost:8000/scan-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (response.ok) {
        const data = await response.json();
        if (data.entities && Array.isArray(data.entities)) {
            aiEntities = data.entities.map(item => ({
                ...item,
                source: 'ml-backend'
            }));
        }
    } else {
        console.error("Local Backend API Error:", response.status);
    }
  } catch (networkError) {
      console.error("Network error reaching Local Backend API:", networkError);
  }

  // 3. Merge and deduplicate
  const mergedEntities = [...regexEntities];
  
  for (const ai of aiEntities) {
    // Check if duplicate
    const isDuplicate = mergedEntities.find(re => {
      // Check for overlap in indices properly (< not <= for bounds)
      const reEnd = re.index + (re.value ? re.value.length : 10);
      const aiEnd = ai.index + ai.value.length;
      return Math.max(ai.index, re.index) < Math.min(aiEnd, reEnd);
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

export async function scanImageWithML(fileOrBlob) {
  try {
    const formData = new FormData();
    formData.append('image', fileOrBlob, 'upload.jpg');

    const response = await fetch('http://localhost:8000/scan-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        console.warn("Backend ML Scan returned error:", response.status);
        return { entities: [], riskScore: 0, riskLevel: 'Clean', suggestions: ['Backend ML service unavailable or failed.'] };
    }

    const data = await response.json();
    return {
        entities: data.entities || [],
        riskScore: data.riskScore || 0,
        riskLevel: data.riskLevel || 'Clean',
        suggestions: data.suggestions || [],
        facesDetected: data.facesDetected || 0,
        extractedText: data.extractedText || ''
    };
  } catch (error) {
    console.warn("Failed to reach Local ML Backend:", error);
    return { entities: [], riskScore: 0, riskLevel: 'Clean', suggestions: ['Failed to connect to Local ML Backend on port 8000.'] };
  }
}
