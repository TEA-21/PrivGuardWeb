const APP_SECRET = 'privguard-super-secret-key-material';
const PBKDF2_ITERATIONS = 100000;
const SESSION_KEY_NAME = 'privguard_session_key';

// Utility to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Utility to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Key Derivation: PBKDF2
async function deriveKey() {
  // If key already stored in sessionStorage, import it
  const storedJwk = sessionStorage.getItem(SESSION_KEY_NAME);
  if (storedJwk) {
    try {
      const jwk = JSON.parse(storedJwk);
      const importedKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      );
      return importedKey;
    } catch (e) {
      console.warn('Failed to parse stored session key. Deriving new one...', e);
    }
  }

  // Otherwise, derive a new key from APP_SECRET + userAgent
  const enc = new TextEncoder();
  
  // Create base key material
  const baseKeyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(APP_SECRET),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Use userAgent as salt for device binding
  const salt = enc.encode(navigator.userAgent || 'unknown-device');

  // Derive AES-GCM key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // Extractable so we can save to sessionStorage
    ['encrypt', 'decrypt']
  );

  // Export and save to sessionStorage for this tab
  const jwk = await crypto.subtle.exportKey('jwk', aesKey);
  sessionStorage.setItem(SESSION_KEY_NAME, JSON.stringify(jwk));

  return aesKey;
}

// Init key promise to avoid re-deriving concurrently
let keyPromise = null;
function getKey() {
  if (!keyPromise) {
    keyPromise = deriveKey();
  }
  return keyPromise;
}

export async function encryptAndSaveItem(id, dataObj) {
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const jsonStr = JSON.stringify(dataObj);
    const enc = new TextEncoder();
    
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      enc.encode(jsonStr)
    );

    // Combine IV and Ciphertext
    const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertextBuffer), iv.length);

    const base64Data = arrayBufferToBase64(combined.buffer);
    localStorage.setItem(`privguard_item_${id}`, base64Data);
    return true;
  } catch (error) {
    console.error('Failed to encrypt and save item', error);
    return false;
  }
}

export async function loadAllEncryptedItems() {
  try {
    const key = await getKey();
    const dec = new TextDecoder();

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey.startsWith('privguard_item_')) {
            keys.push(storageKey);
        }
    }

    const itemsList = await Promise.all(keys.map(async (storageKey) => {
        const base64Data = localStorage.getItem(storageKey);
        try {
            const buffer = base64ToArrayBuffer(base64Data);
            const combined = new Uint8Array(buffer);
            if (combined.length < 12) return null; // Invalid data
            
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                ciphertext
            );

            const jsonStr = dec.decode(decryptedBuffer);
            return JSON.parse(jsonStr);
        } catch (e) {
            console.warn(`Failed to decrypt item ${storageKey}, skipping.`, e);
            return null;
        }
    }));

    // Sort by id descending natively applying filter to natively drop purely null mappings
    return itemsList.filter(Boolean).sort((a, b) => b.id - a.id);
  } catch (e) {
    console.error('Failed to load items', e);
    return [];
  }
}

export function deleteEncryptedItem(id) {
  localStorage.removeItem(`privguard_item_${id}`);
}

export function clearAllEncryptedItems() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (storageKey.startsWith('privguard_item_')) {
      keysToRemove.push(storageKey);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}
