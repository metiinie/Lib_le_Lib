import * as SecureStore from 'expo-secure-store';

/**
 * MOCK Olm Encryption Service
 * In a real environment, this would initialize @matrix-org/olm (which requires C++ native bindings).
 * For the MVP frontend scaffolding, we simulate the crypto layer to ensure the UI and State
 * pass the required plaintext/ciphertext barriers.
 */
export const cryptoService = {
  // Store the local identity keys
  generateDeviceKeys: async (): Promise<{ ed25519: string; curve25519: string }> => {
    const mockEd25519 = `ed25519_${Math.random().toString(36).slice(2)}`;
    const mockCurve25519 = `curve25519_${Math.random().toString(36).slice(2)}`;
    
    await SecureStore.setItemAsync('crypto_keys', JSON.stringify({
      ed25519: mockEd25519,
      curve25519: mockCurve25519
    }));

    return { ed25519: mockEd25519, curve25519: mockCurve25519 };
  },

  // Ensure no plaintext passes to the network
  encryptMessage: async (plaintext: string, recipientPublicKey: string): Promise<string> => {
    // Basic mock encryption that mangles the text so it's not recognizable
    const base64Str = btoa(encodeURIComponent(plaintext));
    const ciphertext = base64Str.split('').reverse().join('') + `_enc_${recipientPublicKey}`;
    return ciphertext;
  },

  decryptMessage: async (ciphertext: string): Promise<string> => {
    if (!ciphertext.includes('_enc_')) return ciphertext; // Not encrypted or badly formatted
    const base64Str = ciphertext.split('_enc_')[0].split('').reverse().join('');
    return decodeURIComponent(atob(base64Str));
  }
};
