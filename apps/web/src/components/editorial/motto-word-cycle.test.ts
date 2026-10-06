import { describe, expect, it } from 'vitest';

import { findMottoCycleWord, mottoCycleLabels, tearKeyframes, trackPeaks } from './motto-word-cycle';

const words = ['records', 'art', 'noise'];

describe('motto word cycle', () => {
  it('starts from the written word in its case and punctuation', () => {
    const found = findMottoCycleWord('JUST RECORDS.', words);
    expect(found).toEqual({ before: 'JUST ', word: 'RECORDS', punctuation: '.', after: '' });
    expect(mottoCycleLabels(found!, words)).toEqual(['RECORDS.', 'ART.', 'NOISE.']);
    expect(mottoCycleLabels(findMottoCycleWord('Just Noise!', words)!, words)).toEqual(['Noise!', 'Records!', 'Art!']);
  });

  it('leaves a motto alone when its last word is not in the list', () => {
    expect(findMottoCycleWord('Fine music on record.', words)).toBeNull();
    expect(findMottoCycleWord('', words)).toBeNull();
  });

  it('draws the same bounded track for the same seed', () => {
    const peaks = trackPeaks(64, 16, 7);
    expect(peaks).toEqual(trackPeaks(64, 16, 7));
    expect(peaks).not.toEqual(trackPeaks(64, 16, 8));
    expect(Math.min(...peaks)).toBeGreaterThanOrEqual(0.08);
    expect(Math.max(...peaks)).toBeLessThanOrEqual(1);
    // Each beat opens on its loudest transient, so the clip reads as rhythm rather than noise.
    expect(peaks[16]).toBeGreaterThan(peaks[30]!);
  });

  it('cuts glitch bursts in and out within the scrub and ends hidden', () => {
    let state = 0;
    const random = () => (state = (state * 9301 + 49297) % 233280) / 233280;
    const frames = tearKeyframes(random, () => 'translateX(4px)');
    const offsets = frames.map((frame) => frame.offset!);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(frames.length).toBeGreaterThan(2);
    expect(frames.some((frame) => frame.opacity === 1)).toBe(true);
    expect([frames[0]!.opacity, frames.at(-1)!.opacity]).toEqual([0, 0]);
    expect(offsets.at(-1)).toBe(1);
    expect(
      Math.max(...frames.filter((frame) => frame.opacity === 1).map((frame) => frame.offset!)),
    ).toBeLessThanOrEqual(0.64);
  });
});
