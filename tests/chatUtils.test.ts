import { describe, it, expect } from 'vitest';
import {
  expandClientShortcuts,
  findMatchingShortcut,
  type ChatShortcut
} from '../src/utils/chatShortcuts.ts';
import { extractYouTubeVideoId, cleanYouTubeUrlFromText } from '../src/utils/youtube.ts';

describe('Client Chat Utilities', () => {
  const sampleShortcuts: ChatShortcut[] = [
    { id: '1', trigger: 'نورت', replacement: 'نورت الشات بطلتك الحلوه 🌹✨', createdAt: 1 },
    { id: '2', trigger: 'ن', replacement: 'نورتو يالي دخلتو 🌟', createdAt: 2 },
    { id: '3', trigger: 'باك', replacement: 'باك أسعد الله أوقاتكم 🎉', createdAt: 3 }
  ];

  describe('chatShortcuts', () => {
    it('expands exact shortcut matches and longer triggers before shorter substrings', () => {
      expect(expandClientShortcuts('نورت', sampleShortcuts)).toBe('نورت الشات بطلتك الحلوه 🌹✨');
      expect(expandClientShortcuts('ن', sampleShortcuts)).toBe('نورتو يالي دخلتو 🌟');
    });

    it('expands standalone tokens inside sentences without corrupting unrelated words', () => {
      expect(expandClientShortcuts('يا هلا نورت يا غالي', sampleShortcuts)).toBe(
        'يا هلا نورت الشات بطلتك الحلوه 🌹✨ يا غالي'
      );
      expect(expandClientShortcuts('نحن هنا', sampleShortcuts)).toBe('نحن هنا');
    });

    it('detects matching shortcuts for live preview pills', () => {
      expect(findMatchingShortcut('باك', sampleShortcuts)?.id).toBe('3');
      expect(findMatchingShortcut('أهلاً نورت', sampleShortcuts)?.id).toBe('1');
      expect(findMatchingShortcut('رسالة عادية', sampleShortcuts)).toBeNull();
    });
  });

  describe('youtube URL extraction', () => {
    it('extracts 11-char video IDs from watch, short, shorts, embed, and live URLs', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=123')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null on invalid or non-YouTube URLs and strips extracted URL cleanly', () => {
      expect(extractYouTubeVideoId('https://vimeo.com/12345')).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
      expect(cleanYouTubeUrlFromText('اسمع هذا المقطع https://youtu.be/dQw4w9WgXcQ رائع')).toBe(
        'اسمع هذا المقطع  رائع'
      );
    });
  });
});
