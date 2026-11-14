import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : EPHEMERAL_SESSION_SECRET;
}

/**
 * XSS HTML entity sanitizer for user-supplied strings.
 */
export function sanitizeText(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

/**
 * URL sanitizer to prevent malicious URI execution (javascript:, vbscript:, data:text/html).
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(javascript|vbscript|data:\s*text\/html)/i.test(trimmed)) {
    return '';
  }
  return trimmed;
}

/**
 * Password hashing using bcrypt (10 salt rounds). Avoids double-hashing existing bcrypt hashes.
 */
export function hashPassword(plainPassword: string): string {
  if (!plainPassword) return '';
  if (plainPassword.startsWith('$2a$') || plainPassword.startsWith('$2b$')) {
    return plainPassword;
  }
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
}

/**
 * Verify password against stored bcrypt hash or legacy plaintext fallback.
 */
export function verifyPassword(plainPassword: string, storedHashOrPlain: string): boolean {
  if (!plainPassword || !storedHashOrPlain) return false;
  if (storedHashOrPlain.startsWith('$2a$') || storedHashOrPlain.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(plainPassword, storedHashOrPlain);
    } catch {
      return false;
    }
  }
  return plainPassword === storedHashOrPlain;
}

export function isBcryptHash(value?: string | null): boolean {
  return Boolean(value && (value.startsWith('$2a$') || value.startsWith('$2b$')));
}

/**
 * HMAC-SHA256 signed session tokens:
 * Format: `st_<payloadBase64Url>.<hmacHex>`
 */
export function signSessionToken(rawId: string, secretOverride?: string): string {
  const secret = secretOverride || getSessionSecret();
  const payload = Buffer.from(rawId, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
  return `st_${payload}.${sig}`;
}

export function createSignedSessionToken(secretOverride?: string): string {
  const randomPart = `${Date.now().toString(36)}_${crypto.randomBytes(12).toString('hex')}`;
  return signSessionToken(randomPart, secretOverride);
}

export function verifySignedSessionToken(token?: string | null, secretOverride?: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (!token.startsWith('st_')) return false;
  const body = token.slice(3);
  const dotIdx = body.indexOf('.');
  if (dotIdx <= 0) return false;
  const payload = body.slice(0, dotIdx);
  const providedSig = body.slice(dotIdx + 1);
  if (!payload || !providedSig || providedSig.length !== 32) return false;

  const secret = secretOverride || getSessionSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
  try {
    return crypto.timingSafeEqual(Buffer.from(providedSig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
}

export function toPublicMediaUrl(url: string): string {
  if (!url) return url;
  if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
    url = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3000/i, '');
  }
  if (/^https?:\/\//i.test(url)) return url;
  const configuredOrigin =
    process.env.PUBLIC_SERVER_URL ||
    process.env.SERVER_PUBLIC_URL ||
    process.env.STORAGE_PUBLIC_URL_PREFIX;
  if (configuredOrigin) {
    const origin = configuredOrigin.replace(/\/$/, '');
    return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
  }
  return url.startsWith('/') ? url : `/${url}`;
}
