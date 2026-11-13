/** Two extrema per screen-space bucket retain short pulses with bounded SVG work. */
export function scopeTrace(
  samples: readonly { t: number; v: number | null }[],
  now: number,
  timebase: number,
  volts: number,
): string {
  if (!(timebase > 0) || !(volts > 0)) return '';
  const start = Math.max(0, now - timebase * 10),
    duration = timebase * 10;
  const buckets = new Map<
    number,
    { min: { t: number; v: number }; max: { t: number; v: number } }
  >();
  for (const sample of samples) {
    if (sample.t < start || sample.t > now || sample.v === null || !Number.isFinite(sample.v))
      continue;
    const point = { t: sample.t, v: sample.v };
    const column = Math.min(239, Math.floor(((point.t - start) / duration) * 240));
    const bucket = buckets.get(column);
    if (!bucket) buckets.set(column, { min: point, max: point });
    else {
      if (point.v < bucket.min.v) bucket.min = point;
      if (point.v > bucket.max.v) bucket.max = point;
    }
  }
  const points = [...buckets.values()].flatMap(({ min, max }) =>
    min === max ? [min] : min.t < max.t ? [min, max] : [max, min],
  );
  return points
    .map(
      (s, i) =>
        `${i ? 'L' : 'M'}${(((s.t - start) / duration) * 240).toFixed(1)},${(80 - Math.max(-1, Math.min(6, s.v / volts)) * 12).toFixed(1)}`,
    )
    .join(' ');
}
