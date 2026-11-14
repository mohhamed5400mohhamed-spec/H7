import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  sanitizeText,
  sanitizeUrl,
  hashPassword,
  verifyPassword,
  isBcryptHash,
  signSessionToken,
  createSignedSessionToken,
  verifySignedSessionToken,
  toPublicMediaUrl
} from '../server/utils/security.ts';
import { buildIceServersFromEnv } from '../server/routes/apiRoutes.ts';

describe('server/utils/security', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe('sanitizeText', () => {
    it('escapes dangerous HTML entities and trims surrounding whitespace', () => {
      expect(sanitizeText('  <script>alert("xss")</script> & \'test\'  ')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;'
      );
    });

    it('returns empty string for null or undefined inputs', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('blocks javascript:, vbscript:, and data:text/html URIs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('  JAVASCRIPT:void(0)  ')).toBe('');
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(sanitizeUrl('data:   text/html;base64,abc')).toBe('');
    });

    it('allows safe https, relative, and media data URIs', () => {
      expect(sanitizeUrl(' https://example.com/pic.png ')).toBe('https://example.com/pic.png');
      expect(sanitizeUrl('/uploads/avatar.webp')).toBe('/uploads/avatar.webp');
      expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    });
  });

  describe('password hashing & verification', () => {
    it('hashes plaintext passwords with bcrypt and avoids double-hashing', () => {
      const hash = hashPassword('MySecretPass123!');
      expect(isBcryptHash(hash)).toBe(true);
      expect(hash).not.toBe('MySecretPass123!');
      expect(hashPassword(hash)).toBe(hash);
    });

    it('verifies valid and invalid passwords against bcrypt and legacy plaintext', () => {
      const hash = hashPassword('RoomKey#2026');
      expect(verifyPassword('RoomKey#2026', hash)).toBe(true);
      expect(verifyPassword('WrongPass', hash)).toBe(false);
      expect(verifyPassword('legacy123', 'legacy123')).toBe(true);
      expect(verifyPassword('legacy123', 'legacy999')).toBe(false);
      expect(verifyPassword('', hash)).toBe(false);
    });
  });

  describe('signed session tokens', () => {
    it('creates and verifies valid HMAC-SHA256 session tokens', () => {
      const token = createSignedSessionToken('super-strong-test-secret-123456');
      expect(token.startsWith('st_')).toBe(true);
      expect(verifySignedSessionToken(token, 'super-strong-test-secret-123456')).toBe(true);
    });

    it('rejects tampered payloads, altered signatures, wrong prefixes, and wrong secrets', () => {
      const secret = 'super-strong-test-secret-123456';
      const token = signSessionToken('user-abc-123', secret);
      expect(verifySignedSessionToken(token, secret)).toBe(true);

      // Wrong secret
      expect(verifySignedSessionToken(token, 'different-secret-9876543210')).toBe(false);

      // Wrong prefix
      expect(verifySignedSessionToken(token.replace(/^st_/, 'xx_'), secret)).toBe(false);

      // Tampered payload
      const [prefixPayload, sig] = token.split('.');
      const tampered = `${prefixPayload}A.${sig}`;
      expect(verifySignedSessionToken(tampered, secret)).toBe(false);

      // Tampered signature
      const flippedChar = sig[0] === 'a' ? 'b' : 'a';
      expect(verifySignedSessionToken(`${prefixPayload}.${flippedChar}${sig.slice(1)}`, secret)).toBe(false);

      // Malformed strings
      expect(verifySignedSessionToken('')).toBe(false);
      expect(verifySignedSessionToken(null)).toBe(false);
      expect(verifySignedSessionToken('st_onlypayloadwithoutdot')).toBe(false);
    });
  });

  describe('toPublicMediaUrl', () => {
    it('strips localhost:3000 origin and respects configured PUBLIC_SERVER_URL', () => {
      delete process.env.PUBLIC_SERVER_URL;
      delete process.env.SERVER_PUBLIC_URL;
      delete process.env.STORAGE_PUBLIC_URL_PREFIX;

      expect(toPublicMediaUrl('http://localhost:3000/uploads/img.jpg')).toBe('/uploads/img.jpg');
      expect(toPublicMediaUrl('https://cdn.example.com/img.jpg')).toBe('https://cdn.example.com/img.jpg');

      process.env.PUBLIC_SERVER_URL = 'https://chat.hassanpro.com/';
      expect(toPublicMediaUrl('/uploads/voice.webm')).toBe('https://chat.hassanpro.com/uploads/voice.webm');
    });
  });

  describe('buildIceServersFromEnv', () => {
    it('includes default STUN servers when no TURN env vars are configured', () => {
      delete process.env.TURN_SERVER_URL;
      delete process.env.VITE_TURN_SERVER_URL;
      const servers = buildIceServersFromEnv();
      expect(servers.length).toBeGreaterThanOrEqual(3);
      expect(servers.some((s) => String(s.urls).includes('stun.l.google.com'))).toBe(true);
    });

    it('prepends custom TURN server(s) and credentials from env vars', () => {
      process.env.TURN_SERVER_URL = 'turn:turn1.example.com:3478, turns:turn2.example.com:5349';
      process.env.TURN_USERNAME = 'webrtc-user';
      process.env.TURN_CREDENTIAL = 'webrtc-pass';

      const servers = buildIceServersFromEnv();
      expect(servers[0]).toEqual({
        urls: ['turn:turn1.example.com:3478', 'turns:turn2.example.com:5349'],
        username: 'webrtc-user',
        credential: 'webrtc-pass'
      });
    });
  });
});
