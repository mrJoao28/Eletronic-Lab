import { describe, it, expect } from 'vitest';
import { schematicGraph } from './schematic';
import { example } from './examples';
describe('Esquema da montagem', () => {
  it('inclui inserção física e trilhos da placa no mesmo nó', () => {
    const g = schematicGraph(example('rc'));
    const r = g.components.find((c) => c.part.id === 'r1')!,
      ps = g.components.find((c) => c.part.id === 'ps')!;
    expect(r.pins[0].node).toBe(ps.pins[0].node);
    expect(g.components.some((c) => c.part.kind === 'board')).toBe(false);
  });
  it('religar um fio altera o nó representado', () => {
    const p = example('rc');
    p.wires = p.wires.filter((w) => w.to !== 'bb:a7');
    const g = schematicGraph(p),
      r = g.components.find((c) => c.part.id === 'r1')!,
      ps = g.components.find((c) => c.part.id === 'ps')!;
    expect(r.pins[0].node).not.toBe(ps.pins[0].node);
  });
});
