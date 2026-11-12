import { measure, netlist, type Project, type Reading } from './engine';
export type MeterMode = 'voltage' | 'resistance' | 'continuity';
export interface MeterReading {
  value: number | null;
  text: string;
  unit: string;
  note: string;
}
export function meterReading(p: Project, r: Reading, mode: MeterMode): MeterReading {
  const probes = p.meterProbes ?? p.probes;
  if (mode === 'voltage') {
    const value = measure(p, r, probes.positive, probes.negative);
    return {
      value,
      text: value === null ? '—' : value.toFixed(3),
      unit: 'V',
      note: 'Tensão DC · entrada ideal de impedância infinita',
    };
  }
  const invalid = (note: string): MeterReading => ({ value: null, text: '—', unit: 'Ω', note });
  if (!probes.positive || !probes.negative) return invalid('Conecte as duas pontas do multímetro.');
  if (p.parts.some((c) => c.kind === 'source' && c.value !== 0))
    return invalid('Desligue a fonte antes de medir resistência/continuidade.');
  if (
    p.parts.some((c) =>
      ['led', 'diode', 'transistor', 'capacitor', 'adder', 'inputs'].includes(c.kind),
    )
  )
    return invalid(
      'Resistência disponível apenas em redes resistivas e chaves, sem capacitores ou semicondutores.',
    );
  const net = netlist(p),
    a = net.node(probes.positive),
    b = net.node(probes.negative);
  const edges: { a: string; b: string; g: number }[] = [];
  const edge = (from: string, to: string, resistance: number) =>
    edges.push({ a: net.node(from), b: net.node(to), g: 1 / resistance });
  for (const c of p.parts) {
    if (c.kind === 'resistor') edge(`${c.id}:1`, `${c.id}:2`, c.value);
    if (c.kind === 'button' && c.bits === 1) edge(`${c.id}:1`, `${c.id}:2`, 0.1);
    if (c.kind === 'potentiometer') {
      edge(`${c.id}:A`, `${c.id}:W`, Math.max(1, c.value * (c.ratio ?? 0.5)));
      edge(`${c.id}:W`, `${c.id}:B`, Math.max(1, c.value * (1 - (c.ratio ?? 0.5))));
    }
  }
  const connected = new Set([a]);
  for (let k = 0; k <= edges.length; k++)
    for (const e of edges) {
      if (connected.has(e.a)) connected.add(e.b);
      if (connected.has(e.b)) connected.add(e.a);
    }
  let resistance = 0;
  if (a !== b) {
    if (!connected.has(b))
      return { value: Infinity, text: 'OL', unit: 'Ω', note: 'Circuito aberto entre as pontas.' };
    const nodes = [...connected].filter((n) => n !== a && n !== b),
      m = nodes.map(() => Array(nodes.length + 1).fill(0));
    for (const e of edges)
      for (const [n, other] of [
        [e.a, e.b],
        [e.b, e.a],
      ]) {
        const i = nodes.indexOf(n);
        if (i < 0) continue;
        m[i][i] += e.g;
        if (other === a) m[i][nodes.length] += e.g;
        else if (other !== b) {
          const j = nodes.indexOf(other);
          if (j >= 0) m[i][j] -= e.g;
        }
      }
    for (let col = 0; col < nodes.length; col++) {
      let pivot = col;
      for (let i = col + 1; i < nodes.length; i++)
        if (Math.abs(m[i][col]) > Math.abs(m[pivot][col])) pivot = i;
      if (Math.abs(m[pivot][col]) < 1e-15) return invalid('Rede sem solução resistiva.');
      [m[col], m[pivot]] = [m[pivot], m[col]];
      const q = m[col][col];
      for (let j = col; j <= nodes.length; j++) m[col][j] /= q;
      for (let i = 0; i < nodes.length; i++)
        if (i !== col) {
          const f = m[i][col];
          for (let j = col; j <= nodes.length; j++) m[i][j] -= f * m[col][j];
        }
    }
    const voltage = (node: string) =>
      node === a ? 1 : node === b ? 0 : (m[nodes.indexOf(node)]?.[nodes.length] ?? 1);
    const current = edges.reduce(
      (sum, e) =>
        e.a === a
          ? sum + e.g * (1 - voltage(e.b))
          : e.b === a
            ? sum + e.g * (1 - voltage(e.a))
            : sum,
      0,
    );
    resistance = current > 1e-15 ? 1 / current : Infinity;
  }
  return {
    value: resistance,
    text:
      mode === 'continuity'
        ? resistance <= 50
          ? 'CONT'
          : 'OL'
        : Number.isFinite(resistance)
          ? resistance.toFixed(1)
          : 'OL',
    unit: 'Ω',
    note:
      mode === 'continuity'
        ? 'Continuidade: limiar didático de 50 Ω. Sem sinal sonoro.'
        : 'Resistência equivalente ideal; fonte a 0 V é omitida da medição.',
  };
}
