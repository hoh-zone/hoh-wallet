// Crypto utilities for encrypting/decrypting mnemonic with password
export class WalletCrypto {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  // Derive key from password
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt mnemonic with password
  static async encrypt(mnemonic: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const key = await this.deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv: iv },
      key,
      encoder.encode(mnemonic)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  // Decrypt mnemonic with password
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    const decoder = new TextDecoder();
    const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 16 + this.IV_LENGTH);
    const encrypted = data.slice(16 + this.IV_LENGTH);

    const key = await this.deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv: iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  }
}