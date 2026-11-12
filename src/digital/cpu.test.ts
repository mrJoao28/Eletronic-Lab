import { describe, it, expect } from 'vitest';
import { DigitalCircuit, gate, alu, registerStep } from './logic';
import { assemble, createCPU, clockCPU, stepInstruction, demoPrograms } from './cpu';
describe('Lógica digital por eventos', () => {
  it('propaga atraso e estados indefinidos', () => {
    const c = new DigitalCircuit([
      { id: 'g', kind: 'AND', inputs: ['a', 'b'], output: 'q', delay: 5 },
    ]);
    c.input('a', 1);
    c.input('b', 1);
    c.runUntil(4);
    expect(c.read('q')).toBe('X');
    c.runUntil(5);
    expect(c.read('q')).toBe(1);
    expect(gate('AND', [0, 'X'])).toBe(0);
    expect(gate('OR', [1, 'X'])).toBe(1);
    expect(gate('XOR', [1, 'X'])).toBe('X');
  });
  it('captura D apenas na borda de subida', () => {
    const c = new DigitalCircuit([
      { id: 'ff', kind: 'DFF', inputs: ['d', 'clk'], output: 'q', delay: 1 },
    ]);
    c.input('clk', 0);
    c.input('d', 1);
    c.runUntil(1);
    c.input('clk', 1);
    c.runUntil(2);
    expect(c.read('q')).toBe(1);
    c.input('d', 0);
    c.runUntil(3);
    expect(c.read('q')).toBe(1);
    c.input('clk', 0);
    c.runUntil(4);
    c.input('clk', 1);
    c.runUntil(5);
    expect(c.read('q')).toBe(0);
  });
  it('resolve conflitos e mantém registrador sem habilitação', () => {
    const c = new DigitalCircuit([]);
    c.input('x', 1, 0, 'a');
    c.input('x', 0, 0, 'b');
    c.runUntil(0);
    expect(c.read('x')).toBe('X');
    expect(registerStep(4, 9, 0, 1, false)).toBe(4);
    expect(registerStep(4, 9, 0, 1, true)).toBe(9);
    expect(registerStep(4, 9, 1, 0, true)).toBe(4);
  });
  it('ALU respeita overflow e flags para todos os bytes', () => {
    for (let a = 0; a < 256; a++)
      for (let b = 0; b < 256; b++) {
        expect(alu(a, b, 'ADD').value).toBe((a + b) & 255);
        expect(alu(a, b, 'ADD').carry).toBe(a + b > 255);
        expect(alu(a, b, 'SUB').value).toBe((a - b) & 255);
      }
  });
});
describe('CPU didática de 8 bits', () => {
  it('executa busca, decodificação, operando e execução separadamente', () => {
    let c = createCPU(assemble('LDI 5\nHLT'));
    expect(clockCPU(c).phase).toBe('decode');
    c = stepInstruction(c);
    expect(c.a).toBe(5);
    expect(c.cycles).toBe(4);
    expect(c.pc).toBe(2);
  });
  it('soma, escreve RAM, emite saída e para', () => {
    let c = createCPU(assemble(demoPrograms.sum));
    for (let i = 0; i < 100 && !c.halted; i++) c = clockCPU(c);
    expect(c.out).toBe(8);
    expect(c.memory[240]).toBe(8);
    expect(c.fault).toBeNull();
    expect(clockCPU(c)).toBe(c);
  });
  it('rótulos e salto condicional implementam laço até zero', () => {
    let c = createCPU(assemble(demoPrograms.count));
    for (let i = 0; i < 200 && !c.halted; i++) c = clockCPU(c);
    expect(c.halted).toBe(true);
    expect(c.out).toBe(0);
  });
  it('rejeita código e bytes malformados e detecta opcode inválido', () => {
    for (const source of ['LDI 300', 'XYZ 2', 'LDI', 'HLT 3', 'x: NOP\nx: HLT', 'JMP missing'])
      expect(() => assemble(source)).toThrow();
    expect(() => createCPU([NaN])).toThrow();
    let c = createCPU([255]);
    c = clockCPU(clockCPU(c));
    expect(c.fault).toContain('Opcode inválido');
  });
});
