import { solveAnalog } from './analog';
// Electrical domain. Coordinates are millimetres; no renderer dependencies.
export type Kind =
  | 'board'
  | 'resistor'
  | 'capacitor'
  | 'source'
  | 'ground'
  | 'adder'
  | 'inputs'
  | 'led'
  | 'diode'
  | 'button'
  | 'potentiometer'
  | 'transistor';
export type Vec = [number, number, number];
export interface Part {
  id: string;
  kind: Kind;
  ref: string;
  position: Vec;
  rotation: number;
  value: number;
  bits?: number;
  ratio?: number;
}
export interface Wire {
  id: string;
  from: string;
  to: string;
  color: string;
  lift?: number;
}
export interface Project {
  version: 1;
  name: string;
  experiment: 'rc' | 'adder';
  parts: Part[];
  wires: Wire[];
  probes: { positive: string; negative: string };
  digitalProbes: string[];
  meterProbes?: { positive: string; negative: string };
}
export interface Terminal {
  id: string;
  label: string;
  local: Vec;
  part: string;
}
export const PIN_NAMES = [
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
];
export const INPUT_NAMES = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'Cin'];
export const definitions: Record<
  Kind,
  { name: string; model: string; dimensions: Vec; limit: string }
> = {
  led: {
    name: 'LED · WP7113ID',
    model: 'Kingbright · vermelho · 5 mm',
    dimensions: [5, 8.6, 5],
    limit:
      'Modelo linear por trechos: Vf 1,9 V, resistência dinâmica 10 Ω. Até 20 mA didáticos. Não prevê luminosidade fotométrica.',
  },
  diode: {
    name: 'Diodo · 1N4148',
    model: 'Vishay · DO-35',
    dimensions: [3.9, 1.9, 1.9],
    limit: 'Modelo linear por trechos: Vf 0,65 V e 20 Ω. Sem recuperação reversa ou ruptura.',
  },
  button: {
    name: 'Botão · SPST',
    model: 'Chave didática de dois terminais',
    dimensions: [6, 5, 6],
    limit: 'Aberto ou fechado (0,1 Ω). Sem bounce; acione pelo painel ou pela bancada.',
  },
  potentiometer: {
    name: 'Potenciômetro · 10 kΩ',
    model: 'Potenciômetro linear didático de três terminais',
    dimensions: [9, 8, 9],
    limit:
      'Duas resistências ideais, mínimo 1 Ω por segmento. Cursor W entre A e B; sem desgaste ou ruído.',
  },
  transistor: {
    name: 'Transistor · 2N3904',
    model: 'onsemi · NPN · TO-92',
    dimensions: [5, 5, 4],
    limit:
      'Somente chave NPN aproximada: BE 0,7 V / 50 Ω; CE ligado com 0,2 V / 20 Ω. Sem ganho linear, capacitâncias ou efeito térmico.',
  },
  board: {
    name: 'Protoboard · 400 pontos',
    model: '30 colunas × 10 + 4 trilhos de 25',
    dimensions: [85, 8, 55],
    limit: 'Passo 2,54 mm. Trilhos contínuos de 25 furos; grupos a–e e f–j isolados.',
  },
  resistor: {
    name: 'Resistor · MRS25',
    model: 'Vishay · filme metálico · 1%',
    dimensions: [6.5, 2.5, 2.5],
    limit: 'Modelo ideal, 100 Ω–1 MΩ; operação didática até 5 V. Sem tolerância ou aquecimento.',
  },
  capacitor: {
    name: 'Capacitor · UHE',
    model: 'Nichicon · eletrolítico · 16 V',
    dimensions: [8, 11.5, 8],
    limit:
      'Ideal polarizado, 100–1000 µF; 0–5 V. Um capacitor dinâmico por circuito; ESR e fuga omitidos.',
  },
  source: {
    name: 'Fonte DC',
    model: 'Fonte de bancada ideal',
    dimensions: [33, 20, 27],
    limit: '0–5 V. Saída habilitada em 0 V permite descarga por R; não modela limite de corrente.',
  },
  ground: {
    name: 'Referência de terra',
    model: 'Referência elétrica · 0 V',
    dimensions: [5, 1, 5],
    limit: 'Referência matemática do circuito, não representa terra de proteção.',
  },
  adder: {
    name: 'Somador · CD74HC283',
    model: 'Texas Instruments · HC · PDIP-16',
    dimensions: [19.31, 4.5, 6.35],
    limit:
      'Somente lógica combinacional estática a 5 V. Entrada flutuante ou conflitante = X; sem atrasos/fanout.',
  },
  inputs: {
    name: 'Banco de entradas',
    model: '9 seletores SPDT ideais',
    dimensions: [32, 6, 13],
    limit:
      'Cada saída é comutada entre VCC e GND. Necessita alimentação em 5 V. Não simula bounce.',
  },
};
export function terminals(p: Part): Terminal[] {
  const make = (label: string, local: Vec): Terminal => ({
    id: `${p.id}:${label}`,
    label,
    local,
    part: p.id,
  });
  if (p.kind === 'board') {
    const result: Terminal[] = [];
    const z = [-15.24, -12.7, -10.16, -7.62, -5.08, 2.54, 5.08, 7.62, 10.16, 12.7];
    for (let col = 1; col <= 30; col++)
      for (let row = 0; row < 10; row++)
        result.push(make(`${'abcdefghij'[row]}${col}`, [(col - 1) * 2.54 - 36.83, 4.15, z[row]]));
    ['P', 'N', 'Q', 'M'].forEach((rail, i) => {
      for (let c = 1; c <= 25; c++)
        result.push(make(`${rail}${c}`, [(c - 1) * 2.54 - 30.48, 4.15, [-23, -20, 20, 23][i]]));
    });
    return result;
  }
  if (p.kind === 'led' || p.kind === 'diode')
    return [make('A', [-1.27, 4.15, 0]), make('K', [1.27, 4.15, 0])];
  if (p.kind === 'button') return [make('1', [-3.81, 4.15, 0]), make('2', [3.81, 4.15, 0])];
  if (p.kind === 'potentiometer')
    return [make('A', [-2.54, 4.15, 0]), make('W', [0, 4.15, 0]), make('B', [2.54, 4.15, 0])];
  if (p.kind === 'transistor')
    return [make('E', [-2.54, 4.15, 0]), make('B', [0, 4.15, 0]), make('C', [2.54, 4.15, 0])];
  if (p.kind === 'resistor') return [make('1', [-5.08, 4.15, 0]), make('2', [5.08, 4.15, 0])];
  if (p.kind === 'capacitor') return [make('+', [-1.27, 4.15, 0]), make('-', [1.27, 4.15, 0])];
  if (p.kind === 'source') return [make('+', [-7, 5, 14]), make('-', [7, 5, 14])];
  if (p.kind === 'ground') return [make('0', [0, 4.15, 0])];
  if (p.kind === 'inputs')
    return [
      ...INPUT_NAMES.map((n, i) => make(n, [(i - 4) * 3.2, 4.15, 8])),
      make('VCC', [-10, 4.15, -8]),
      make('GND', [10, 4.15, -8]),
    ];
  return PIN_NAMES.map((name, i) =>
    make(`${i + 1}`, [(i < 8 ? i : 15 - i) * 2.54 - 8.89, 4.15, i < 8 ? 3.81 : -3.81]),
  ).map((t, i) => ({ ...t, label: `${i + 1} ${PIN_NAMES[i]}` }));
}
export function world(p: Part, t: Terminal): Vec {
  const a = (p.rotation * Math.PI) / 180;
  return [
    p.position[0] + t.local[0] * Math.cos(a) - t.local[2] * Math.sin(a),
    p.position[1] + t.local[1],
    p.position[2] + t.local[0] * Math.sin(a) + t.local[2] * Math.cos(a),
  ];
}
export function allTerminals(p: Project) {
  return p.parts.flatMap(terminals);
}
export function netlist(p: Project) {
  const parent = new Map<string, string>();
  allTerminals(p).forEach((t) => parent.set(t.id, t.id));
  const root = (id: string): string => {
    const v = parent.get(id);
    if (!v) return id;
    if (v === id) return v;
    const r = root(v);
    parent.set(id, r);
    return r;
  };
  const join = (a: string, b: string) => {
    if (parent.has(a) && parent.has(b)) parent.set(root(a), root(b));
  };
  p.parts
    .filter((x) => x.kind === 'board')
    .forEach((b) => {
      for (let c = 1; c <= 30; c++) {
        for (const group of ['abcde', 'fghij'])
          for (const row of group.slice(1)) join(`${b.id}:${group[0]}${c}`, `${b.id}:${row}${c}`);
      }
      for (const rail of ['P', 'N', 'Q', 'M'])
        for (let c = 2; c <= 25; c++) join(`${b.id}:${rail}1`, `${b.id}:${rail}${c}`);
      // A lead at an actual hole is physically inserted. Visual and electrical fit are identical.
      const holes = terminals(b).map((t) => ({ id: t.id, point: world(b, t) }));
      for (const part of p.parts.filter(
        (part) => !['board', 'source', 'ground', 'inputs'].includes(part.kind),
      ))
        for (const lead of terminals(part)) {
          const point = world(part, lead);
          const hole = holes.find((h) => Math.hypot(...h.point.map((v, i) => v - point[i])) < 0.06);
          if (hole) join(lead.id, hole.id);
        }
    });
  p.wires.forEach((w) => join(w.from, w.to));
  return {
    node: root,
    nodes: [...new Set([...parent.keys()].map(root))],
    has: (id: string) => parent.has(id),
  };
}
export interface Reading {
  voltages: Record<string, number>;
  capacitors: Record<string, number>;
  currents: Record<string, number>;
  issues: string[];
  capacitor: number;
  current: number;
  digital: Record<string, 0 | 1 | 'X'>;
  sum: number | null;
  carry: number | null;
  tau: number | null;
}
// Gaussian elimination for the small linear resistive network; disconnected nodes remain unknown.
function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let best = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(m[i][c]) > Math.abs(m[best][c])) best = i;
    if (Math.abs(m[best][c]) < 1e-14) return null;
    [m[c], m[best]] = [m[best], m[c]];
    const q = m[c][c];
    for (let j = c; j <= n; j++) m[c][j] /= q;
    for (let i = 0; i < n; i++)
      if (i !== c) {
        const v = m[i][c];
        for (let j = c; j <= n; j++) m[i][j] -= v * m[c][j];
      }
  }
  return m.map((r) => r[n]);
}
export function simulate(p: Project, state: number | Record<string, number> = 0, dt = 0): Reading {
  const capsForState = p.parts.filter((c) => c.kind === 'capacitor');
  const previous = typeof state === 'number' ? state : (state[capsForState[0]?.id] ?? 0);
  if (
    p.parts.some((c) =>
      ['led', 'diode', 'button', 'potentiometer', 'transistor'].includes(c.kind),
    ) ||
    capsForState.length > 1
  )
    return solveAnalog(
      p,
      typeof state === 'number'
        ? Object.fromEntries(capsForState.map((c) => [c.id, state]))
        : state,
      dt,
    );

  const net = netlist(p),
    volts: Record<string, number> = {},
    fixed = new Map<string, number>(),
    issues: string[] = [],
    digital: Reading['digital'] = {};
  // A conflict belongs to the node, and cannot be cleared by a later driver.
  const conflicted = new Set<string>();
  const set = (id: string, v: number) => {
    const n = net.node(id);
    if (conflicted.has(n)) return;
    if (fixed.has(n) && Math.abs(fixed.get(n)! - v) > 1e-6) {
      issues.push(`Conflito elétrico em ${id}`);
      conflicted.add(n);
      fixed.set(n, NaN);
    } else fixed.set(n, v);
  };
  const grounds = p.parts.filter((c) => c.kind === 'ground');
  grounds.forEach((g) => set(`${g.id}:0`, 0));
  if (!grounds.length) issues.push('Adicione e conecte uma referência de terra.');
  const source = p.parts.find((c) => c.kind === 'source');
  if (p.parts.filter((c) => c.kind === 'source').length > 1)
    issues.push('Modelo suporta somente uma fonte DC.');
  if (p.parts.filter((c) => c.kind === 'adder').length > 1)
    issues.push('Modelo suporta somente um CD74HC283.');
  if (source) {
    const negative = net.node(`${source.id}:-`);
    if (fixed.get(negative) === 0) set(`${source.id}:+`, source.value);
    else issues.push('Conecte o negativo da fonte à referência de terra.');
  }
  const powered = (c: Part, vcc: string, gnd: string) =>
    fixed.get(net.node(`${c.id}:${gnd}`)) === 0 &&
    Math.abs((fixed.get(net.node(`${c.id}:${vcc}`)) ?? NaN) - 5) < 0.01;
  for (const c of p.parts.filter((x) => x.kind === 'inputs')) {
    if (powered(c, 'VCC', 'GND'))
      INPUT_NAMES.forEach((name, i) => set(`${c.id}:${name}`, (((c.bits ?? 0) >> i) & 1) * 5));
    else issues.push(`${c.ref}: banco de entradas sem 5 V e GND.`);
  }
  const adder = p.parts.find((c) => c.kind === 'adder');
  let sum: number | null = null,
    carry: number | null = null;
  const resistors = p.parts
    .filter((c) => c.kind === 'resistor')
    .map((c) => ({ a: net.node(`${c.id}:1`), b: net.node(`${c.id}:2`), r: c.value }));
  const caps = p.parts.filter((c) => c.kind === 'capacitor');
  if (caps.length > 1) issues.push('Modelo suporta somente um capacitor dinâmico.');
  const cap = caps[0];
  let capacitor = previous,
    current = 0,
    tau: number | null = null;
  const capA = cap ? net.node(`${cap.id}:+`) : '',
    capB = cap ? net.node(`${cap.id}:-`) : '';
  // Solve reachable resistive nodes, with optional fixed capacitor voltage at its positive terminal.
  function network(extra?: number) {
    const f = new Map(fixed);
    if (extra !== undefined) f.set(capA, extra);
    const reachable = new Set(f.keys());
    for (let k = 0; k < resistors.length + 1; k++)
      for (const r of resistors) {
        if (reachable.has(r.a)) reachable.add(r.b);
        if (reachable.has(r.b)) reachable.add(r.a);
      }
    const unknown = [...reachable].filter((n) => !f.has(n));
    const matrix = unknown.map(() => unknown.map(() => 0)),
      rhs = unknown.map(() => 0);
    resistors.forEach((r) => {
      for (const [n, other] of [
        [r.a, r.b],
        [r.b, r.a],
      ]) {
        const i = unknown.indexOf(n);
        if (i < 0) continue;
        matrix[i][i] += 1 / r.r;
        if (f.has(other)) rhs[i] += f.get(other)! / r.r;
        else {
          const j = unknown.indexOf(other);
          if (j >= 0) matrix[i][j] -= 1 / r.r;
        }
      }
    });
    const solution = solve(matrix, rhs);
    if (solution) unknown.forEach((n, i) => f.set(n, solution[i]));
    return f;
  }
  let result = network();
  if (cap) {
    if (capA === capB) {
      capacitor = 0;
      issues.push('Capacitor em curto.');
    } else if (fixed.get(capB) !== 0) {
      issues.push('RC suportado requer o terminal negativo de C ligado ao terra.');
    } else if (fixed.has(capA)) {
      capacitor = fixed.get(capA)!;
      issues.push('C diretamente na fonte ideal: transiente não suportado.');
    } else if (caps.length === 1) {
      const zero = network(0),
        one = network(1);
      const flow = (f: Map<string, number>, v: number) =>
        resistors.reduce(
          (s, r) =>
            r.a === capA
              ? s + ((f.get(r.b) ?? v) - v) / r.r
              : r.b === capA
                ? s + ((f.get(r.a) ?? v) - v) / r.r
                : s,
          0,
        );
      const i0 = flow(zero, 0),
        g = i0 - flow(one, 1);
      if (g > 1e-12 && Number.isFinite(g)) {
        tau = cap.value / g;
        const target = i0 / g;
        capacitor = target + (previous - target) * Math.exp(-dt / tau);
        result = network(capacitor);
        current = flow(result, capacitor);
      } else {
        issues.push('Capacitor isolado: carga conservada; conecte um caminho resistivo.');
        result = network(capacitor);
      }
      if (capacitor < -0.001 || capacitor > 16)
        issues.push('Tensão fora da faixa do capacitor polarizado.');
    }
  }
  // Digital inputs must see solved resistor networks, including pull-up/down.
  if (adder) {
    if (
      result.get(net.node(`${adder.id}:8`)) === 0 &&
      Math.abs((result.get(net.node(`${adder.id}:16`)) ?? NaN) - 5) < 0.01
    ) {
      const inputPins = [5, 3, 14, 12, 6, 2, 15, 11, 7];
      const values = inputPins.map((pin) => result.get(net.node(`${adder.id}:${pin}`)));
      if (values.every((v) => v === 0 || v === 5)) {
        const bits: number[] = values.map((v) => (v === 5 ? 1 : 0));
        const a = bits.slice(0, 4).reduce((s, v, i) => s + (v << i), 0),
          b = bits.slice(4, 8).reduce((s, v, i) => s + (v << i), 0);
        const result = a + b + bits[8];
        sum = result & 15;
        carry = result >> 4;
        [4, 1, 13, 10, 9].forEach((pin, i) => set(`${adder.id}:${pin}`, ((result >> i) & 1) * 5));
      } else issues.push('Entradas do somador flutuantes ou em conflito (X).');
    } else issues.push('U1: alimentação requer 5 V no pino 16 e 0 V no pino 8.');
  }
  // Resolve loads on the output pins after applying the digital drivers.
  if (adder && sum !== null) result = network(cap && tau !== null ? capacitor : undefined);
  allTerminals(p).forEach((t) => {
    const v = result.get(net.node(t.id));
    if (v !== undefined && Number.isFinite(v)) {
      volts[t.id] = v;
      digital[t.id] = v < 1.5 ? 0 : v > 3.5 ? 1 : 'X';
    } else digital[t.id] = 'X';
  });
  return {
    capacitors: cap ? { [cap.id]: capacitor } : {},
    currents: Object.fromEntries(
      p.parts
        .filter((c) => c.kind === 'resistor')
        .map((c) => [c.id, ((volts[`${c.id}:1`] ?? NaN) - (volts[`${c.id}:2`] ?? NaN)) / c.value]),
    ),
    voltages: volts,
    issues: [...new Set(issues)],
    capacitor,
    current,
    digital,
    sum,
    carry,
    tau,
  };
}
export function measure(
  p: Project,
  r: Reading,
  positive = p.probes.positive,
  negative = p.probes.negative,
) {
  const a = r.voltages[positive],
    b = r.voltages[negative];
  return a === undefined || b === undefined ? null : a - b;
}
export function parseProject(raw: string): Project {
  const p = JSON.parse(raw) as Project;
  if (
    !p ||
    p.version !== 1 ||
    !['rc', 'adder'].includes(p.experiment) ||
    typeof p.name !== 'string' ||
    p.name.length > 120 ||
    !Array.isArray(p.parts) ||
    p.parts.length > 40 ||
    !Array.isArray(p.wires) ||
    p.wires.length > 500
  )
    throw new Error('Projeto inválido ou versão não suportada.');
  const ids = new Set<string>();
  for (const c of p.parts) {
    if (
      !c ||
      typeof c.id !== 'string' ||
      !/^[\w-]{1,64}$/.test(c.id) ||
      ids.has(c.id) ||
      !Object.hasOwn(definitions, c.kind) ||
      typeof c.ref !== 'string' ||
      c.ref.length > 80 ||
      !Array.isArray(c.position) ||
      c.position.length !== 3 ||
      !c.position.every((n) => Number.isFinite(n) && Math.abs(n) < 500) ||
      !Number.isFinite(c.rotation) ||
      !Number.isFinite(c.value)
    )
      throw new Error('Componente inválido.');
    ids.add(c.id);
    if (
      (c.kind === 'resistor' && (c.value < 100 || c.value > 1e6)) ||
      (c.kind === 'capacitor' && (c.value < 1e-4 || c.value > 1e-3)) ||
      (c.kind === 'source' && (c.value < 0 || c.value > 5)) ||
      (c.kind === 'inputs' && (!Number.isInteger(c.bits) || c.bits! < 0 || c.bits! > 511)) ||
      (c.kind === 'button' && c.bits !== undefined && c.bits !== 0 && c.bits !== 1) ||
      (c.kind === 'potentiometer' &&
        (c.value < 100 ||
          c.value > 1e6 ||
          (c.ratio !== undefined && (!Number.isFinite(c.ratio) || c.ratio < 0 || c.ratio > 1))))
    )
      throw new Error('Propriedade fora da faixa suportada.');
  }
  const terminalsSet = new Set(allTerminals(p).map((t) => t.id));
  const wireIds = new Set<string>();
  for (const w of p.wires) {
    if (
      !w ||
      typeof w.id !== 'string' ||
      wireIds.has(w.id) ||
      !terminalsSet.has(w.from) ||
      !terminalsSet.has(w.to) ||
      w.from === w.to ||
      !/^#[a-f\d]{6}$/i.test(w.color) ||
      (w.lift !== undefined && (!Number.isFinite(w.lift) || w.lift < 2 || w.lift > 40))
    )
      throw new Error('Conexão inválida.');
    wireIds.add(w.id);
  }
  if (
    (p.meterProbes !== undefined &&
      (!p.meterProbes ||
        ![p.meterProbes.positive, p.meterProbes.negative].every(
          (t) => t === '' || terminalsSet.has(t),
        ))) ||
    !p.probes ||
    ![p.probes.positive, p.probes.negative].every((t) => t === '' || terminalsSet.has(t)) ||
    !Array.isArray(p.digitalProbes) ||
    p.digitalProbes.length > 16 ||
    !p.digitalProbes.every((t) => terminalsSet.has(t))
  )
    throw new Error('Ponta de prova inválida.');
  return p;
}
