import { terminals, world, type Part, type Project, type Vec } from './engine';

export interface Placement {
  position: Vec;
  board: string;
  holes: string[];
}
const insertable = (p: Part) =>
  [
    'resistor',
    'capacitor',
    'adder',
    'led',
    'diode',
    'button',
    'potentiometer',
    'transistor',
  ].includes(p.kind);
const distance = (a: Vec, b: Vec) => Math.hypot(...a.map((v, i) => v - b[i]));

// Use the electrical coordinates, rather than a separate approximate visual grid.
// Every lead must fit a different, unoccupied hole on the same board.
export function snapPlacement(
  project: Project,
  part: Part,
  proposed: Vec,
  radius = 3.5,
): Placement | null {
  if (!insertable(part)) return null;
  const moving = { ...part, position: proposed };
  const leads = terminals(moving).map((t) => world(moving, t));
  let best: Placement | null = null;
  let bestDistance = radius;
  for (const board of project.parts.filter((p) => p.kind === 'board')) {
    const holes = terminals(board).map((t) => ({ id: t.id, point: world(board, t) }));
    const occupied = new Set<string>();
    for (const other of project.parts.filter((p) => p.id !== part.id && insertable(p))) {
      for (const t of terminals(other)) {
        const at = world(other, t);
        const hole = holes.find((h) => distance(h.point, at) < 0.06);
        if (hole) occupied.add(hole.id);
      }
    }
    for (const hole of holes) {
      const delta = hole.point.map((v, i) => v - leads[0][i]) as Vec;
      const d = Math.hypot(...delta);
      if (d > bestDistance) continue;
      const targets = leads.map((at) =>
        holes.find(
          (h) =>
            !occupied.has(h.id) && distance(h.point, at.map((v, i) => v + delta[i]) as Vec) < 0.06,
        ),
      );
      if (targets.some((t) => !t) || new Set(targets.map((t) => t!.id)).size !== leads.length)
        continue;
      bestDistance = d;
      best = {
        position: proposed.map((v, i) => Number((v + delta[i]).toFixed(6))) as Vec,
        board: board.id,
        holes: targets.map((t) => t!.id),
      };
    }
  }
  return best;
}
