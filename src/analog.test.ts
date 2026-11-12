import { describe, it, expect } from 'vitest';
import { simulate, parseProject, measure } from './engine';
import { electronicsExample } from './electronicsExamples';
describe('Eletrônica ampliada', () => {
  it('limita a corrente do LED e responde à abertura do botão', () => {
    const p = electronicsExample('led'),
      r = simulate(p);
    expect(r.issues).toEqual([]);
    expect(r.currents.led).toBeCloseTo((5 - 1.9) / (330 + 10 + 0.1), 5);
    p.parts.find((c) => c.id === 'sw')!.bits = 0;
    expect(Math.abs(simulate(p).currents.led ?? 0)).toBeLessThan(1e-7);
  });
  it('respeita polaridade e diagnóstico de corrente alta', () => {
    const p = electronicsExample('led');
    p.parts.find((c) => c.id === 'r1')!.value = 100;
    expect(simulate(p).issues.join()).toContain('20 mA');
    p.wires = p.wires.map((w) => ({
      ...w,
      from: w.from === 'led:K' ? 'led:A' : w.from,
      to: w.to === 'led:A' ? 'led:K' : w.to,
    }));
    expect(Math.abs(simulate(p).currents.led ?? 0)).toBeLessThan(1e-7);
  });
  it('cursor do potenciômetro altera tensão e persiste', () => {
    const p = electronicsExample('divider');
    expect(measure(p, simulate(p))).toBeCloseTo(2.5, 5);
    p.parts.find((c) => c.id === 'rv')!.ratio = 0.8;
    expect(measure(p, simulate(p))).toBeCloseTo(1, 5);
    expect(parseProject(JSON.stringify(p))).toEqual(p);
  });
  it('chave NPN controla a corrente de coletor', () => {
    const p = electronicsExample('transistor');
    const r = simulate(p);
    expect(r.issues).toEqual([]);
    expect(r.currents.led).toBeGreaterThan(0.005);
    expect(r.voltages['q1:C']).toBeLessThan(0.5);
    p.parts.find((c) => c.id === 'sw')!.bits = 0;
    expect(Math.abs(simulate(p).currents.led ?? 0)).toBeLessThan(1e-7);
  });
  it('dois capacitores mantêm estados independentes e convergem à solução analítica', () => {
    const p = electronicsExample('double-rc');
    let state: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const r = simulate(p, state, 0.05);
      expect(r.issues).toEqual([]);
      state = r.capacitors;
    }
    expect(state.c1).toBeCloseTo(5 * (1 - Math.exp(-1)), 2);
    expect(state.c2).toBeCloseTo(5 * (1 - Math.exp(-0.5)), 2);
    expect(simulate(p, state, 0).capacitors.c1).toBeCloseTo(state.c1, 5);
  });
  it('resistor sem referência não ganha medição artificial', () => {
    const p = electronicsExample('divider');
    p.wires = [];
    expect(measure(p, simulate(p))).toBeNull();
  });
});
