import { describe, it, expect, afterEach } from 'vitest';
import { HttpRateLimiter } from '../server/security/httpRateLimiter.ts';
import { SocketFloodGuard } from '../server/security/floodGuard.ts';

describe('Rate Limiters & Flood Guard', () => {
  const limiters: HttpRateLimiter[] = [];

  afterEach(() => {
    while (limiters.length > 0) {
      limiters.pop()?.dispose();
    }
  });

  describe('HttpRateLimiter', () => {
    it('allows requests up to maxRequests within window and blocks excess', () => {
      const limiter = new HttpRateLimiter(3, 10_000);
      limiters.push(limiter);

      const t0 = 1_000_000;
      const r1 = limiter.check('upload:1.2.3.4', t0);
      const r2 = limiter.check('upload:1.2.3.4', t0 + 100);
      const r3 = limiter.check('upload:1.2.3.4', t0 + 200);
      const r4 = limiter.check('upload:1.2.3.4', t0 + 300);

      expect(r1).toMatchObject({ allowed: true, remaining: 2 });
      expect(r2).toMatchObject({ allowed: true, remaining: 1 });
      expect(r3).toMatchObject({ allowed: true, remaining: 0 });
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    });

    it('resets quota cleanly after window expires or on explicit reset()', () => {
      const limiter = new HttpRateLimiter(2, 5_000);
      limiters.push(limiter);

      const t0 = 2_000_000;
      expect(limiter.check('api:user1', t0).allowed).toBe(true);
      expect(limiter.check('api:user1', t0 + 50).allowed).toBe(true);
      expect(limiter.check('api:user1', t0 + 100).allowed).toBe(false);

      // After window elapses
      expect(limiter.check('api:user1', t0 + 5_001)).toMatchObject({
        allowed: true,
        remaining: 1
      });

      // Explicit reset
      expect(limiter.check('api:user1', t0 + 5_100).allowed).toBe(true);
      expect(limiter.check('api:user1', t0 + 5_200).allowed).toBe(false);
      limiter.reset('api:user1');
      expect(limiter.check('api:user1', t0 + 5_250).allowed).toBe(true);
    });
  });

  describe('SocketFloodGuard', () => {
    it('blocks spamming sockets after capacity depletion and honors exemptions + reset', () => {
      const guard = new SocketFloodGuard(3, 1, 2000);

      // Exempt users always bypass
      for (let i = 0; i < 10; i++) {
        expect(guard.isAllowed('socket-vip', true)).toBe(true);
      }

      // Normal socket consumes burst capacity (3)
      expect(guard.isAllowed('socket-normal')).toBe(true);
      expect(guard.isAllowed('socket-normal')).toBe(true);
      expect(guard.isAllowed('socket-normal')).toBe(true);

      // Next immediate calls are throttled
      expect(guard.isAllowed('socket-normal')).toBe(false);
      expect(guard.isAllowed('socket-normal')).toBe(false);

      // Resetting restores capacity
      guard.reset('socket-normal');
      expect(guard.isAllowed('socket-normal')).toBe(true);
    });
  });
});
