import { test, expect } from 'vitest';
import { scopeTrace } from './scopeTrace';
test('bounds geometry while retaining narrow voltage spikes', () => {
  const samples = Array.from({ length: 100000 }, (_, i) => ({
    t: i / 10000,
    v: i === 50001 ? 5 : 0,
  }));
  const path = scopeTrace(samples, 10, 1, 1);
  expect(path.match(/[ML]/g)!.length).toBeLessThanOrEqual(480);
  expect(path).toContain(',20.0');
  expect(scopeTrace([{ t: 0, v: null }], 1, 1, 1)).toBe('');
});
test('clips stale samples, future samples and invalid scales', () => {
  expect(
    scopeTrace(
      [
        { t: 0, v: 5 },
        { t: 12, v: 5 },
        { t: 11, v: 2 },
      ],
      11,
      0.1,
      1,
    ),
  ).toBe('M240.0,56.0');
  expect(scopeTrace([{ t: 0, v: 5 }], 0, 0, 1)).toBe('');
});
