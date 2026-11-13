import { useMemo } from 'react';
import { definitions, terminals, world, type Project } from '../engine';
/** Top view derived from the saved document rather than a stock project icon. */
export default function ProjectPreview({ project }: { project: Project }) {
  const geometry = useMemo(() => {
    const parts = project.parts.slice(0, 80);
    const left = Math.min(
      -10,
      ...parts.map((p) => p.position[0] - definitions[p.kind].dimensions[0] / 2),
    );
    const right = Math.max(
      10,
      ...parts.map((p) => p.position[0] + definitions[p.kind].dimensions[0] / 2),
    );
    const top = Math.min(
      -10,
      ...parts.map((p) => p.position[2] - definitions[p.kind].dimensions[2] / 2),
    );
    const bottom = Math.max(
      10,
      ...parts.map((p) => p.position[2] + definitions[p.kind].dimensions[2] / 2),
    );
    const scale = Math.min(270 / (right - left), 110 / (bottom - top));
    const point = (x: number, z: number) => [
      160 + (x - (left + right) / 2) * scale,
      75 + (z - (top + bottom) / 2) * scale,
    ];
    const pins = new Map(
      parts.flatMap((p) =>
        terminals(p).map((t) => {
          const pos = world(p, t);
          return [t.id, point(pos[0], pos[2])] as const;
        }),
      ),
    );
    return { parts, point, pins, scale };
  }, [project]);
  return (
    <svg
      className="project-drawing"
      viewBox="0 0 320 150"
      role="img"
      aria-label={`Vista superior da montagem ${project.name}`}
    >
      <path
        d="M0 30H320M0 60H320M0 90H320M0 120H320M40 0V150M80 0V150M120 0V150M160 0V150M200 0V150M240 0V150M280 0V150"
        className="preview-grid"
      />
      {geometry.parts.map((p) => {
        const [x, y] = geometry.point(p.position[0], p.position[2]);
        const size = definitions[p.kind].dimensions;
        const w = Math.max(8, size[0] * geometry.scale),
          h = Math.max(6, size[2] * geometry.scale);
        return (
          <g key={p.id} transform={`translate(${x} ${y}) rotate(${p.rotation})`}>
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx={p.kind === 'capacitor' ? Math.min(w, h) / 2 : 2}
              className={`preview-part preview-${p.kind}`}
            />
            {p.kind === 'board' && (
              <path
                d={`M${-w / 2 + 5} -3H${w / 2 - 5}M${-w / 2 + 5} 3H${w / 2 - 5}`}
                className="preview-grid"
              />
            )}
            <text
              textAnchor="middle"
              y={Math.max(3, h / 2 + 10)}
              transform={`rotate(${-p.rotation})`}
            >
              {p.ref}
            </text>
          </g>
        );
      })}
      {project.wires.slice(0, 160).map((w) => {
        const a = geometry.pins.get(w.from),
          b = geometry.pins.get(w.to);
        if (!a || !b) return null;
        return (
          <g key={w.id}>
            <path
              d={`M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2} ${Math.min(a[1], b[1]) - 12} ${b[0]} ${b[1]}`}
              className="preview-wire"
            />
            <circle cx={a[0]} cy={a[1]} r="2" className="preview-node" />
            <circle cx={b[0]} cy={b[1]} r="2" className="preview-node" />
          </g>
        );
      })}
    </svg>
  );
}
