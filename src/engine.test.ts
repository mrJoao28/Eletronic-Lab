import { describe, expect, it } from 'vitest';
import {
  allTerminals,
  measure,
  netlist,
  parseProject,
  PIN_NAMES,
  simulate,
  terminals,
  world,
} from './engine';
import { example } from './examples';
describe('Protoboard e representação elétrica', () => {
  it('inserção física conecta o terminal e mover a peça o desconecta do furo', () => {
    const p = example('rc');
    const r = p.parts.find((c) => c.id === 'r1')!;
    expect(netlist(p).node('r1:1')).toBe(netlist(p).node('bb:c7'));
    expect(netlist(p).node('r1:2')).toBe(netlist(p).node('bb:c11'));
    r.position[2] += 1;
    expect(netlist(p).node('r1:1')).not.toBe(netlist(p).node('bb:c7'));
    expect(simulate(p, 2, 1).capacitor).toBeCloseTo(2);
  });
  it('une os cinco furos, isola colunas, separa o canal e os trilhos', () => {
    const p = example('rc');
    p.wires = [];
    const n = netlist(p);
    expect(terminals(p.parts[0])).toHaveLength(400);
    for (let c = 1; c <= 30; c++) {
      for (const row of 'abcde') expect(n.node(`bb:${row}${c}`)).toBe(n.node(`bb:a${c}`));
      for (const row of 'fghij') expect(n.node(`bb:${row}${c}`)).toBe(n.node(`bb:f${c}`));
      expect(n.node(`bb:a${c}`)).not.toBe(n.node(`bb:f${c}`));
      if (c < 30) expect(n.node(`bb:a${c}`)).not.toBe(n.node(`bb:a${c + 1}`));
    }
    for (const rail of ['P', 'N', 'Q', 'M'])
      for (let c = 1; c <= 25; c++) expect(n.node(`bb:${rail}${c}`)).toBe(n.node(`bb:${rail}1`));
    expect(n.node('bb:P1')).not.toBe(n.node('bb:N1'));
    expect(n.node('bb:N1')).not.toBe(n.node('bb:M1'));
  });
  it('todos os fios terminam em terminais reais e possuem coordenadas visuais', () => {
    for (const mode of ['rc', 'adder'] as const) {
      const p = example(mode);
      const ids = new Set(allTerminals(p).map((t) => t.id));
      for (const w of p.wires) {
        expect(ids.has(w.from) && ids.has(w.to)).toBe(true);
      }
      for (const part of p.parts)
        for (const t of terminals(part)) expect(world(part, t).every(Number.isFinite)).toBe(true);
    }
  });
  it('gira o terminal e mantém a identidade elétrica', () => {
    const p = example('rc').parts.find((p) => p.id === 'r1')!;
    const t = terminals(p)[0];
    const rotated = world({ ...p, position: [0, 0, 0], rotation: 90 }, t);
    expect(rotated[0]).toBeCloseTo(0);
    expect(rotated[2]).toBeCloseTo(-5.08);
    expect(t.id).toBe('r1:1');
  });
});
describe('Modelo RC linear de um capacitor', () => {
  it('carga coincide com solução analítica em vários instantes', () => {
    const p = example('rc');
    let v = 0;
    for (let i = 1; i <= 200; i++) {
      const r = simulate(p, v, 0.05);
      v = r.capacitor;
      expect(r.issues).toEqual([]);
      expect(v).toBeCloseTo(5 * (1 - Math.exp(-i * 0.05)), 10);
      expect(r.tau).toBeCloseTo(1);
      expect(measure(p, r)).toBeCloseTo(v, 10);
    }
  });
  it('descarga, resistência e capacitância modificam a resposta', () => {
    const p = example('rc');
    p.parts.find((c) => c.kind === 'source')!.value = 0;
    expect(simulate(p, 5, 1).capacitor).toBeCloseTo(5 / Math.E, 10);
    p.parts.find((c) => c.kind === 'source')!.value = 5;
    p.parts.find((c) => c.kind === 'resistor')!.value = 20000;
    expect(simulate(p, 0, 1).capacitor).toBeCloseTo(5 * (1 - Math.exp(-0.5)), 10);
    p.parts.find((c) => c.kind === 'capacitor')!.value = 200e-6;
    expect(simulate(p, 0, 1).capacitor).toBeCloseTo(5 * (1 - Math.exp(-0.25)), 10);
  });
  it('responde à montagem e não reproduz uma curva fixa', () => {
    const p = example('rc');
    p.wires = p.wires.filter((w) => w.to !== 'bb:a7');
    const r = simulate(p, 2, 1);
    expect(r.capacitor).toBeCloseTo(2);
    expect(r.issues.some((s) => s.includes('isolado'))).toBe(true);
  });
  it('pontas diferentes medem pontos diferentes e a inversão troca sinal', () => {
    const p = example('rc'),
      r = simulate(p, 0, 1);
    expect(measure(p, r, 'ps:+', 'gnd:0')).toBe(5);
    expect(measure(p, r, 'c1:+', 'gnd:0')).toBeCloseTo(5 * (1 - Math.exp(-1)));
    expect(measure(p, r, 'gnd:0', 'c1:+')).toBeCloseTo(-r.capacitor);
    expect(measure(p, r, 'bb:j30', 'gnd:0')).toBeNull();
    expect(measure(p, r, 'c1:+', 'c1:+')).toBe(0);
  });
  it('denuncia curtos na fonte e ausência de referência', () => {
    const p = example('rc');
    p.wires.push({ id: 'short', from: 'ps:+', to: 'ps:-', color: '#ffffff' });
    expect(simulate(p).issues.some((s) => s.includes('Conflito'))).toBe(true);
    expect(measure(p, simulate(p), 'ps:+', 'gnd:0')).toBeNull();
  });
});
describe('CD74HC283 HC PDIP-16', () => {
  it('possui pinagem explícita do SCHS176E', () =>
    expect(PIN_NAMES).toEqual([
      'S2',
      'B2',
      'A2',
      'S1',
      'A1',
      'B1',
      'Cin',
      'GND',
      'Cout',
      'S4',
      'B4',
      'A4',
      'S3',
      'A3',
      'B3',
      'VCC',
    ]));
  it('calcula todas as 512 combinações A, B, Cin através dos fios', () => {
    const p = example('adder');
    for (let a = 0; a < 16; a++)
      for (let b = 0; b < 16; b++)
        for (let cin = 0; cin < 2; cin++) {
          p.parts.find((c) => c.kind === 'inputs')!.bits = a | (b << 4) | (cin << 8);
          const r = simulate(p);
          expect(r.issues).toEqual([]);
          expect(r.sum).toBe((a + b + cin) & 15);
          expect(r.carry).toBe((a + b + cin) >> 4);
          expect(r.digital['u1:4']).toBe((a + b + cin) & 1);
          expect(r.digital['u1:9']).toBe((a + b + cin) >> 4);
        }
  });
  it('desconectar entrada ou alimentação produz X', () => {
    for (const pin of ['u1:5', 'u1:16', 'u1:8']) {
      const p = example('adder');
      p.wires = p.wires.filter((w) => w.to !== pin);
      const r = simulate(p);
      expect(r.sum).toBeNull();
      expect(r.digital['u1:9']).toBe('X');
    }
  });
  it('religar uma entrada altera a soma pela topologia', () => {
    const p = example('adder');
    const w = p.wires.find((w) => w.to === 'u1:5')!;
    w.from = 'ps:-';
    const r = simulate(p);
    expect(r.sum).toBe(7);
    expect(r.carry).toBe(0);
  });
});
describe('Persistência versionada', () => {
  it('recupera componentes, orientação, conexões, sondas e comportamento', () => {
    for (const mode of ['rc', 'adder'] as const) {
      const p = example(mode);
      p.parts[2].rotation = 90;
      const restored = parseProject(JSON.stringify(p));
      expect(restored).toEqual(p);
      expect(simulate(restored, 0, 1)).toEqual(simulate(p, 0, 1));
    }
  });
  it('rejeita versão futura, terminal fantasma, valores inválidos e arquivos malformados', () => {
    const p = example('rc');
    expect(() => parseProject('{')).toThrow();
    expect(() => parseProject(JSON.stringify({ ...p, version: 2 }))).toThrow();
    const bad = structuredClone(p);
    bad.wires[0].to = 'ghost:1';
    expect(() => parseProject(JSON.stringify(bad))).toThrow();
    bad.wires = p.wires;
    bad.parts[3].value = -2;
    expect(() => parseProject(JSON.stringify(bad))).toThrow();
  });
});

describe('Regressões de nós mistos e conflito persistente', () => {
  it('mantém X quando um terceiro driver escreve em um nó já conflitante', () => {
    const p = example('adder');
    p.wires.push(
      { id: 'short-a', from: 'in:A1', to: 'in:A2', color: '#ffffff' },
      { id: 'short-b', from: 'in:A1', to: 'in:B1', color: '#ffffff' },
    );
    for (const bits of [53, 2, 1]) {
      p.parts.find((c) => c.kind === 'inputs')!.bits = bits;
      const r = simulate(p);
      expect(r.issues.some((s) => s.includes('Conflito'))).toBe(true);
      expect(r.digital['in:A1']).toBe('X');
      expect(r.digital['in:A2']).toBe('X');
      expect(r.sum).toBeNull();
    }
  });
  it('resolve pull-down e pull-up antes de avaliar o somador', () => {
    for (const high of [false, true]) {
      const p = example('adder');
      p.wires = p.wires.filter((w) => w.to !== 'u1:5');
      p.parts.push({
        id: 'pull',
        kind: 'resistor',
        ref: 'R2',
        position: [80, 0, 0],
        rotation: 0,
        value: 10000,
      });
      p.wires.push(
        { id: 'pull-a', from: 'pull:1', to: high ? 'ps:+' : 'ps:-', color: '#ffffff' },
        { id: 'pull-b', from: 'pull:2', to: 'u1:5', color: '#ffffff' },
      );
      const r = simulate(p);
      expect(r.issues).toEqual([]);
      expect(r.voltages['u1:5']).toBe(high ? 5 : 0);
      expect(r.sum).toBe(high ? 8 : 7);
    }
  });
});
