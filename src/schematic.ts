import { netlist, terminals, type Project } from './engine';
export function schematicGraph(p: Project) {
  const net = netlist(p),
    parts = p.parts.filter((c) => c.kind !== 'board');
  const components = parts.map((part, i) => ({
    part,
    x: 50 + (i % 3) * 290,
    y: 60 + Math.floor(i / 3) * 260,
    pins: terminals(part).map((t) => ({ ...t, node: net.node(t.id) })),
  }));
  const nets = new Map<string, { part: string; terminal: string }[]>();
  for (const c of components)
    for (const pin of c.pins) {
      const list = nets.get(pin.node) ?? [];
      list.push({ part: c.part.id, terminal: pin.id });
      nets.set(pin.node, list);
    }
  return { components, nets, height: Math.max(320, Math.ceil(parts.length / 3) * 260 + 60) };
}
