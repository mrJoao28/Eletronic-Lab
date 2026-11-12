import { describe, it, expect } from 'vitest';
import { diagnose } from './diagnostics';
import { example } from './examples';
import { electronicsExample } from './electronicsExamples';
import { simulate } from './engine';
describe('Diagnóstico contextual', () => {
  it('identifica curto da fonte e aponta os terminais', () => {
    const p = example('rc');
    p.wires.push({ id: 'short', from: 'ps:+', to: 'ps:-', color: '#ffffff' });
    const d = diagnose(p, simulate(p)).find((d) => d.id === 'short-ps')!;
    expect(d.severity).toBe('error');
    expect(d.terminals).toEqual(['ps:+', 'ps:-']);
  });
  it('distingue polaridade reversa e sobrecorrente no LED', () => {
    const p = electronicsExample('led');
    p.parts.find((c) => c.id === 'r1')!.value = 100;
    expect(diagnose(p, simulate(p)).some((d) => d.id === 'led-current-led')).toBe(true);
  });
  it('não acusa erro nas montagens válidas', () => {
    for (const p of [example('rc'), example('adder'), electronicsExample('led')])
      expect(diagnose(p, simulate(p))).toEqual([]);
  });
  it('lista entrada digital desconectada para inspeção', () => {
    const p = example('adder');
    p.wires = p.wires.filter((w) => w.to !== 'u1:5');
    expect(diagnose(p, simulate(p)).find((d) => d.id === 'inputs-u1')!.terminals).toContain('u1:5');
  });
});
