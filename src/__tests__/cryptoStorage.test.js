import { encryptAndSaveItem, loadAllEncryptedItems } from '../utils/cryptoStorage';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('cryptoStorage - LocalStorage Quota & Integrity Edge Cases', () => {
    let setItemSpy;

    beforeEach(() => {
        setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should gracefully handle DOMException: QuotaExceededError when saving large generic payload images', async () => {
        // Mock setItem to explicitly throw a Quota mapping failure simulating exact browser limits natively
        setItemSpy.mockImplementation(() => {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        });

        // Attempting to encrypt and map large bounds natively
        const data = { type: 'image', dataUrl: 'data:image/jpeg;base64,A'.repeat(1000) };
        const result = await encryptAndSaveItem('123', data);

        // Core component logic dictates `false` on storage failure preventing total generic crashes.
        expect(result).toBe(false);
        expect(setItemSpy).toHaveBeenCalled();
    });

    it('should skip corrupted or un-decryptable JSON components natively returning only cleanly valid items', async () => {
        // Set an arbitrary string directly simulating corrupted OS array dimensions or old scheme versions
        localStorage.setItem('privguard_item_999', 'invalid_base_64_garbage');
        
        const validData = { id: 100, text: 'valid payload mapping cleanly' };
        await encryptAndSaveItem(validData.id, validData);

        const items = await loadAllEncryptedItems();
        
        // Assert only the completely clean element successfully rendered tracking dynamically mapped arrays
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe(100);
        
        // Ensure invalid component is still locally preserved organically instead of wiping structural history natively
        expect(localStorage.getItem('privguard_item_999')).toBe('invalid_base_64_garbage');
    });
});
