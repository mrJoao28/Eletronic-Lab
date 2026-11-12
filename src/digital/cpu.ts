import { alu, type AluOperation } from './logic';
export const instructionSet = {
  NOP: 0,
  LDI: 1,
  LDA: 2,
  STA: 3,
  ADD: 4,
  SUB: 5,
  JMP: 6,
  JZ: 7,
  OUT: 8,
  HLT: 9,
  AND: 10,
  OR: 11,
  XOR: 12,
} as const;
const noOperand = new Set(['NOP', 'OUT', 'HLT']);
export interface CPU {
  pc: number;
  ir: number;
  operand: number;
  a: number;
  mar: number;
  mdr: number;
  out: number;
  zero: boolean;
  carry: boolean;
  phase: 'fetch' | 'decode' | 'operand' | 'execute';
  halted: boolean;
  cycles: number;
  memory: number[];
  bus: string;
  fault: string | null;
}
export function assemble(source: string): number[] {
  if (source.length > 16000) throw Error('Programa excede 16 kB de texto.');
  const labels = new Map<string, number>();
  let address = 0;
  const lines = source
      .split('\n')
      .map((line) => line.split(';')[0].trim())
      .filter(Boolean),
    statements: { text: string; address: number }[] = [];
  for (let text of lines) {
    const label = text.match(/^([A-Za-z_]\w*):/);
    if (label) {
      if (labels.has(label[1])) throw Error(`Rótulo duplicado: ${label[1]}`);
      labels.set(label[1], address);
      text = text.slice(label[0].length).trim();
    }
    if (!text) continue;
    statements.push({ text, address });
    const op = text.split(/\s+/)[0].toUpperCase();
    if (op !== '.BYTE' && !Object.hasOwn(instructionSet, op))
      throw Error(`Instrução desconhecida: ${op}`);
    address += noOperand.has(op) || op === '.BYTE' ? 1 : 2;
    if (address > 256) throw Error('Programa excede 256 bytes.');
  }
  const bytes: number[] = [];
  for (const { text } of statements) {
    const [opRaw, arg, ...rest] = text.split(/\s+/),
      op = opRaw.toUpperCase();
    if (rest.length || (noOperand.has(op) ? arg !== undefined : arg === undefined))
      throw Error(`Operandos inválidos: ${text}`);
    if (op !== '.BYTE') bytes.push(instructionSet[op as keyof typeof instructionSet]);
    if (!noOperand.has(op)) {
      const value = labels.has(arg)
        ? labels.get(arg)!
        : /^(?:0x[\da-f]+|\d+)$/i.test(arg)
          ? Number(arg)
          : NaN;
      if (!Number.isInteger(value) || value < 0 || value > 255)
        throw Error(`Operando inválido: ${arg}`);
      bytes.push(value);
    }
  }
  return bytes;
}
export function createCPU(program: number[] = []): CPU {
  if (program.length > 256 || program.some((v) => !Number.isInteger(v) || v < 0 || v > 255))
    throw Error('Memória deve conter bytes válidos.');
  return {
    pc: 0,
    ir: 0,
    operand: 0,
    a: 0,
    mar: 0,
    mdr: 0,
    out: 0,
    zero: true,
    carry: false,
    phase: 'fetch',
    halted: false,
    cycles: 0,
    memory: Array.from({ length: 256 }, (_, i) => program[i] ?? 0),
    bus: 'Pronta para buscar instrução',
    fault: null,
  };
}
export function clockCPU(previous: CPU): CPU {
  if (previous.halted) return previous;
  const c = { ...previous, cycles: previous.cycles + 1 };
  if (c.phase === 'fetch') {
    c.mar = c.pc;
    c.mdr = c.memory[c.pc];
    c.ir = c.mdr;
    c.pc = (c.pc + 1) & 255;
    c.phase = 'decode';
    c.bus = `PC → MAR (${c.mar}); RAM → IR (${c.ir})`;
    return c;
  }
  if (c.phase === 'decode') {
    const name = Object.keys(instructionSet).find(
      (k) => instructionSet[k as keyof typeof instructionSet] === c.ir,
    );
    if (!name) {
      c.halted = true;
      c.fault = `Opcode inválido ${c.ir} em ${(c.pc - 1) & 255}`;
      c.bus = c.fault;
      return c;
    }
    c.phase = noOperand.has(name) ? 'execute' : 'operand';
    c.bus = `Decodificação: ${name}`;
    return c;
  }
  if (c.phase === 'operand') {
    c.mar = c.pc;
    c.mdr = c.memory[c.pc];
    c.operand = c.mdr;
    c.pc = (c.pc + 1) & 255;
    c.phase = 'execute';
    c.bus = `RAM[${c.mar}] → operando (${c.operand})`;
    return c;
  }
  const op = c.ir;
  c.phase = 'fetch';
  if (op === instructionSet.LDI) {
    c.a = c.operand;
    c.zero = c.a === 0;
    c.bus = `Operando → A (${c.a})`;
  } else if (op === instructionSet.LDA) {
    c.mar = c.operand;
    c.a = c.memory[c.mar];
    c.zero = c.a === 0;
    c.bus = `RAM[${c.mar}] → A (${c.a})`;
  } else if (op === instructionSet.STA) {
    c.mar = c.operand;
    c.memory = [...c.memory];
    c.memory[c.mar] = c.a;
    c.bus = `A → RAM[${c.mar}] (${c.a})`;
  } else if ([4, 5, 10, 11, 12].includes(op)) {
    const operation = (
      { 4: 'ADD', 5: 'SUB', 10: 'AND', 11: 'OR', 12: 'XOR' } as Record<number, AluOperation>
    )[op];
    const r = alu(c.a, c.operand, operation);
    c.a = r.value;
    c.zero = r.zero;
    c.carry = r.carry;
    c.bus = `ALU ${operation} → A (${c.a})`;
  } else if (op === instructionSet.JMP || (op === instructionSet.JZ && c.zero)) {
    c.pc = c.operand;
    c.bus = `Controle → PC (${c.pc})`;
  } else if (op === instructionSet.OUT) {
    c.out = c.a;
    c.bus = `A → saída (${c.out})`;
  } else if (op === instructionSet.HLT) {
    c.halted = true;
    c.bus = 'HLT · clock suspenso';
  } else c.bus = op === instructionSet.JZ ? 'JZ não tomado' : 'NOP';
  return c;
}
export function stepInstruction(c: CPU): CPU {
  let next = c;
  for (let i = 0; i < 4; i++) {
    next = clockCPU(next);
    if (next.halted || next.phase === 'fetch') break;
  }
  return next;
}
export const demoPrograms = {
  sum: '; ISA didática: ADD/SUB usam operando imediato\nLDI 5\nADD 3\nSTA 240\nOUT\nHLT',
  count: 'LDI 3\nloop: OUT\nSUB 1\nJZ end\nJMP loop\nend: OUT\nHLT',
  bitwise: 'LDI 170\nAND 15\nXOR 3\nOUT\nHLT',
};
