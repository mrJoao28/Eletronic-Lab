import { describe, it, expect } from 'vitest';
import { meterReading } from './metering';
import { electronicsExample } from './electronicsExamples';
import { simulate } from './engine';
describe('Medição independente', () => {
  it('usa pontas próprias sem alterar o osciloscópio', () => {
    const p = electronicsExample('divider');
    p.meterProbes = { positive: 'ps:+', negative: 'gnd:0' };
    expect(meterReading(p, simulate(p), 'voltage').value).toBe(5);
    expect(p.probes.positive).toBe('rv:W');
  });
  it('mede resistência de dois segmentos e avisa sobre alimentação', () => {
    const p = electronicsExample('divider');
    expect(meterReading(p, simulate(p), 'resistance').value).toBeNull();
    p.parts.find((c) => c.id === 'ps')!.value = 0;
    p.meterProbes = { positive: 'rv:A', negative: 'rv:B' };
    expect(meterReading(p, simulate(p), 'resistance').value).toBeCloseTo(10000);
  });
  it('distingue curto, circuito aberto e rede com semicondutor', () => {
    const p = electronicsExample('divider');
    p.parts.find((c) => c.id === 'ps')!.value = 0;
    p.meterProbes = { positive: 'rv:A', negative: 'rv:A' };
    expect(meterReading(p, simulate(p), 'continuity').text).toBe('CONT');
    p.meterProbes.negative = 'bb:j30';
    expect(meterReading(p, simulate(p), 'resistance').text).toBe('OL');
    const q = electronicsExample('led');
    q.parts.find((c) => c.id === 'ps')!.value = 0;
    expect(meterReading(q, simulate(q), 'resistance').value).toBeNull();
  });
});
