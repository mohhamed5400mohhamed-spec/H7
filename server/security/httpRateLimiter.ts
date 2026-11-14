import type express from 'express';

interface WindowCounter {
  count: number;
  resetAt: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding/fixed-window in-memory HTTP rate limiter per IP + route bucket.
 */
export class HttpRateLimiter {
  private windows = new Map<string, WindowCounter>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {
    this.cleanupTimer = setInterval(() => this.cleanup(), Math.max(30_000, this.windowMs));
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  public check(key: string, now: number = Date.now()): RateLimitCheckResult {
    const safeKey = key || 'unknown';
    const current = this.windows.get(safeKey);

    if (!current || now >= current.resetAt) {
      this.windows.set(safeKey, {
        count: 1,
        resetAt: now + this.windowMs
      });
      return {
        allowed: true,
        remaining: Math.max(0, this.maxRequests - 1),
        retryAfterSeconds: Math.ceil(this.windowMs / 1000)
      };
    }

    if (current.count < this.maxRequests) {
      current.count += 1;
      return {
        allowed: true,
        remaining: Math.max(0, this.maxRequests - current.count),
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      };
    }

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    };
  }

  public reset(key: string): void {
    this.windows.delete(key);
  }

  public dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.windows.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [k, v] of this.windows.entries()) {
      if (now >= v.resetAt) {
        this.windows.delete(k);
      }
    }
  }
}

export function extractClientIpFromRequest(req: express.Request): string {
  const cfConnecting = (req.headers['cf-connecting-ip'] as string)?.trim();
  const xForwardedFor = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
  const xRealIp = (req.headers['x-real-ip'] as string)?.trim();
  let ip = cfConnecting || xForwardedFor || xRealIp || req.ip || req.socket?.remoteAddress || '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  return ip.trim() || '127.0.0.1';
}

export function createRateLimitMiddleware(
  limiter: HttpRateLimiter,
  options?: {
    bucketPrefix?: string;
    errorMessage?: string;
  }
): express.RequestHandler {
  const prefix = options?.bucketPrefix || 'http';
  const errorMessage =
    options?.errorMessage || 'تم إرسال طلبات كثيرة جداً في وقت قصير، يرجى الانتظار بضع ثوانٍ ثم المحاولة.';

  return (req, res, next) => {
    const ip = extractClientIpFromRequest(req);
    const result = limiter.check(`${prefix}:${ip}`);
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSeconds));
      return res.status(429).json({
        success: false,
        error: errorMessage,
        retryAfterSeconds: result.retryAfterSeconds
      });
    }
    next();
  };
}
