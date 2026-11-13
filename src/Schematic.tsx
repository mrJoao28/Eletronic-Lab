import { useMemo, useRef } from 'react';
import { schematicGraph } from './schematic';
import type { Project, Reading } from './engine';
export default function Schematic({
  project,
  reading,
  selected,
  onSelect,
  onTerminal,
}: {
  project: Project;
  reading: Reading;
  selected: string;
  onSelect: (id: string) => void;
  onTerminal: (id: string) => void;
}) {
  const graph = useMemo(() => schematicGraph(project), [project]),
    svg = useRef<SVGSVGElement>(null);
  const names = new Map([...graph.nets.keys()].sort().map((n, i) => [n, `N${i + 1}`]));
  const exportSVG = () => {
    if (!svg.current) return;
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svg.current)], { type: 'image/svg+xml' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eletronic-lab-esquema.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="schematic-view" aria-label="Esquema elétrico sincronizado">
      <div className="schematic-legend">
        <span>
          Terminais com o mesmo N pertencem ao mesmo nó elétrico. Furos e fios da protoboard são
          incluídos no cálculo.
        </span>
        <button onClick={exportSVG}>Exportar SVG</button>
      </div>
      <svg
        ref={svg}
        viewBox={`0 0 930 ${graph.height}`}
        xmlns="http://www.w3.org/2000/svg"
        role="group"
        aria-label="Componentes e nós da montagem"
        style={{ background: '#0e1117' }}
      >
        {graph.components.map((c) => (
          <g key={c.part.id} transform={`translate(${c.x} ${c.y})`}>
            <g
              role="button"
              tabIndex={0}
              aria-label={`Selecionar ${c.part.ref} no esquema`}
              onClick={() => onSelect(c.part.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(c.part.id);
                }
              }}
            >
              <rect
                x="0"
                y="0"
                width="225"
                height="205"
                rx="10"
                fill={selected === c.part.id ? '#29344b' : '#181e29'}
                stroke={selected === c.part.id ? '#a4b9ff' : '#53617a'}
                strokeWidth="2"
              />
              <text x="12" y="24" fill="#e1e7f4" fontSize="14" fontFamily="monospace">
                {c.part.ref} · {c.part.kind}
              </text>
              {c.part.kind === 'resistor' ? (
                <path d="M95 58h10l5 -8 10 16 10 -16 10 16 5 -8h10" stroke="#becbec" fill="none" />
              ) : c.part.kind === 'capacitor' ? (
                <path d="M100 58h20m0 -12v24m8 -24v24m0 -12h20" stroke="#becbec" fill="none" />
              ) : c.part.kind === 'source' ? (
                <g>
                  <circle cx="125" cy="58" r="18" stroke="#becbec" fill="none" />
                  <text x="116" y="63" fill="#becbec">
                    ±
                  </text>
                </g>
              ) : c.part.kind === 'ground' ? (
                <path d="M125 44v20m-15 0h30m-25 5h20m-15 5h10" stroke="#becbec" />
              ) : (
                <rect x="102" y="43" width="46" height="30" fill="#303c53" stroke="#becbec" />
              )}
              <text x="12" y="91" fill="#a8b6d2" fontSize="10">
                {c.part.kind === 'resistor'
                  ? `${c.part.value} Ω`
                  : c.part.kind === 'capacitor'
                    ? `${Math.round(c.part.value * 1e6)} µF`
                    : c.part.kind === 'source'
                      ? `${c.part.value} V`
                      : ''}
              </text>
            </g>
            {c.pins.map((pin, i) => {
              const col = i % 2,
                row = Math.floor(i / 2),
                x = col ? 215 : 10,
                y = 108 + row * 11;
              return (
                <g
                  key={pin.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Terminal ${pin.id} no esquema`}
                  onClick={() => onTerminal(pin.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onTerminal(pin.id);
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r="3.3"
                    fill={reading.digital[pin.id] === 'X' ? '#be925e' : '#9caee0'}
                  />
                  <text
                    x={col ? x - 6 : x + 6}
                    y={y + 3}
                    textAnchor={col ? 'end' : 'start'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fill="#d6def1"
                  >
                    {pin.label} · {names.get(pin.node)}
                    {reading.voltages[pin.id] !== undefined
                      ? ` · ${reading.voltages[pin.id].toFixed(2)} V`
                      : ''}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="net-table">
        {[...graph.nets]
          .filter(([, terminals]) => terminals.length > 1)
          .map(([node, list]) => (
            <div key={node}>
              <strong>{names.get(node)}</strong>
              <code>{list.map((t) => t.terminal).join(' ↔ ')}</code>
            </div>
          ))}
      </div>
    </section>
  );
}
