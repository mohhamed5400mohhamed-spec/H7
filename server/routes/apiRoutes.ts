import type express from 'express';
import { dataManager } from '../data/dataAdapter.ts';
import { storageManager } from '../storage/storageAdapter.ts';
import { HttpRateLimiter, createRateLimitMiddleware } from '../security/httpRateLimiter.ts';
import { toPublicMediaUrl } from '../utils/security.ts';

export interface ApiRoutesDeps {
  isUploadAuthorized: (req: express.Request) => boolean;
  getInitialAppearancePayload: () => Record<string, any>;
  getStatsPayload: () => {
    onlineUsers: number;
    activeRooms: number;
    totalMessages: number;
  };
}

export function buildIceServersFromEnv(): Array<{ urls: string | string[]; username?: string; credential?: string }> {
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  const turnUrlsRaw = (
    process.env.TURN_SERVER_URL ||
    process.env.VITE_TURN_SERVER_URL ||
    ''
  ).trim();
  const turnUser = (process.env.TURN_USERNAME || process.env.VITE_TURN_USERNAME || '').trim();
  const turnPass = (process.env.TURN_CREDENTIAL || process.env.VITE_TURN_CREDENTIAL || '').trim();

  if (turnUrlsRaw) {
    const urls = turnUrlsRaw
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length > 0) {
      iceServers.unshift({
        urls: urls.length === 1 ? urls[0] : urls,
        username: turnUser || undefined,
        credential: turnPass || undefined
      });
    }
  }

  return iceServers;
}

export function registerApiRoutes(app: express.Express, deps: ApiRoutesDeps): void {
  const uploadRateLimiter = new HttpRateLimiter(20, 60_000);
  const searchRateLimiter = new HttpRateLimiter(30, 60_000);
  const apiReadRateLimiter = new HttpRateLimiter(120, 60_000);

  const uploadLimitMw = createRateLimitMiddleware(uploadRateLimiter, {
    bucketPrefix: 'upload',
    errorMessage: 'تم تجاوز حد رفع الملفات المسموح به في الدقيقة، يرجى الانتظار قليلاً.'
  });
  const searchLimitMw = createRateLimitMiddleware(searchRateLimiter, {
    bucketPrefix: 'yt-search',
    errorMessage: 'تم إرسال عدد كبير من طلبات البحث، يرجى الانتظار قليلاً.'
  });
  const readLimitMw = createRateLimitMiddleware(apiReadRateLimiter, {
    bucketPrefix: 'api-read'
  });

  // Ultra-lightweight keepalive endpoint for background Web Worker (exempt from tight rate limiting)
  app.get('/api/keepalive', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.status(200).json({ ok: true, ts: Date.now() });
  });

  // Health & Stats endpoints
  app.get(['/health', '/api/health'], (_req, res) => {
    const stats = deps.getStatsPayload();
    res.status(200).json({
      status: 'healthy',
      uptime: Math.floor(process.uptime()),
      timestamp: Date.now(),
      onlineUsers: stats.onlineUsers,
      activeRooms: stats.activeRooms,
      version: '1.0.0'
    });
  });

  app.get('/api/stats', readLimitMw, (_req, res) => {
    res.json(deps.getStatsPayload());
  });

  // Storage & Database Health / Status Endpoint
  app.get('/api/system/storage-status', readLimitMw, (_req, res) => {
    res.json({
      success: true,
      data: dataManager.getStatus(),
      storage: {
        provider: storageManager.getProviderName(),
        isExternal: storageManager.isExternal(),
        endpoint: storageManager.getConfig().endpoint || 'local filesystem',
        bucket: storageManager.getConfig().bucket || 'uploads'
      }
    });
  });

  // Dynamic WebRTC ICE / TURN credentials
  app.get('/api/turn-credentials', readLimitMw, (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({
      success: true,
      iceServers: buildIceServersFromEnv()
    });
  });

  // Ultra-Fast Initial Appearance Endpoint
  app.get('/api/initial-appearance', readLimitMw, (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    res.json(deps.getInitialAppearancePayload());
  });

  // YouTube Search API Endpoint
  app.get('/api/youtube-search', searchLimitMw, async (req, res) => {
    const query = (req.query.q as string)?.trim();
    if (!query) {
      return res.status(400).json({ success: false, results: [], error: 'يرجى إدخال كلمة البحث' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const ytResponse = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        signal: controller.signal,
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20240201.00.00',
              hl: 'ar',
              gl: 'SA'
            }
          },
          query
        })
      });
      clearTimeout(timeoutId);

      if (ytResponse.ok) {
        const data = (await ytResponse.json()) as any;
        const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
        const formatted: Array<{
          id: string;
          title: string;
          thumbnail: string;
          duration: string;
          channelTitle: string;
          views: string;
          uploadedAt: string;
          url: string;
        }> = [];

        for (const sec of sections) {
          const items = sec.itemSectionRenderer?.contents || [];
          for (const item of items) {
            if (item.videoRenderer) {
              const v = item.videoRenderer;
              const videoId = v.videoId;
              if (videoId && typeof videoId === 'string') {
                const title =
                  v.title?.runs?.map((r: any) => r.text).join('') ||
                  v.title?.simpleText ||
                  query;
                const thumbnail =
                  v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                const duration = v.lengthText?.simpleText || '';
                const channelTitle =
                  v.ownerText?.runs?.map((r: any) => r.text).join('') ||
                  'قناة يوتيوب';
                const views =
                  v.viewCountText?.simpleText ||
                  (v.viewCountText?.runs ? v.viewCountText.runs.map((r: any) => r.text).join('') : '');
                const uploadedAt = v.publishedTimeText?.simpleText || '';

                formatted.push({
                  id: videoId,
                  title,
                  thumbnail,
                  duration,
                  channelTitle,
                  views,
                  uploadedAt,
                  url: `https://www.youtube.com/watch?v=${videoId}`
                });
              }
            }
          }
        }

        if (formatted.length > 0) {
          return res.json({ success: true, results: formatted.slice(0, 25) });
        }
      }

      const fallbackController = new AbortController();
      const fallbackTimer = setTimeout(() => fallbackController.abort(), 5000);
      const invidiousRes = await fetch(`https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        headers: { Accept: 'application/json' },
        signal: fallbackController.signal
      });
      clearTimeout(fallbackTimer);

      if (invidiousRes.ok) {
        const invData = (await invidiousRes.json()) as any[];
        if (Array.isArray(invData) && invData.length > 0) {
          const invResults = invData
            .slice(0, 20)
            .map((v) => ({
              id: v.videoId || '',
              title: v.title || query,
              thumbnail: v.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
              duration: v.lengthSeconds ? `${Math.floor(v.lengthSeconds / 60)}:${String(v.lengthSeconds % 60).padStart(2, '0')}` : '',
              channelTitle: v.author || 'قناة يوتيوب',
              views: v.viewCount ? `${v.viewCount.toLocaleString()} مشاهدة` : '',
              uploadedAt: v.publishedText || '',
              url: `https://www.youtube.com/watch?v=${v.videoId}`
            }))
            .filter((v) => Boolean(v.id));

          if (invResults.length > 0) {
            return res.json({ success: true, results: invResults });
          }
        }
      }

      return res.json({ success: true, results: [] });
    } catch (err: any) {
      console.error('[YouTube Search] Search error handled safely:', err?.message);
      return res.json({
        success: true,
        results: [],
        warning: 'تعذر الاتصال بخدمة البحث مؤقتاً، يمكنك لصق رابط الفيديو مباشرة في الحائط.'
      });
    }
  });

  // HTTP Media Upload Endpoints
  app.post('/api/upload-media-binary', uploadLimitMw, async (req, res) => {
    try {
      if (!deps.isUploadAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول أولاً لرفع الملفات.' });
      }
      const rawFilename = req.headers['x-filename'] ? decodeURIComponent(req.headers['x-filename'] as string) : 'file';
      const mime = (req.headers['content-type'] || '').toLowerCase();
      if (mime.includes('svg') || /\.svg$/i.test(rawFilename)) {
        return res.status(400).json({ success: false, error: 'صيغة SVG غير مسموح برفعها لأسباب أمنية.' });
      }

      const uploadResult = await storageManager.saveStream(req, rawFilename, mime);

      return res.json({
        success: uploadResult.success,
        url: toPublicMediaUrl(uploadResult.url),
        mediaType: uploadResult.mediaType,
        size: uploadResult.size,
        filename: uploadResult.filename,
        provider: uploadResult.provider
      });
    } catch (err: any) {
      console.error('Error in binary upload:', err);
      return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ الملف على الخادم أو التخزين السحابي' });
    }
  });

  app.post('/api/upload-media', uploadLimitMw, async (req, res) => {
    try {
      if (!deps.isUploadAuthorized(req)) {
        return res.status(401).json({ success: false, error: 'يجب تسجيل الدخول أولاً لرفع الملفات.' });
      }
      const { dataUrl, filename, mediaType } = req.body;
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'بيانات الملف مفقودة' });
      }

      const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let mime = '';

      if (matches && matches.length === 3) {
        mime = matches[1].toLowerCase();
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(dataUrl, 'base64');
      }

      const originalFilename = filename || `file_${Date.now()}`;
      if (mime.includes('svg') || /\.svg$/i.test(originalFilename)) {
        return res.status(400).json({ success: false, error: 'صيغة SVG غير مسموح برفعها لأسباب أمنية.' });
      }
      if (buffer.length > 25 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: 'حجم الملف يتجاوز 25 ميجابايت.' });
      }

      const uploadResult = await storageManager.saveBuffer(buffer, originalFilename, mime);

      return res.json({
        success: uploadResult.success,
        url: toPublicMediaUrl(uploadResult.url),
        mediaType: mediaType || uploadResult.mediaType,
        size: uploadResult.size,
        filename: uploadResult.filename,
        provider: uploadResult.provider
      });
    } catch (err: any) {
      console.error('Error saving uploaded media:', err);
      return res.status(500).json({ success: false, error: 'فشل حفظ الملف على الخادم أو التخزين السحابي' });
    }
  });
}
