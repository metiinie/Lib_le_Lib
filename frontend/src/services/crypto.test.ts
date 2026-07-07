import { cryptoService } from './crypto.service';

describe('Chat Confidentiality & E2E Encryption', () => {
  it('must strictly encrypt outgoing messages (no plaintext recoverable without decryption)', async () => {
    const plaintext = 'Hello, this is a highly sensitive message about my status.';
    const recipientKey = 'curve25519_mock123';

    const ciphertext = await cryptoService.encryptMessage(plaintext, recipientKey);

    // Assert the ciphertext doesn't accidentally contain the plaintext
    expect(ciphertext).not.toContain('Hello');
    expect(ciphertext).not.toContain('sensitive');
    expect(ciphertext).not.toContain(plaintext);

    // Assert that the decryption successfully restores the original
    const decrypted = await cryptoService.decryptMessage(ciphertext);
    expect(decrypted).toBe(plaintext);
  });
});
