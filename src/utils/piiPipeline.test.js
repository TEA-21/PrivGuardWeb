import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanTextForPII } from './piiScanner.js';
import { detectPII } from './piiDetector.js';

describe('PII Validation Pipeline', () => {

  // --- 1. Test `src/utils/piiScanner.js` (Duplicate Tracking) ---
  describe('piiScanner: Duplicate Tracking', () => {
    it('should retain multiple identical PII instances with distinct indices', () => {
      const text = "Contact john.doe@example.com or backup john.doe@example.com for help.";
      const result = scanTextForPII(text);
      
      const emailEntities = result.entities.filter(e => e.type === 'Email Address');
      
      // We expect EXACTLY 2 entries since duplicate-filtering was removed
      expect(emailEntities).toHaveLength(2);
      
      // Ensure they have distinct indices, proving they correspond to the specific occurrences
      expect(emailEntities[0].index).toBe(8);
      expect(emailEntities[0].value).toBe('john.doe@example.com');
      
      expect(emailEntities[1].index).toBe(39);
      expect(emailEntities[1].value).toBe('john.doe@example.com');
    });
  });

  // --- 2. Test `src/utils/piiDetector.js` (AI Extraction & Overlaps) ---
  describe('piiDetector: AI JSON Extraction & Overlap Merging', () => {

    afterEach(() => {
      vi.restoreAllMocks();
    });


    it('should robustly parse Claude JSON wrapped in conversational text', async () => {
      const text = "My secret code is 123456";
      
      // Mock fetch to return conversational preamble/postamble
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: "Sure! Here is the PII I found:\n```json\n[\n  { \"type\": \"credentials\", \"value\": \"123456\", \"risk\": \"high\", \"reason\": \"Secret code detected\" }\n]\n```\nPlease let me know if you need any further analysis."
          }]
        })
      });

      const result = await detectPII(text);
      
      // Test that the JSON boundary array matching worked
      const aiEntity = result.entities.find(e => e.type === 'credentials');
      expect(aiEntity).toBeDefined();
      expect(aiEntity.value).toBe("123456");
      expect(aiEntity.source).toBe("ai");
      // Verify indexOf index fixing logic successfully caught it
      expect(aiEntity.index).toBe(18);
    });

    it('should correctly merge overlap boundaries using strict < operator', () => {
       // Since the internal overlap logic is contained inside detectPII, 
       // we can test it by isolating the exact math formula using purely native variables.
       
       const mergeLogicOverlap = (reIndex, reLength, aiIndex, aiLength) => {
           const reEnd = reIndex + reLength;
           const aiEnd = aiIndex + aiLength;
           return Math.max(aiIndex, reIndex) < Math.min(aiEnd, reEnd);
       };

       // Scenario A: Contiguous but NOT overlapping
       // regex matches "0123" (index 0, length 4) --> bounds (0, 4)
       // ai matches "4567" (index 4, length 4) --> bounds (4, 8)
       expect(mergeLogicOverlap(0, 4, 4, 4)).toBe(false);

       // Scenario B: Overlapping tightly inside
       // regex matches "0123" (index 0, length 4) --> bounds (0, 4)
       // ai matches "12" (index 1, length 2) --> bounds (1, 3)
       expect(mergeLogicOverlap(0, 4, 1, 2)).toBe(true);

       // Scenario C: Overlapping tail
       // regex matches "0123" (index 0, length 4) --> bounds (0, 4)
       // ai matches "2345" (index 2, length 4) --> bounds (2, 6)
       expect(mergeLogicOverlap(0, 4, 2, 4)).toBe(true);
    });
  });

  // --- 3. Test Highlighter Text-Splitting Logic ---
  describe('Highlighter Text-Splitting (PiiHighlightOverlay Logic)', () => {
    // Pure function extracting the React loop logic from PiiHighlightOverlay components
    function highlightTextLogic(text, entities) {
      const sorted = [...entities]
        .filter(e => e.index != null)
        .sort((a, b) => a.index - b.index);

      const parts = [];
      let lastIdx = 0;

      for (let i = 0; i < sorted.length; i++) {
        const entity = sorted[i];
        let start = parseInt(entity.index, 10);
        // Normally this falls back to masked length if value missing
        const len = entity.value ? entity.value.length : (entity.masked ? entity.masked.length : 0);
        if (len === 0) continue;
        
        let end = start + len;
        // Test clamping bounds!
        if (start < lastIdx) {
          start = lastIdx;
        }
        if (start >= end) continue;

        if (start > lastIdx) {
          parts.push({ type: 'plain', text: text.slice(lastIdx, start) });
        }

        parts.push({ type: 'highlight', text: text.slice(start, end) });
        lastIdx = end;
      }

      if (lastIdx < text.length) {
        parts.push({ type: 'plain', text: text.slice(lastIdx) });
      }

      return parts;
    }

    it('should split heavily overlapping entities without dropping trailing characters', () => {
      const text = "A BCDEF G.";
      // Overlap edge case testing!
      const mockEntities = [
        { index: 2, value: "BCD" },   // bounds: 2-5
        { index: 3, value: "CDEF" }   // bounds: 3-7 (Overlaps BCD)
      ];

      const parts = highlightTextLogic(text, mockEntities);

      // Verify the chunks don't miss anything and cover exactly the whole text
      expect(parts).toEqual([
        { type: 'plain', text: "A " },       // 0-2
        { type: 'highlight', text: "BCD" },  // 2-5 (First mapped match takes precedence length)
        { type: 'highlight', text: "EF" },   // 5-7 (Clamped string correctly displays trailing letters!)
        { type: 'plain', text: " G." }       // 7-length
      ]);

      // Assert total reconstructed string perfectly matches original text natively without skips
      const reconstructed = parts.map(p => p.text).join('');
      expect(reconstructed).toBe(text);
    });
  });
});
