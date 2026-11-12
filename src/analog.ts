import { netlist, type Project, type Reading } from './engine';

type Branch = { a: string; b: string; g: number; offset: number; id: string };
function linear(a: number[][], b: number[]) {
  const m = a.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < b.length; c++) {
    let pivot = c;
    for (let r = c + 1; r < b.length; r++) if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    if (Math.abs(m[pivot][c]) < 1e-16) return null;
    [m[c], m[pivot]] = [m[pivot], m[c]];
    const q = m[c][c];
    for (let j = c; j <= b.length; j++) m[c][j] /= q;
    for (let r = 0; r < b.length; r++)
      if (r !== c) {
        const f = m[r][c];
        for (let j = c; j <= b.length; j++) m[r][j] -= f * m[c][j];
      }
  }
  return m.map((r) => r[b.length]);
}
// Piecewise-linear, low-voltage educational model. Capacitors use backward Euler.
// The NPN is a switch with a base diode, not an amplifier or a SPICE BJT model.
export function solveAnalog(p: Project, previous: Record<string, number>, dt: number): Reading {
  const net = netlist(p),
    issues: string[] = [],
    fixed = new Map<string, number>(),
    conflicts = new Set<string>();
  const drive = (id: string, v: number) => {
    const n = net.node(id);
    if (conflicts.has(n)) return;
    if (fixed.has(n) && Math.abs(fixed.get(n)! - v) > 1e-8) {
      fixed.set(n, NaN);
      conflicts.add(n);
      issues.push(`Conflito elétrico em ${id}`);
    } else fixed.set(n, v);
  };
  p.parts.filter((c) => c.kind === 'ground').forEach((c) => drive(`${c.id}:0`, 0));
  if (!fixed.size) issues.push('Adicione e conecte uma referência de terra.');
  for (const c of p.parts.filter((c) => c.kind === 'source')) {
    if (fixed.get(net.node(`${c.id}:-`)) === 0) drive(`${c.id}:+`, c.value);
    else issues.push(`${c.ref}: conecte o negativo da fonte à referência de terra.`);
  }
  if (p.parts.some((c) => c.kind === 'adder' || c.kind === 'inputs'))
    issues.push('Não misture CIs digitais com o motor analógico ampliado nesta versão.');
  const caps = p.parts.filter((c) => c.kind === 'capacitor');
  let states = Object.fromEntries(caps.map((c) => [c.id, previous[c.id] ?? 0]));
  let voltage = new Map(fixed),
    currents: Record<string, number> = {},
    lastBranches: Branch[] = [];
  const steps = dt > 0 ? Math.max(1, Math.min(200, Math.ceil(dt / 0.001))) : 1,
    step = dt / steps;
  let converged = true;
  for (let time = 0; time < steps; time++) {
    let prior = new Map(voltage),
      oldPattern = '',
      settled = false;
    for (let iter = 0; iter < 50; iter++) {
      const branches: Branch[] = [];
      const add = (id: string, a: string, b: string, g: number, offset = 0) =>
        branches.push({ id, a: net.node(a), b: net.node(b), g, offset });
      const v = (id: string) => prior.get(net.node(id)) ?? 0;
      let pattern = '';
      for (const c of p.parts) {
        const terminal = (name: string) => `${c.id}:${name}`;
        if (c.kind === 'resistor') add(c.id, terminal('1'), terminal('2'), 1 / c.value);
        if (c.kind === 'potentiometer') {
          const ratio = c.ratio ?? 0.5;
          add(c.id + ':AW', terminal('A'), terminal('W'), 1 / Math.max(1, c.value * ratio));
          add(c.id + ':WB', terminal('W'), terminal('B'), 1 / Math.max(1, c.value * (1 - ratio)));
        }
        if (c.kind === 'button' && c.bits === 1) add(c.id, terminal('1'), terminal('2'), 1 / 0.1);
        if (c.kind === 'led' || c.kind === 'diode') {
          const vf = c.kind === 'led' ? 1.9 : 0.65,
            on = v(terminal('A')) - v(terminal('K')) > vf;
          pattern += on ? '1' : '0';
          if (on) add(c.id, terminal('A'), terminal('K'), c.kind === 'led' ? 0.1 : 0.05, vf);
        }
        if (c.kind === 'transistor') {
          const on = v(terminal('B')) - v(terminal('E')) > 0.7;
          pattern += on ? '1' : '0';
          if (on) {
            add(c.id + ':B', terminal('B'), terminal('E'), 1 / 50, 0.7);
            add(c.id, terminal('C'), terminal('E'), 1 / 20, 0.2);
          }
        }
        if (c.kind === 'capacitor' && step > 0)
          add(c.id, terminal('+'), terminal('-'), c.value / step, states[c.id]);
      }
      const constraints =
        step === 0
          ? caps.map((c) => ({
              a: net.node(`${c.id}:+`),
              b: net.node(`${c.id}:-`),
              v: states[c.id],
            }))
          : [];
      const nodes = [
        ...new Set([
          ...branches.flatMap((b) => [b.a, b.b]),
          ...constraints.flatMap((c) => [c.a, c.b]),
        ]),
      ].filter((n) => !fixed.has(n));
      const n = nodes.length,
        size = n + constraints.length,
        matrix = Array.from({ length: size }, () => Array(size).fill(0)),
        rhs = Array(size).fill(0);
      // Tiny gmin stabilizes the active-set iteration; floating nodes are removed below.
      for (let i = 0; i < n; i++) matrix[i][i] = 1e-12;
      for (const b of branches)
        for (const [a, other, sign] of [
          [b.a, b.b, 1],
          [b.b, b.a, -1],
        ] as const) {
          const i = nodes.indexOf(a);
          if (i < 0) continue;
          matrix[i][i] += b.g;
          rhs[i] += sign * b.g * b.offset;
          if (fixed.has(other)) rhs[i] += b.g * fixed.get(other)!;
          else {
            const j = nodes.indexOf(other);
            if (j >= 0) matrix[i][j] -= b.g;
          }
        }
      constraints.forEach((c, k) => {
        const row = n + k;
        rhs[row] = c.v;
        for (const [node, sign] of [
          [c.a, 1],
          [c.b, -1],
        ] as const) {
          const i = nodes.indexOf(node);
          if (i >= 0) {
            matrix[i][row] += sign;
            matrix[row][i] += sign;
          } else rhs[row] -= sign * (fixed.get(node) ?? 0);
        }
      });
      const solved = linear(matrix, rhs);
      if (!solved || solved.some((x) => !Number.isFinite(x))) {
        voltage = new Map(fixed);
        issues.push('Rede singular ou conflitante: revise conexões e capacitores.');
        settled = true;
        break;
      }
      voltage = new Map(fixed);
      nodes.forEach((node, i) => voltage.set(node, solved[i]));
      const error = Math.max(
        0,
        ...nodes.map((node) => Math.abs((voltage.get(node) ?? 0) - (prior.get(node) ?? 0))),
      );
      lastBranches = branches;
      if ((pattern === oldPattern && error < 1e-6) || (!pattern && iter > 0)) {
        settled = true;
        break;
      }
      oldPattern = pattern;
      prior = new Map(voltage);
    }
    if (!settled) converged = false;
    const reachable = new Set(fixed.keys());
    for (let k = 0; k <= lastBranches.length + caps.length; k++) {
      for (const b of lastBranches) {
        if (reachable.has(b.a)) reachable.add(b.b);
        if (reachable.has(b.b)) reachable.add(b.a);
      }
      for (const c of caps) {
        const a = net.node(`${c.id}:+`),
          b = net.node(`${c.id}:-`);
        if (reachable.has(a)) reachable.add(b);
        if (reachable.has(b)) reachable.add(a);
      }
    }
    for (const node of voltage.keys()) if (!reachable.has(node)) voltage.delete(node);
    currents = {};
    for (const b of lastBranches) {
      const a = voltage.get(b.a),
        v = voltage.get(b.b);
      if (a !== undefined && v !== undefined) currents[b.id] = b.g * (a - v - b.offset);
    }
    for (const c of caps) {
      const a = voltage.get(net.node(`${c.id}:+`)),
        b = voltage.get(net.node(`${c.id}:-`));
      if (a !== undefined && b !== undefined) {
        const value = a - b;
        if (step > 0) currents[c.id] = (c.value * (value - states[c.id])) / step;
        states[c.id] = value;
      }
    }
  }
  if (!converged) issues.push('Modelo não convergiu; medições indefinidas.');
  const voltages: Record<string, number> = {},
    digital: Reading['digital'] = {};
  for (const c of p.parts)
    for (const t of importTerminals(c)) {
      const value = voltage.get(net.node(t.id));
      if (converged && value !== undefined && Number.isFinite(value)) {
        voltages[t.id] = value;
        digital[t.id] = value < 1.5 ? 0 : value > 3.5 ? 1 : 'X';
      } else digital[t.id] = 'X';
    }
  if (!converged) currents = {};
  for (const c of p.parts) {
    if (c.kind === 'led' && (currents[c.id] ?? 0) > 0.02)
      issues.push(`${c.ref}: corrente do LED acima de 20 mA; aumente o resistor.`);
    if (c.kind === 'capacitor' && (states[c.id] ?? 0) < -0.01)
      issues.push(`${c.ref}: capacitor polarizado invertido.`);
  }
  return {
    voltages,
    digital,
    issues: [...new Set(issues)],
    capacitor: caps.length ? states[caps[0].id] : 0,
    capacitors: states,
    currents,
    current: caps.length ? (currents[caps[0].id] ?? 0) : 0,
    tau: null,
    sum: null,
    carry: null,
  };
}
import { terminals as importTerminals } from './engine';
