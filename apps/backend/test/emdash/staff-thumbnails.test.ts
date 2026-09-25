import { expect, test } from 'vitest';
import {
  createStaffThumbnailCandidate,
  decodeStaffThumbnailOriginalKey,
  isStaffThumbnailOriginalKey,
  readStaffThumbnailMetadata,
  readStaffThumbnailPng,
  staffThumbnailStorageKey,
  staffThumbnailUrl,
} from '../../src/cms/staff-thumbnails';

const onePixelPng = Uint8Array.from(
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
);

test('accepts native flat filenames and rejects paths, controls, and unsupported formats', () => {
  for (const key of [
    '01JABC1234567890ABCDEF.png',
    'record-cover-2.JPEG',
    'artist_photo.webp',
    'café cover (live) 2.png',
    `cover-${'x'.repeat(185)}.webp`,
    'cover%2Fother.png',
  ]) {
    expect(isStaffThumbnailOriginalKey(key)).toBe(true);
    expect(staffThumbnailStorageKey(key)).toBe(`staff-thumbnails/v1/${key}.png`);
    expect(decodeStaffThumbnailOriginalKey(staffThumbnailUrl(key))).toBe(key);
  }
  for (const key of [
    '../cover.png',
    'folder/cover.png',
    'cover.gif',
    '.png',
    'cover.png/other',
    `cover-${'x'.repeat(196)}.png`,
    'cover\u0000.png',
  ]) {
    expect(isStaffThumbnailOriginalKey(key)).toBe(false);
    expect(staffThumbnailStorageKey(key)).toBeNull();
  }
  expect(decodeStaffThumbnailOriginalKey('/_emdash/api/blackbox/thumbnails/cover%2Epng')).toBeNull();
  expect(decodeStaffThumbnailOriginalKey('/_emdash/api/blackbox/thumbnails/cover.png/extra')).toBeNull();
});

test('accepts bounded PNGs and rejects malformed, oversized, or oversized-dimension images', () => {
  expect(readStaffThumbnailPng(onePixelPng)).toEqual({ width: 1, height: 1 });
  expect(readStaffThumbnailPng(Uint8Array.from([1, 2, 3]))).toBeNull();
  const oversized = new Uint8Array(onePixelPng);
  oversized[19] = 97;
  expect(readStaffThumbnailPng(oversized)).toBeNull();
  expect(readStaffThumbnailPng(new Uint8Array(40 * 1024 + 1))).toBeNull();
  expect(createStaffThumbnailCandidate('cover.png', onePixelPng)).toMatchObject({
    key: 'staff-thumbnails/v1/cover.png.png',
    width: 1,
    height: 1,
  });
});

test('validates stored metadata without trusting arbitrary dimensions', () => {
  expect(readStaffThumbnailMetadata({ version: '1', width: '96', height: '48' })).toEqual({ width: 96, height: 48 });
  expect(readStaffThumbnailMetadata({ version: '2', width: '96', height: '48' })).toBeNull();
  expect(readStaffThumbnailMetadata({ version: '1', width: '97', height: '48' })).toBeNull();
  expect(readStaffThumbnailMetadata(undefined)).toBeNull();
});
