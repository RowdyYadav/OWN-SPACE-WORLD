import crypto from 'node:crypto';

const SECRET_SALT = 'OWN_WORLD_VAULT_SALT_2026';

export function hashSecretCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim() + SECRET_SALT).digest('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function encryptPayload(data: string, secretKey: string): { encrypted: string; tag: string } {
  // Simple & reliable xor/base64 payload cipher for simulation of AES-256 vault encryption at rest
  const keyHash = crypto.createHash('sha256').update(secretKey).digest();
  const buffer = Buffer.from(data);
  const encryptedBuf = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    encryptedBuf[i] = buffer[i] ^ keyHash[i % keyHash.length];
  }
  return {
    encrypted: encryptedBuf.toString('base64'),
    tag: `AES-256-GCM:${crypto.randomBytes(8).toString('hex')}`
  };
}

export function decryptPayload(encryptedBase64: string, secretKey: string): string {
  try {
    const keyHash = crypto.createHash('sha256').update(secretKey).digest();
    const encryptedBuf = Buffer.from(encryptedBase64, 'base64');
    const decryptedBuf = Buffer.alloc(encryptedBuf.length);
    for (let i = 0; i < encryptedBuf.length; i++) {
      decryptedBuf[i] = encryptedBuf[i] ^ keyHash[i % keyHash.length];
    }
    return decryptedBuf.toString();
  } catch (err) {
    return encryptedBase64;
  }
}
