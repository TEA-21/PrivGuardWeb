import { vi, describe, it, expect, beforeEach } from 'vitest';
import { scanImageWithML, detectPII } from '../utils/piiDetector';

describe('Network & API Resiliency Constraints', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('scanImageWithML (Local Backend Mapping Hook)', () => {
    it('should natively trap 503 Network Unavailable safely routing purely generic Clean fallbacks structurally', async () => {
      // Simulate extreme CORS boundary rejections or Network down bounds gracefully
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch')); 

      const mockBlob = new Blob(['fake_image_bytes'], { type: 'image/jpeg' });
      const result = await scanImageWithML(mockBlob);

      // Verify explicit UI constraints never drop the generic component JSON structure gracefully mapping cleanly
      expect(result.entities).toEqual([]);
      expect(result.riskLevel).toBe('Clean');
      // Confirms explicit user-friendly trace warning limits
      expect(result.suggestions[0]).toContain('Failed to connect to Local ML Backend on port 8000');
    });
  });

  describe('detectPII (Local FastAPI Text Scanner Integration)', () => {
    it('should query the local text endpoint flawlessly merging deduplicated boundaries logically without Claude strings', async () => {
      
      // Inject complex layout variables mimicking aggressive LocalBackend bounds natively
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          entities: [
             { "type": "Street Address", "value": "123 Fake St", "risk": "medium", "index": 11 }
          ]
        })
      });

      const text = "Meet me at 123 Fake St.";
      const result = await detectPII(text);
      
      // Native verification cleanly locating arrays explicitly tracking bounds correctly
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities[0].type).toBe('Street Address');
      expect(result.entities[0].source).toBe('both'); // Because regex maps it too natively
    });
  });
});
