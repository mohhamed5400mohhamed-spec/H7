import { describe, it, expect } from 'vitest';
import {
  MONGO_CHUNK_THRESHOLD_BYTES,
  splitPayloadIntoChunks,
  reassemblePayloadFromChunks
} from '../server/data/dataAdapter.ts';

describe('MongoDB auto-chunking & reassembly helpers', () => {
  it('exposes the safe 3.5MB default threshold', () => {
    expect(MONGO_CHUNK_THRESHOLD_BYTES).toBe(3_500_000);
  });

  it('returns null when payload fits below threshold', () => {
    const smallArray = [{ id: 1, text: 'hello' }, { id: 2, text: 'world' }];
    expect(splitPayloadIntoChunks(smallArray, 10_000)).toBeNull();
  });

  it('splits large arrays into multiple chunks and reassembles identically', () => {
    const items = Array.from({ length: 60 }, (_, idx) => ({
      id: `msg_${idx}`,
      sender: `User_${idx % 5}`,
      text: 'x'.repeat(250)
    }));

    const split = splitPayloadIntoChunks(items, 2_500);
    expect(split).not.toBeNull();
    expect(split!.kind).toBe('array');
    expect(split!.chunks.length).toBeGreaterThan(2);

    for (const chunk of split!.chunks) {
      expect(Buffer.byteLength(JSON.stringify(chunk), 'utf8')).toBeLessThanOrEqual(2_500);
    }

    const restored = reassemblePayloadFromChunks(
      { __chunked: true, kind: split!.kind, chunkCount: split!.chunks.length },
      split!.chunks
    );
    expect(restored).toEqual(items);
  });

  it('splits large plain objects/maps into multiple chunks and reassembles identically', () => {
    const record: Record<string, { name: string; bio: string }> = {};
    for (let i = 0; i < 40; i++) {
      record[`user_${i}`] = { name: `Hassan ${i}`, bio: 'B'.repeat(200) };
    }

    const split = splitPayloadIntoChunks(record, 2_000);
    expect(split).not.toBeNull();
    expect(split!.kind).toBe('object');
    expect(split!.chunks.length).toBeGreaterThan(2);

    const restored = reassemblePayloadFromChunks(
      { __chunked: true, kind: split!.kind, chunkCount: split!.chunks.length },
      split!.chunks
    );
    expect(restored).toEqual(record);
  });

  it('handles oversized primitive string payloads via json chunking fallback', () => {
    const hugeString = 'Z'.repeat(8_000);
    const split = splitPayloadIntoChunks(hugeString, 2_500);
    expect(split).not.toBeNull();
    expect(split!.kind).toBe('json');
    expect(split!.chunks.length).toBeGreaterThan(1);

    const restored = reassemblePayloadFromChunks(
      { __chunked: true, kind: split!.kind, chunkCount: split!.chunks.length },
      split!.chunks
    );
    expect(restored).toBe(hugeString);
  });
});
