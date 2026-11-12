import { describe, expect, it } from 'vitest';
import { example } from './examples';
import { netlist, type Vec } from './engine';
import { snapPlacement } from './placement';

describe('Encaixe físico na protoboard', () => {
  it('encaixa todos os terminais e usa os mesmos nós do motor', () => {
    const p = example('rc');
    const r = p.parts.find((p) => p.id === 'r1')!;
    const target = snapPlacement(p, r, [-16.2, 0, -10.4]);
    expect(target?.position).toEqual(r.position);
    expect(target?.holes).toEqual(['bb:c7', 'bb:c11']);
    r.position = target!.position;
    expect(netlist(p).node('r1:1')).toBe(netlist(p).node('bb:c7'));
  });
  it('funciona após deslocamento e rotação da placa', () => {
    const p = example('rc');
    const board = p.parts[0];
    board.position = [20, 0, 30];
    board.rotation = 90;
    const r = p.parts.find((p) => p.id === 'r1')!;
    r.rotation = 90;
    const desired: Vec = [30.16, 0, 13.49];
    const target = snapPlacement(p, r, [30.4, 0, 13.6]);
    expect(target?.position).toEqual(desired);
    r.position = target!.position;
    expect(netlist(p).node('r1:1')).toBe(netlist(p).node('bb:c7'));
  });
  it('não encaixa em furos ocupados nem aproxima peças distantes', () => {
    const p = example('rc');
    const original = p.parts.find((p) => p.id === 'r1')!;
    const copy = { ...original, id: 'r2' };
    expect(snapPlacement(p, copy, original.position, 0.1)).toBeNull();
    expect(snapPlacement(p, copy, [200, 0, 200])).toBeNull();
    expect(snapPlacement(p, p.parts[1], [0, 0, 0])).toBeNull();
  });
  it('não encaixa um CI se uma das duas fileiras não puder ser inserida', () => {
    const p = example('adder');
    const chip = p.parts.find((p) => p.kind === 'adder')!;
    const fit = snapPlacement(p, chip, [5.2, 0, -1.1]);
    expect(fit?.holes).toHaveLength(16);
    expect(snapPlacement(p, chip, [5.08, 0, -10.16], 0.1)).toBeNull();
  });
});
