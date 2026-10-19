import { describe, expect, it } from 'vitest';
import { resolveStatsPeriod, InvalidStatsQuery, boundedJson } from './report';

const now = new Date('2026-10-19T13:17:00Z');
describe('report periods', () => {
  it('resolves calendar boundaries and equal preceding windows', () => {
    expect(resolveStatsPeriod({ range: '30d' }, now)).toEqual({
      start: '2026-09-20',
      end: '2026-10-19',
      previousStart: '2026-08-21',
      previousEnd: '2026-09-19',
    });
    expect(resolveStatsPeriod({ range: 'yesterday' }, now)).toEqual({
      start: '2026-10-18',
      end: '2026-10-18',
      previousStart: '2026-10-17',
      previousEnd: '2026-10-17',
    });
    expect(resolveStatsPeriod({ range: 'month' }, now).start).toBe('2026-10-01');
  });
  it.each([
    { range: 'custom' as const },
    { range: 'custom' as const, start: '2026-02-30', end: '2026-03-02' },
    { range: 'custom' as const, start: '2026-10-19', end: '2026-10-18' },
    { range: 'custom' as const, start: '2025-01-01', end: '2026-10-19' },
    { range: 'custom' as const, start: '2026-10-19', end: '2026-10-20' },
  ])('rejects invalid periods %j', (query) => {
    expect(() => resolveStatsPeriod(query, now)).toThrow(InvalidStatsQuery);
  });
  it('cancels oversized upstream bodies', async () => {
    await expect(boundedJson(Response.json({ value: 'a'.repeat(100) }), 20)).rejects.toMatchObject({
      safeReason: 'upstream_limit',
    });
    await expect(boundedJson(new Response('not json'))).rejects.toMatchObject({ safeReason: 'upstream_shape' });
  });
});
