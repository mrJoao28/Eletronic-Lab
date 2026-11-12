export type Logic = 0 | 1 | 'X';
export type Gate = 'AND' | 'OR' | 'XOR' | 'NOT' | 'NAND' | 'NOR';
export function gate(kind: Gate, inputs: Logic[]): Logic {
  if (kind === 'NOT') return inputs[0] === 'X' ? 'X' : inputs[0] === 0 ? 1 : 0;
  if (kind === 'AND' || kind === 'NAND') {
    const result = inputs.includes(0) ? 0 : inputs.includes('X') ? 'X' : 1;
    return kind === 'NAND' ? gate('NOT', [result]) : result;
  }
  if (kind === 'OR' || kind === 'NOR') {
    const result = inputs.includes(1) ? 1 : inputs.includes('X') ? 'X' : 0;
    return kind === 'NOR' ? gate('NOT', [result]) : result;
  }
  return inputs.includes('X')
    ? 'X'
    : (inputs.reduce<number>((s, b) => s ^ (b as number), 0) as Logic);
}
export interface Rule {
  id: string;
  kind: Gate | 'DFF';
  inputs: string[];
  output: string;
  delay: number;
}
interface Event {
  time: number;
  order: number;
  net: string;
  driver: string;
  value: Logic;
}
export class DigitalCircuit {
  time = 0;
  history: { time: number; net: string; value: Logic }[] = [];
  private drivers = new Map<string, Map<string, Logic>>();
  private queue: Event[] = [];
  private serial = 0;
  private clocks = new Map<string, Logic>();
  constructor(public rules: Rule[]) {
    if (rules.some((r) => !Number.isFinite(r.delay) || r.delay < 0))
      throw Error('Atraso inválido.');
  }
  read(net: string): Logic {
    const values = [...(this.drivers.get(net)?.values() ?? [])];
    return values.length && values.every((v) => v === values[0]) ? values[0] : 'X';
  }
  input(net: string, value: Logic, time = this.time, driver = 'input') {
    if (!Number.isFinite(time) || time < this.time)
      throw Error('Evento no passado ou tempo inválido.');
    this.queue.push({ net, value, time, driver, order: this.serial++ });
  }
  runUntil(until: number) {
    if (!Number.isFinite(until) || until < this.time) throw Error('Tempo inválido.');
    let count = 0;
    while (this.queue.some((e) => e.time <= until)) {
      if (++count > 10000) throw Error('Limite de eventos: possível oscilação combinacional.');
      this.queue.sort((a, b) => a.time - b.time || a.order - b.order);
      const e = this.queue.shift()!;
      this.time = e.time;
      const before = this.read(e.net),
        drivers = this.drivers.get(e.net) ?? new Map<string, Logic>();
      drivers.set(e.driver, e.value);
      this.drivers.set(e.net, drivers);
      const after = this.read(e.net);
      if (before === after) continue;
      this.history.push({ time: this.time, net: e.net, value: after });
      if (this.history.length > 512) this.history.shift();
      for (const rule of this.rules.filter((r) => r.inputs.includes(e.net))) {
        const values = rule.inputs.map((n) => this.read(n));
        if (rule.kind === 'DFF') {
          const clk = values[1],
            previous = this.clocks.get(rule.id) ?? 'X';
          this.clocks.set(rule.id, clk);
          if (previous === 0 && clk === 1)
            this.input(rule.output, values[0], this.time + rule.delay, rule.id);
        } else this.input(rule.output, gate(rule.kind, values), this.time + rule.delay, rule.id);
      }
    }
    this.time = until;
  }
}
export type AluOperation = 'ADD' | 'SUB' | 'AND' | 'OR' | 'XOR';
export function alu(a: number, b: number, operation: AluOperation) {
  a &= 255;
  b &= 255;
  const raw =
    operation === 'ADD'
      ? a + b
      : operation === 'SUB'
        ? a - b
        : operation === 'AND'
          ? a & b
          : operation === 'OR'
            ? a | b
            : a ^ b;
  return {
    value: raw & 255,
    zero: (raw & 255) === 0,
    carry: operation === 'SUB' ? a >= b : operation === 'ADD' ? raw > 255 : false,
  };
}
export function registerStep(
  state: number,
  data: number,
  previousClock: Logic,
  clock: Logic,
  load: boolean,
) {
  return previousClock === 0 && clock === 1 && load ? data & 255 : state & 255;
}
