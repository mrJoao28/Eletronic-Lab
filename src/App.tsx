import { scopeTrace } from './scopeTrace';
import { GraphicsBoundary } from './GraphicsBoundary';
import ExtendedGuide from './ExtendedGuide';
import { readShelf, saveToShelf, type SavedProject } from './projectShelf';
import { challenges, challengeProject, type ChallengeId } from './challenges';
import ChallengePanel from './ChallengePanel';
import Schematic from './Schematic';
import { meterReading, type MeterMode } from './metering';
import { diagnose } from './diagnostics';
import DiagnosticsPanel from './DiagnosticsPanel';
import { electronicsExample } from './electronicsExamples';
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Crosshair,
  FilePlus2,
  FolderOpen,
  Gauge,
  Grid2X2,
  Layers3,
  MousePointer2,
  Move,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Save,
  Settings2,
  SkipForward,
  Trash2,
  Undo2,
  Unplug,
  X,
  Zap,
} from 'lucide-react';
const Bench = lazy(() => import('./Bench'));
const ModelGallery = lazy(() => import('./ModelGallery'));
const ComputerWorkbench = lazy(() => import('./digital/ComputerWorkbench'));
import {
  allTerminals,
  definitions,
  measure,
  netlist,
  parseProject,
  simulate,
  terminals,
  type Kind,
  type Part,
  type Project,
  type Terminal,
  type Vec,
} from './engine';
import { example } from './examples';

const TerminalOptions = memo(function TerminalOptions({
  options,
  parts,
}: {
  options: Terminal[];
  parts: Part[];
}) {
  const refs = new Map(parts.map((p) => [p.id, p.ref]));
  return (
    <>
      {options.map((t) => (
        <option key={t.id} value={t.id}>
          {refs.get(t.part)} · {t.label}
        </option>
      ))}
    </>
  );
});
type Sample = { t: number; v: number | null; logic: (0 | 1 | 'X')[] };
const format = (v: number | null | undefined, digits = 3) =>
  v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toFixed(digits);
function Tool({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`icon-button ${active ? 'active' : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function PartIcon({ kind }: { kind: Kind }) {
  if (['led', 'diode', 'button', 'potentiometer', 'transistor'].includes(kind))
    return (
      <svg viewBox="0 0 80 48" className="part-icon" aria-hidden="true">
        <path d="M8 24h15m34 0h15" />
        {kind === 'led' || kind === 'diode' ? (
          <>
            <path d="M25 14v20l25-10zM52 13v22" fill={kind === 'led' ? '#c46e48' : '#9c784f'} />
            {kind === 'led' && <path d="M48 9l8-6m-2 12l9-7" />}
          </>
        ) : kind === 'button' ? (
          <>
            <circle cx="25" cy="24" r="2" />
            <circle cx="55" cy="24" r="2" />
            <path d="M26 22l27-12m-16-7h12" />
          </>
        ) : kind === 'potentiometer' ? (
          <>
            <rect x="25" y="15" width="30" height="18" fill="#587c87" />
            <path d="M40 2v17m-5-5l5 5 5-5" />
          </>
        ) : (
          <>
            <circle cx="40" cy="24" r="16" />
            <path d="M33 14v20m0-10l19-11m-19 11l19 12m-8-5l8 5-8 0" />
          </>
        )}
      </svg>
    );
  return (
    <svg viewBox="0 0 80 48" className="part-icon" aria-hidden="true">
      {kind === 'resistor' ? (
        <>
          <path d="M8 24h20m24 0h20" />
          <rect x="25" y="15" width="30" height="18" rx="8" fill="#93a78f" />
          {[31, 37, 43, 49].map((x, i) => (
            <path
              key={x}
              d={`M${x} 16v16`}
              stroke={['#725543', '#363b37', '#b68a58', '#c8b57b'][i]}
              strokeWidth="3"
            />
          ))}
        </>
      ) : kind === 'capacitor' ? (
        <>
          <path d="M33 30v13m15-13v13" />
          <ellipse cx="40" cy="13" rx="15" ry="6" fill="#b4c3ba" />
          <path d="M25 13v18c0 9 30 9 30 0V13" fill="#4f7276" />
          <ellipse cx="40" cy="13" rx="15" ry="6" />
          <path d="M48 16v17" stroke="#cad3c3" strokeWidth="4" />
        </>
      ) : kind === 'board' ? (
        <>
          <rect x="9" y="9" width="62" height="31" rx="3" fill="#bfc5b6" />
          {Array.from({ length: 30 }, (_, i) => (
            <circle
              key={i}
              cx={15 + (i % 10) * 5.5}
              cy={16 + Math.floor(i / 10) * 8}
              r="1"
              fill="#4b5b53"
            />
          ))}
        </>
      ) : kind === 'adder' ? (
        <>
          <rect x="20" y="12" width="40" height="24" rx="2" fill="#424e4b" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${24 + i * 4.5} 6v6m0 24v7`} />
          ))}
          <text x="40" y="27" textAnchor="middle" fill="#a9b8ac" fontSize="7">
            HC283
          </text>
        </>
      ) : kind === 'source' ? (
        <>
          <rect x="16" y="8" width="48" height="32" rx="3" fill="#7e8f88" />
          <rect x="22" y="14" width="27" height="12" fill="#233c37" />
          <text x="35" y="23" textAnchor="middle" fill="#d3c691" fontSize="9">
            5.00
          </text>
          <circle cx="56" cy="20" r="4" fill="#ccc9af" />
          <circle cx="28" cy="33" r="2" fill="#d79270" />
          <circle cx="43" cy="33" r="2" fill="#637f95" />
        </>
      ) : kind === 'inputs' ? (
        <>
          <rect x="10" y="12" width="60" height="26" rx="3" fill="#42685a" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={14 + i * 6} y={i % 2 ? 17 : 24} width="3" height="8" fill="#d2c291" />
          ))}
        </>
      ) : (
        <path d="M40 8v18m-17 0h34M28 32h24m-18 6h12" />
      )}
    </svg>
  );
}
function Scope({
  samples,
  time,
  volts,
  timebase,
}: {
  samples: Sample[];
  time: number;
  volts: number;
  timebase: number;
}) {
  const width = timebase * 10,
    start = Math.max(0, time - width);
  let path = '';
  let pen = false;
  samples
    .filter((s) => s.t >= start)
    .forEach((s) => {
      if (s.v === null) {
        pen = false;
        return;
      }
      const x = 48 + ((s.t - start) / width) * 770,
        y = 151 - (s.v / (volts * 6)) * 130;
      path += `${pen ? 'L' : 'M'}${x.toFixed(1)},${Math.max(10, Math.min(168, y)).toFixed(1)} `;
      pen = true;
    });
  return (
    <svg
      className="scope-plot"
      viewBox="0 0 840 194"
      preserveAspectRatio="none"
      role="img"
      aria-label="Osciloscópio: tensão medida ao longo do tempo"
    >
      <defs>
        <pattern id="scope-grid" width="77" height="22" patternUnits="userSpaceOnUse" x="48" y="19">
          <path d="M77 0H0V22" fill="none" stroke="#35413e" strokeWidth=".7" />
        </pattern>
        <clipPath id="plot-clip">
          <rect x="48" y="10" width="770" height="158" />
        </clipPath>
      </defs>
      <rect x="48" y="19" width="770" height="132" fill="url(#scope-grid)" />
      <path d="M48 151H818" stroke="#78816b" strokeDasharray="3 4" strokeWidth=".7" />
      {[0, 2, 4, 6].map((i) => (
        <text key={i} x="33" y={155 - i * 22} textAnchor="end">
          {(i * volts).toFixed(1)}
        </text>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <text key={i} x={48 + i * 154} y="181" textAnchor="middle">
          {(start + (i * width) / 5).toFixed(1)} s
        </text>
      ))}
      <g clipPath="url(#plot-clip)">
        <path
          d={path}
          fill="none"
          stroke="#e7bd75"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <text x="22" y="15">
        V
      </text>
    </svg>
  );
}
function Guide({ project, onClose }: { project: Project; onClose: () => void }) {
  const rc = project.experiment === 'rc';
  if (
    project.parts.some((c) =>
      ['led', 'diode', 'button', 'potentiometer', 'transistor'].includes(c.kind),
    ) ||
    project.parts.filter((c) => c.kind === 'capacitor').length > 1
  )
    return <ExtendedGuide project={project} onClose={onClose} />;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal guide"
        role="dialog"
        aria-modal="true"
        aria-label="Guia do experimento"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-heading">
          <span className="eyebrow">CADERNO DE LABORATÓRIO / {rc ? '01' : '02'}</span>
          <Tool label="Fechar guia" onClick={onClose}>
            <X size={19} />
          </Tool>
        </div>
        <h2>{rc ? 'Uma constante, muitas respostas.' : 'Dos bits à aritmética.'}</h2>
        <p>
          {rc
            ? 'Construa um circuito RC e observe como a energia é armazenada no capacitor.'
            : 'Monte um somador combinacional de 4 bits com um CD74HC283 da família HC.'}
        </p>
        <div className="guide-schema">
          {rc ? (
            <svg viewBox="0 0 600 150" aria-label="Esquema RC">
              <g fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="65" cy="75" r="25" />
                <path d="M65 50V25h110m70 0h120v42m-15 0h30m-30 10h30m-15 0v48H65v-25M175 16h70v18h-70zM365 25h90m0 0v45m-15 0h30m-24 6h18m-12 6h6" />
              </g>
              <g fill="currentColor" fontSize="13">
                <text x="45" y="79">
                  V1
                </text>
                <text x="180" y="12">
                  R1
                </text>
                <text x="385" y="75">
                  C1
                </text>
                <text x="465" y="32">
                  CH1+
                </text>
                <text x="247" y="143">
                  GND / CH1−
                </text>
              </g>
            </svg>
          ) : (
            <div className="adder-schema">
              <span>
                A[3:0]
                <br />
                B[3:0]
                <br />
                Cin
              </span>
              <b>→</b>
              <strong>
                CD74HC283
                <br />
                <small>16: +5 V · 8: GND</small>
              </strong>
              <b>→</b>
              <span>
                S[3:0]
                <br />
                Cout
              </span>
            </div>
          )}
        </div>
        <h3>Lista de materiais e reprodução física</h3>
        {rc ? (
          <p>
            1 fonte DC de 0–5 V, resistor Vishay MRS25 de 10 kΩ (1%), capacitor Nichicon UHE de 100
            µF / 16 V (±20%), protoboard, jumpers e osciloscópio. Ligue V1+ → R1 → C1+; C1− e V1− ao
            GND. Meça CH1+ em C1+ e CH1− no GND. Comute a fonte entre 5 V e 0 V mantendo o resistor
            no caminho. Não descarregue o capacitor por curto. τ = R × C = 1 s. Valores físicos
            variam com a tolerância.
          </p>
        ) : (
          <p>
            1 CD74HC283 em PDIP-16, fonte regulada de 5 V, capacitor cerâmico de desacoplamento de
            100 nF entre pinos 16 e 8, 9 seletores SPDT entre +5 V e GND, protoboard, jumpers e
            analisador lógico com entradas compatíveis com 5 V. Nenhuma entrada CMOS deve flutuar.
            Pinos A1–A4: 5, 3, 14, 12; B1–B4: 6, 2, 15, 11; Cin: 7; S1–S4: 4, 1, 13, 10; Cout: 9. O
            desacoplamento é obrigatório na montagem física; não afeta o modelo estático ideal. LEDs
            físicos exigem resistores e respeito às correntes de saída.
          </p>
        )}
        <h3>Modelo e condições</h3>
        <p>
          {rc
            ? 'Solução exponencial de um capacitor ideal ligado a uma rede resistiva linear e ao terra. Sem ESR, fuga, tolerância, aquecimento ou parasitas. Instantes de conexão direta a uma fonte ideal não são resolvidos.'
            : 'Modelo lógico estático em 5 V. X indica entrada não definida ou conflito. Não representa atrasos, glitches, consumo ou características elétricas de saída. HC, HCT e LS não são tratados como equivalentes.'}{' '}
          As pontas dos instrumentos são ideais e não carregam o circuito. As cores de nós e linhas
          tracejadas das sondas são representações didáticas.
        </p>
        <h3>Referências primárias</h3>
        <p>
          <a
            href="https://www.ti.com/lit/ds/symlink/cd74hc283.pdf"
            target="_blank"
            rel="noreferrer"
          >
            TI · CD74HC283
          </a>{' '}
          ·{' '}
          <a href="https://www.vishay.com/docs/28724/mrs16m25.pdf" target="_blank" rel="noreferrer">
            Vishay · MRS25
          </a>{' '}
          ·{' '}
          <a
            href="https://www.nichicon.com/getmedia/5ee6e3a3-2d90-4858-bed0-89ef58a93bc3/e-uhe.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Nichicon · UHE
          </a>
        </p>
        <h3>Conexões desta montagem</h3>
        <div className="guide-nets">
          {project.wires.map((w) => (
            <div key={w.id}>
              <code>{w.from}</code>
              <span>↔</span>
              <code>{w.to}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
export default function App({
  active = true,
  accountId,
  accountEmail,
  onAccount,
  initialProject,
  initialCloudId,
  initialChallenge,
  onCloudSave,
  onChallengeComplete,
}: {
  active?: boolean;
  accountId?: string;
  accountEmail?: string;
  onAccount?: () => void;
  initialProject?: Project;
  initialCloudId?: string;
  initialChallenge?: ChallengeId;
  onCloudSave?: (project: Project, id?: string) => Promise<string>;
  onChallengeComplete?: (id: ChallengeId) => Promise<void>;
} = {}) {
  const STORAGE = accountId ? `eletronic-lab.${accountId}.v1` : 'eletronic-lab.project.v1';
  const SHELF = accountId ? `eletronic-lab.${accountId}.shelf.v1` : 'eletronic-lab.shelf.v1';
  const ACTIVE = accountId ? `eletronic-lab.${accountId}.activeId.v1` : 'eletronic-lab.activeId.v1';
  const [cloudId, setCloudId] = useState(initialCloudId);
  const cloudGeneration = useRef(0);
  const saving = useRef(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [inspector, setInspector] = useState(false);
  const [focusScene, setFocusScene] = useState(false);
  const [savedId, setSavedId] = useState<string>();
  const [entries, setEntries] = useState<SavedProject[]>(() => {
    try {
      return readShelf(localStorage.getItem(SHELF), localStorage.getItem(STORAGE)).entries;
    } catch {
      return [];
    }
  });
  const [showArchived, setShowArchived] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeId | null>(initialChallenge ?? null);
  const [chooseChallenge, setChooseChallenge] = useState(false);
  const [computer, setComputer] = useState(() => window.location.hash === '#cpu');
  const [meterMode, setMeterMode] = useState<MeterMode>('voltage');
  const [project, setProject] = useState<Project>(() =>
    structuredClone(initialProject ?? example('rc')),
  );
  const [past, setPast] = useState<Project[]>([]),
    [future, setFuture] = useState<Project[]>([]);
  const [selected, setSelected] = useState('r1'),
    [tool, setTool] = useState('select'),
    [pending, setPending] = useState(''),
    [wireColor, setWireColor] = useState('#e5ae56');
  const [running, setRunning] = useState(false),
    [tick, setTick] = useState(0),
    [view, setView] = useState(window.location.hash === '#schematic' ? 'schematic' : 'perspective'),
    [quality, setQuality] = useState('high'),
    [labels, setLabels] = useState(true),
    [nodes, setNodes] = useState(false),
    [library, setLibrary] = useState(true),
    [guide, setGuide] = useState(false),
    [open, setOpen] = useState(false),
    [tab, setTab] = useState('scope'),
    [volts, setVolts] = useState(1),
    [timebase, setTimebase] = useState(1),
    [toast, setToast] = useState(''),
    [search, setSearch] = useState('');
  useEffect(() => {
    if (!active) setRunning(false);
  }, [active]);
  const sim = useRef({
    capacitor: 0,
    capacitors: {} as Record<string, number>,
    time: 0,
    samples: [] as Sample[],
  });
  const file = useRef<HTMLInputElement>(null);
  const projectRef = useRef(project);
  projectRef.current = project;
  const reading = useMemo(() => simulate(project, sim.current.capacitors, 0), [project, tick]);
  const measured = measure(project, reading);
  const meter = useMemo(
    () => meterReading(project, reading, meterMode),
    [project, reading, meterMode],
  );
  const trace = useMemo(
    () => scopeTrace(sim.current.samples, sim.current.time, timebase, volts),
    [tick, timebase, volts],
  );
  const diagnostics = useMemo(() => diagnose(project, reading), [project, reading]);
  const selectedPart = project.parts.find((p) => p.id === selected),
    selectedWire = project.wires.find((w) => w.id === selected);
  const options = useMemo(() => allTerminals(project), [project.parts]);
  const nets = useMemo(() => netlist(project), [project]);
  const message = useCallback((text: string) => setToast(text), []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  const edit = useCallback((next: Project) => {
    setPast((h) => [...h.slice(-79), projectRef.current]);
    setFuture([]);
    setProject(next);
  }, []);
  const reset = () => {
    sim.current = { capacitor: 0, capacitors: {}, time: 0, samples: [] };
    setTick((t) => t + 1);
  };
  const advance = useCallback(() => {
    const p = projectRef.current,
      s = sim.current,
      r = simulate(p, s.capacitors, 0.05);
    s.capacitor = r.capacitor;
    s.capacitors = r.capacitors;
    s.time += 0.05;
    s.samples.push({
      t: s.time,
      v: measure(p, r),
      logic: p.digitalProbes.map((t) => r.digital[t] ?? 'X'),
    });
    if (s.samples.length > 2000) s.samples.shift();
    setTick((t) => t + 1);
  }, []);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(advance, 50);
    return () => clearInterval(id);
  }, [running, advance]);
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [project, ...f]);
    setProject(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setPending('');
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, project]);
    setProject(future[0]);
    setFuture((f) => f.slice(1));
    setPending('');
  };
  const remove = (id = selected) => {
    const p = projectRef.current;
    const part = p.parts.find((c) => c.id === id);
    const deleted = new Set(part ? terminals(part).map((t) => t.id) : []);
    edit({
      ...p,
      parts: p.parts.filter((c) => c.id !== id),
      wires: p.wires.filter((w) => w.id !== id && !deleted.has(w.from) && !deleted.has(w.to)),
      probes: {
        positive: deleted.has(p.probes.positive) ? '' : p.probes.positive,
        negative: deleted.has(p.probes.negative) ? '' : p.probes.negative,
      },
      digitalProbes: p.digitalProbes.filter((t) => !deleted.has(t)),
      ...(p.meterProbes
        ? {
            meterProbes: {
              positive: deleted.has(p.meterProbes.positive) ? '' : p.meterProbes.positive,
              negative: deleted.has(p.meterProbes.negative) ? '' : p.meterProbes.negative,
            },
          }
        : {}),
    });
    setSelected('');
    setPending('');
  };
  const update = (id: string, patch: Partial<Part>) =>
    edit({ ...project, parts: project.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const select = (id: string) => {
    if (tool === 'delete' && id) {
      remove(id);
      return;
    }
    if (tool === 'rotate' && project.parts.some((p) => p.id === id)) {
      const p = project.parts.find((p) => p.id === id)!;
      update(id, { rotation: (p.rotation + 90) % 360 });
    }
    setSelected(id);
    setInspector(true);
    setFocusScene(false);
  };
  const terminalClick = (id: string) => {
    if (tool.startsWith('probe-')) {
      const meterTarget = tool.includes('meter');
      const key = tool.endsWith('positive') ? 'positive' : 'negative';
      if (meterTarget)
        edit({
          ...project,
          meterProbes: { ...(project.meterProbes ?? project.probes), [key]: id },
        });
      else {
        edit({ ...project, probes: { ...project.probes, [key]: id } });
        sim.current.samples = [];
      }
      setTool('select');
      setPending('');
      message('Ponta conectada.');
      return;
    }
    if (tool !== 'connect') {
      setSelected(id.split(':')[0]);
      setPending(id);
      return;
    }
    if (!pending) {
      setPending(id);
      return;
    }
    if (pending === id) {
      setPending('');
      return;
    }
    if (
      project.wires.some(
        (w) => (w.from === id && w.to === pending) || (w.to === id && w.from === pending),
      )
    ) {
      message('Estes terminais já estão conectados.');
      setPending('');
      return;
    }
    edit({
      ...project,
      wires: [
        ...project.wires,
        { id: crypto.randomUUID(), from: pending, to: id, color: wireColor },
      ],
    });
    setPending('');
  };
  const add = (kind: Kind) => {
    if (project.parts.length >= 40) {
      message('Limite de 40 componentes por projeto.');
      return;
    }
    const id = crypto.randomUUID();
    const refs: Record<Kind, string> = {
      led: 'D',
      diode: 'D',
      button: 'SW',
      potentiometer: 'RV',
      transistor: 'Q',
      board: 'BB',
      resistor: 'R',
      capacitor: 'C',
      source: 'V',
      ground: 'GND',
      adder: 'U',
      inputs: 'SW',
    };
    let count = 1;
    while (project.parts.some((p) => p.ref === refs[kind] + count)) count++;
    edit({
      ...project,
      parts: [
        ...project.parts,
        {
          id,
          kind,
          ref: refs[kind] + count,
          position: [45, 0, 25],
          rotation: 0,
          value:
            kind === 'resistor' || kind === 'potentiometer'
              ? 10000
              : kind === 'capacitor'
                ? 100e-6
                : kind === 'source'
                  ? 5
                  : 0,
          ...(kind === 'inputs' ? { bits: 0 } : {}),
        },
      ],
    });
    setSelected(id);
    setInspector(true);
    setFocusScene(false);
  };
  const loadExample = (mode: 'rc' | 'adder', blank = false) => {
    const next = example(mode);
    if (blank) {
      next.name = 'Nova montagem';
      next.parts = [];
      next.wires = [];
      next.probes = { positive: '', negative: '' };
      next.digitalProbes = [];
    }
    edit(next);
    setSavedId(undefined);
    setCloudId(undefined);
    cloudGeneration.current++;
    setChallenge(null);
    reset();
    setRunning(false);
    setSelected(mode === 'rc' ? 'r1' : 'u1');
    setPending('');
    setOpen(false);
    setTab(mode === 'rc' ? 'scope' : 'logic');
  };
  const save = async () => {
    if (saving.current) return;
    if (onCloudSave) {
      const generation = cloudGeneration.current;
      saving.current = true;
      setCloudSaving(true);
      try {
        const id = await onCloudSave(projectRef.current, cloudId);
        if (generation === cloudGeneration.current) {
          setCloudId(id);
          message('Projeto salvo na sua conta.');
        }
      } catch (error) {
        message(error instanceof Error ? error.message : 'Não foi possível salvar na sua conta.');
      } finally {
        saving.current = false;
        setCloudSaving(false);
      }
      return;
    }
    try {
      const saved = saveToShelf(
        readShelf(localStorage.getItem(SHELF), localStorage.getItem(STORAGE)),
        project,
        savedId,
      );
      localStorage.setItem(SHELF, JSON.stringify(saved.shelf));
      setSavedId(saved.id);
      localStorage.setItem(ACTIVE, saved.id);
      setEntries(saved.shelf.entries);
      localStorage.setItem(STORAGE, JSON.stringify(project));
      message('Projeto salvo neste navegador.');
    } catch {
      message('Não foi possível salvar: armazenamento indisponível ou cheio.');
    }
  };
  const restore = () => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) throw new Error('Nenhum projeto salvo neste navegador.');
      edit(parseProject(raw));
      setSavedId(localStorage.getItem(ACTIVE) ?? undefined);
      setChallenge(null);
      reset();
      setRunning(false);
      setOpen(false);
      message('Montagem recuperada.');
    } catch (e) {
      message((e as Error).message);
    }
  };
  const exportFile = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eletronic-lab-v1.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Projeto exportado em JSON v1.');
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gallery || computer) return;
      if ((e.target as HTMLElement).closest('input,select,textarea')) return;
      if (e.key === 'Escape') {
        setPending('');
        setTool('select');
        setGuide(false);
        setOpen(false);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setRunning((r) => !r);
      }
      if (e.key === 'Delete' && selected) {
        e.preventDefault();
        remove();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
  const probe = (key: 'positive' | 'negative', value: string) => {
    edit({ ...project, probes: { ...project.probes, [key]: value } });
    sim.current.samples = [];
  };
  const terminalSelect = (value: string, onChange: (value: string) => void, label: string) => (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Desconectada</option>
      <TerminalOptions options={options} parts={project.parts} />
    </select>
  );
  const rc = project.experiment === 'rc';
  const extendedAnalog =
    project.parts.some((c) =>
      ['led', 'button', 'potentiometer', 'diode', 'transistor'].includes(c.kind),
    ) || project.parts.filter((c) => c.kind === 'capacitor').length > 1;
  const source = project.parts.find((p) => p.kind === 'source'),
    input = project.parts.find((p) => p.kind === 'inputs');
  const bits = input?.bits ?? 0;
  if (computer)
    return (
      <Suspense fallback={<div className="model-loading-overlay">Preparando arquitetura…</div>}>
        <ComputerWorkbench storageScope={accountId} onClose={() => setComputer(false)} />
      </Suspense>
    );
  if (gallery)
    return (
      <Suspense
        fallback={<div className="model-loading-overlay">Preparando atlas de hardware…</div>}
      >
        <ModelGallery onClose={() => setGallery(false)} />
      </Suspense>
    );
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Eletronic Lab">
          <span className="brand-symbol">
            <CircuitBoard size={22} />
          </span>
          <span>
            eletronic<span className="brand-light">lab</span>
            <small>ELETRÔNICA · ARQUITETURA</small>
          </span>
        </a>
        <div className="header-middle">
          <span className="workspace-dot" /> {accountEmail ? 'Minha bancada' : 'Visitante'}
        </div>
        <div className="header-actions">
          <button className="quiet-button" onClick={onAccount}>
            {accountEmail ? 'Dashboard' : 'Entrar'}
          </button>
          <button className="quiet-button" onClick={() => setChooseChallenge(true)}>
            Desafios
          </button>
          <button
            className="quiet-button"
            onClick={() => {
              setRunning(false);
              setComputer(true);
            }}
          >
            <Cpu size={15} /> CPU e lógica
          </button>
          <button
            className="quiet-button"
            onClick={() => {
              setRunning(false);
              setGallery(true);
            }}
          >
            <Box size={15} /> Modelos 3D
          </button>
          <button className="quiet-button" onClick={() => setGuide(true)}>
            <BookOpen size={15} /> Guia do experimento
          </button>
          <span className="version">BETA 0.1</span>
        </div>
      </header>
      <nav className="project-bar">
        <div className="project-title">
          <span className="eyebrow">PROJETO</span>
          <input
            aria-label="Nome do projeto"
            value={project.name}
            maxLength={120}
            onChange={(e) => edit({ ...project, name: e.target.value })}
          />
        </div>
        <div className="experiment-tabs">
          <button className={rc ? 'selected' : ''} onClick={() => loadExample('rc')}>
            <Activity size={15} /> Eletrônica <span>01</span>
          </button>
          <button className={!rc ? 'selected' : ''} onClick={() => loadExample('adder')}>
            <Cpu size={15} /> Arquitetura <span>02</span>
          </button>
        </div>
        <div className="project-actions">
          <button className="quiet-button" onClick={() => setOpen(true)}>
            <FolderOpen size={16} /> Abrir <ChevronDown size={12} />
          </button>
          <button className="save-button" onClick={save}>
            <Save size={15} /> Salvar projeto
          </button>
        </div>
      </nav>
      <main
        className={`workspace ${library ? '' : 'collapsed'} ${inspector ? 'inspector-open' : ''} ${focusScene ? 'focus-workspace' : ''}`}
      >
        <aside className="library">
          <div className="panel-heading">
            <span>
              <Box size={15} /> COMPONENTES
            </span>
            <Tool
              label={library ? 'Recolher biblioteca' : 'Expandir biblioteca'}
              onClick={() => setLibrary((v) => !v)}
            >
              {library ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </Tool>
          </div>
          {library && (
            <>
              <div className="library-search">
                <Crosshair size={14} />
                <input
                  aria-label="Buscar componentes"
                  placeholder="Buscar componente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <kbd>⌕</kbd>
              </div>
              <div className="library-category">
                <span>{rc ? 'ELETRÔNICA BÁSICA' : 'LÓGICA DIGITAL'}</span>
                <span>{rc ? '10' : '05'}</span>
              </div>
              <div className="component-list">
                {(
                  (rc
                    ? [
                        'board',
                        'resistor',
                        'capacitor',
                        'source',
                        'ground',
                        'led',
                        'button',
                        'potentiometer',
                        'diode',
                        'transistor',
                      ]
                    : ['board', 'adder', 'inputs', 'source', 'ground']) as Kind[]
                )
                  .filter((k) => definitions[k].name.toLowerCase().includes(search.toLowerCase()))
                  .map((kind) => (
                    <button
                      className="component-card"
                      key={kind}
                      onClick={() => add(kind)}
                      aria-label={`Adicionar ${definitions[kind].name}`}
                    >
                      <div className="component-image">
                        <PartIcon kind={kind} />
                        <span className="add-part">
                          <Plus size={12} />
                        </span>
                      </div>
                      <strong>{definitions[kind].name.split(' · ')[0]}</strong>
                      <small>{definitions[kind].name.split(' · ')[1] ?? '0–5 V · ajustável'}</small>
                    </button>
                  ))}
              </div>
              <div className="library-note">
                <span className="tiny-dot" />
                <span>
                  Componentes reais.
                  <br />
                  Modelos abertos e paramétricos.
                </span>
              </div>
              <button className="library-guide" onClick={() => setGuide(true)}>
                <BookOpen size={16} />
                <span>
                  Do virtual à bancada<small>Materiais, esquema e datasheets</small>
                </span>
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </aside>
        <section className="center-workspace">
          <div className="bench-toolbar">
            <div className="tool-group">
              {[
                ['select', 'Selecionar', MousePointer2],
                ['move', 'Mover', Move],
                ['rotate', 'Girar 90°', RotateCw],
                ['connect', 'Conectar terminais', Unplug],
                ['delete', 'Excluir', Trash2],
              ].map(([id, label, Icon]) => (
                <Tool
                  key={id as string}
                  label={label as string}
                  active={tool === id}
                  onClick={() => {
                    setTool(id as string);
                    setPending('');
                  }}
                >
                  <Icon size={16} />
                </Tool>
              ))}
              <span className="tool-divider" />
              <Tool label="Desfazer" disabled={!past.length} onClick={undo}>
                <Undo2 size={16} />
              </Tool>
              <Tool label="Refazer" disabled={!future.length} onClick={redo}>
                <Redo2 size={16} />
              </Tool>
            </div>
            <div className="view-toggle">
              <button
                className={view === 'schematic' ? 'selected' : ''}
                onClick={() => setView('schematic')}
              >
                Esquema
              </button>
              <button
                className={view === 'perspective' ? 'selected' : ''}
                onClick={() => setView('perspective')}
              >
                <Box size={13} /> Perspectiva
              </button>
              <button className={view === 'top' ? 'selected' : ''} onClick={() => setView('top')}>
                <Grid2X2 size={13} /> Superior
              </button>
            </div>
            <button
              className="layout-control"
              aria-label="Alternar inspeção"
              aria-pressed={inspector}
              onClick={() => {
                setInspector((v) => !v);
                setFocusScene(false);
              }}
            >
              <Settings2 size={15} />
              <span>Inspeção</span>
            </button>
            <button
              className="layout-control"
              aria-label={focusScene ? 'Restaurar painéis' : 'Ampliar bancada'}
              aria-pressed={focusScene}
              onClick={() => setFocusScene((v) => !v)}
            >
              <Grid2X2 size={15} />
              <span>{focusScene ? 'Restaurar' : 'Ampliar'}</span>
            </button>
            <Tool
              label="Alternar qualidade gráfica"
              active={quality === 'low'}
              onClick={() => setQuality((q) => (q === 'high' ? 'low' : 'high'))}
            >
              <Settings2 size={16} />
            </Tool>
          </div>
          <div className="bench-scene" data-testid="bench">
            {view === 'schematic' ? (
              <Schematic
                project={project}
                reading={reading}
                selected={selected}
                onSelect={select}
                onTerminal={terminalClick}
              />
            ) : (
              <>
                <GraphicsBoundary onAlternate={() => setView('schematic')}>
                  <Suspense fallback={<div className="scene-loading">Preparando bancada 3D…</div>}>
                    <Bench
                      project={project}
                      instrument={{
                        meter,
                        mode: meterMode,
                        trace,
                        volts,
                        timebase,
                        onMode: setMeterMode,
                        onScale: () =>
                          setVolts((v) => (v === 0.5 ? 1 : v === 1 ? 2 : v === 2 ? 5 : 0.5)),
                        onTimebase: () =>
                          setTimebase((t) =>
                            t === 0.1 ? 0.5 : t === 0.5 ? 1 : t === 1 ? 2 : t === 2 ? 5 : 0.1,
                          ),
                        onProbe: (target) => {
                          setTool(`probe-${target}`);
                          message('Clique no terminal onde deseja conectar a ponta.');
                        },
                      }}
                      selected={selected}
                      pending={pending}
                      tool={tool}
                      view={view}
                      quality={quality}
                      wireColor={wireColor}
                      labels={labels}
                      nodes={nodes}
                      faults={diagnostics
                        .filter((d) => d.severity === 'error')
                        .flatMap((d) => d.parts)}
                      reading={reading}
                      onToggle={(id) => {
                        const p = project.parts.find((p) => p.id === id);
                        if (p) update(id, { bits: p.bits === 1 ? 0 : 1 });
                      }}
                      onSelect={select}
                      onTerminal={terminalClick}
                      onMove={(id: string, position: Vec) => update(id, { position })}
                    />
                  </Suspense>
                </GraphicsBoundary>
                <div className={`simulation-pill ${running ? 'running' : ''}`}>
                  <span className="tiny-dot" />
                  {running ? 'SIMULAÇÃO EM CURSO' : 'SIMULAÇÃO PAUSADA'}
                </div>
                <div className="scene-layers">
                  <button className={labels ? 'active' : ''} onClick={() => setLabels((v) => !v)}>
                    <Layers3 size={14} /> Referências
                  </button>
                  <button className={nodes ? 'active' : ''} onClick={() => setNodes((v) => !v)}>
                    <Zap size={13} /> Tensões / nós
                  </button>
                </div>
                {nodes && (
                  <div className="node-overlay">
                    <span>CAMADA DIDÁTICA · NÓ / POTENCIAL</span>
                    <b>{pending || 'Selecione um terminal'}</b>
                    <code>
                      {pending
                        ? `${format(reading.voltages[pending], 3)} V · ${reading.digital[pending] ?? 'X'}`
                        : 'Cores: alto / baixo / indefinido'}
                    </code>
                    {project.parts.some((c) => c.kind === 'capacitor') && (
                      <code>iC = {format(reading.current * 1000)} mA</code>
                    )}
                  </div>
                )}
                <div className="scene-scale">
                  <span /> 10 mm{' '}
                  <small>{quality === 'high' ? 'QUALIDADE ALTA' : 'MODO LEVE · DPR 1'}</small>
                </div>
                <div className="scene-help">
                  <MousePointer2 size={13} />
                  {tool.startsWith('probe-')
                    ? 'Clique em um terminal para conectar a ponta do instrumento'
                    : tool === 'connect'
                      ? pending
                        ? `Origem: ${pending} · escolha o destino`
                        : 'Clique em dois terminais para criar um fio'
                      : tool === 'move'
                        ? 'Arraste o componente · ajuste preciso no painel'
                        : tool === 'rotate'
                          ? 'Clique no componente para girar 90°'
                          : tool === 'delete'
                            ? 'Clique no componente ou fio para excluir'
                            : 'Arraste para orbitar · scroll para aproximar · clique para selecionar'}
                </div>
              </>
            )}
          </div>
          <section className="instruments">
            <div className="instrument-heading">
              <div className="instrument-tabs">
                <button
                  onClick={() => setTab('scope')}
                  className={tab === 'scope' ? 'selected' : ''}
                >
                  <Activity size={15} /> Osciloscópio <span className="channel-dot" />
                </button>
                <button
                  onClick={() => setTab('meter')}
                  className={tab === 'meter' ? 'selected' : ''}
                >
                  <Gauge size={15} /> Multímetro
                </button>
                <button
                  onClick={() => setTab('logic')}
                  className={tab === 'logic' ? 'selected' : ''}
                >
                  <Cpu size={15} /> Analisador lógico
                </button>
              </div>
              <span className="instrument-caption">INSTRUMENTOS IDEAIS</span>
            </div>
            <div className="instrument-body">
              {tab === 'scope' ? (
                <>
                  <div className="scope-controls">
                    <span className="channel-label">
                      CH 1 <span>DC</span>
                    </span>
                    <label>
                      Vertical
                      <select
                        aria-label="Escala vertical"
                        value={volts}
                        onChange={(e) => setVolts(+e.target.value)}
                      >
                        {[0.5, 1, 2, 5].map((v) => (
                          <option key={v} value={v}>
                            {v} V/div
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Base de tempo
                      <select
                        aria-label="Base de tempo"
                        value={timebase}
                        onChange={(e) => setTimebase(+e.target.value)}
                      >
                        {[0.1, 0.5, 1, 2, 5].map((v) => (
                          <option key={v} value={v}>
                            {v} s/div
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className="scope-measure">
                      V
                      <span>
                        {format(measured)} <small>V</small>
                      </span>
                    </span>
                  </div>
                  <Scope
                    samples={sim.current.samples}
                    time={sim.current.time}
                    volts={volts}
                    timebase={timebase}
                  />
                </>
              ) : tab === 'meter' ? (
                <div className="meter-display">
                  <label>
                    Modo{' '}
                    <select
                      aria-label="Modo do multímetro"
                      value={meterMode}
                      onChange={(e) => setMeterMode(e.target.value as MeterMode)}
                    >
                      <option value="voltage">V DC</option>
                      <option value="resistance">Resistência</option>
                      <option value="continuity">Continuidade</option>
                    </select>
                  </label>
                  <strong>
                    {meter.text} <small>{meter.unit}</small>
                  </strong>
                  <p>{meter.note}</p>
                  <div className="meter-probes">
                    {(['positive', 'negative'] as const).map((key) => (
                      <label key={key}>
                        {key === 'positive' ? 'VΩ +' : 'COM −'}
                        {terminalSelect(
                          (project.meterProbes ?? project.probes)[key],
                          (v) =>
                            edit({
                              ...project,
                              meterProbes: { ...(project.meterProbes ?? project.probes), [key]: v },
                            }),
                          `Multímetro ponta ${key === 'positive' ? 'positiva' : 'negativa'}`,
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="logic-analyzer">
                  {project.digitalProbes.length ? (
                    project.digitalProbes.map((id, i) => (
                      <div className="logic-row" key={`${i}-${id}`}>
                        <label>
                          D{i}{' '}
                          {terminalSelect(
                            id,
                            (v) =>
                              edit({
                                ...project,
                                digitalProbes: project.digitalProbes
                                  .map((p, j) => (i === j ? v : p))
                                  .filter(Boolean),
                              }),
                            `Canal digital ${i}`,
                          )}
                        </label>
                        <svg
                          viewBox="0 0 600 24"
                          preserveAspectRatio="none"
                          aria-label={`Sinal digital D${i}`}
                        >
                          <path
                            d={sim.current.samples
                              .filter((s) => s.t >= Math.max(0, sim.current.time - timebase * 10))
                              .map(
                                (s, j) =>
                                  `${j ? 'H' : 'M'}${((s.t - Math.max(0, sim.current.time - timebase * 10)) / (timebase * 10)) * 600}${j ? 'V' : ','}${s.logic[i] === 1 ? 4 : s.logic[i] === 0 ? 20 : 12}`,
                              )
                              .join(' ')}
                            fill="none"
                            stroke={i === 4 ? '#e7bd75' : '#80bca5'}
                            strokeWidth="1.5"
                          />
                        </svg>
                        <b>{reading.digital[id] ?? 'X'}</b>
                      </div>
                    ))
                  ) : (
                    <p>Adicione uma ponta digital para inspecionar os sinais.</p>
                  )}
                  <button
                    className="quiet-button"
                    disabled={project.digitalProbes.length >= 8 || !options.length}
                    onClick={() =>
                      edit({ ...project, digitalProbes: [...project.digitalProbes, options[0].id] })
                    }
                  >
                    <Plus size={13} /> Canal digital
                  </button>
                </div>
              )}
            </div>
            <div className="probe-bar">
              <span className="probe-indicator positive" />{' '}
              <label>
                CH1+{' '}
                {terminalSelect(
                  project.probes.positive,
                  (v) => probe('positive', v),
                  'Ponta positiva',
                )}
              </label>
              <span className="probe-indicator negative" />
              <label>
                CH1−{' '}
                {terminalSelect(
                  project.probes.negative,
                  (v) => probe('negative', v),
                  'Ponta negativa',
                )}
              </label>
              <span className="probe-note">Sondas tracejadas na bancada</span>
            </div>
          </section>
        </section>
        <aside className="properties">
          <div className="panel-heading">
            <span>
              <Settings2 size={15} /> INSPEÇÃO
            </span>
            <span className="small-label">
              {selectedPart?.ref ?? (selectedWire ? 'FIO' : 'BANCADA')}
            </span>
          </div>
          <div className="properties-scroll">
            {challenge && (
              <ChallengePanel
                storageScope={accountId}
                onComplete={onChallengeComplete}
                key={challenge}
                id={challenge}
                project={project}
                onReset={() => {
                  edit(challengeProject(challenge));
                  reset();
                }}
                onClose={() => setChallenge(null)}
              />
            )}
            <DiagnosticsPanel items={diagnostics} onSelect={setSelected} />
            {selectedPart ? (
              <>
                <div className="selected-component">
                  <div>
                    <PartIcon kind={selectedPart.kind} />
                  </div>
                  <span className="eyebrow">{selectedPart.ref} / SELECIONADO</span>
                  <h2>{definitions[selectedPart.kind].name.split(' · ')[0]}</h2>
                  <p>{definitions[selectedPart.kind].model}</p>
                </div>
                {selectedPart.kind === 'button' && (
                  <button
                    className="save-button"
                    aria-pressed={selectedPart.bits === 1}
                    onClick={() =>
                      update(selectedPart.id, { bits: selectedPart.bits === 1 ? 0 : 1 })
                    }
                  >
                    Botão {selectedPart.bits === 1 ? 'fechado' : 'aberto'}
                  </button>
                )}
                {selectedPart.kind === 'potentiometer' && (
                  <label className="field-label">
                    Cursor do potenciômetro{' '}
                    <input
                      aria-label="Cursor do potenciômetro"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedPart.ratio ?? 0.5}
                      onChange={(e) => update(selectedPart.id, { ratio: +e.target.value })}
                    />
                    <span>{Math.round((selectedPart.ratio ?? 0.5) * 100)}%</span>
                  </label>
                )}
                <div className="property-section">
                  <h3>
                    PROPRIEDADES <span>EDITÁVEL</span>
                  </h3>
                  {selectedPart.kind === 'resistor' ||
                  selectedPart.kind === 'capacitor' ||
                  selectedPart.kind === 'source' ? (
                    <label className="field-label">
                      {selectedPart.kind === 'resistor'
                        ? 'Resistência'
                        : selectedPart.kind === 'capacitor'
                          ? 'Capacitância'
                          : 'Tensão de saída'}
                      <div className="unit-field">
                        <input
                          aria-label="Valor do componente"
                          type="number"
                          min={
                            selectedPart.kind === 'resistor'
                              ? 0.1
                              : selectedPart.kind === 'capacitor'
                                ? 100
                                : 0
                          }
                          max={
                            selectedPart.kind === 'resistor'
                              ? 1000
                              : selectedPart.kind === 'capacitor'
                                ? 1000
                                : 5
                          }
                          step={
                            selectedPart.kind === 'source'
                              ? 0.1
                              : selectedPart.kind === 'capacitor'
                                ? 10
                                : 0.1
                          }
                          value={Number(
                            (
                              selectedPart.value *
                              (selectedPart.kind === 'resistor'
                                ? 0.001
                                : selectedPart.kind === 'capacitor'
                                  ? 1e6
                                  : 1)
                            ).toPrecision(8),
                          )}
                          onChange={(e) => {
                            if (!e.target.value || !e.target.validity.valid) return;
                            const v = +e.target.value;
                            update(selectedPart.id, {
                              value:
                                v *
                                (selectedPart.kind === 'resistor'
                                  ? 1000
                                  : selectedPart.kind === 'capacitor'
                                    ? 1e-6
                                    : 1),
                            });
                          }}
                        />
                        <span>
                          {selectedPart.kind === 'resistor'
                            ? 'kΩ'
                            : selectedPart.kind === 'capacitor'
                              ? 'µF'
                              : 'V'}
                        </span>
                      </div>
                    </label>
                  ) : (
                    <p className="muted">{definitions[selectedPart.kind].limit}</p>
                  )}
                  <div className="two-fields">
                    {(['x', 'z'] as const).map((axis, i) => (
                      <label key={axis} className="field-label">
                        Posição {axis.toUpperCase()}
                        <div className="unit-field">
                          <input
                            aria-label={`Posição ${axis.toUpperCase()}`}
                            type="number"
                            value={selectedPart.position[i === 0 ? 0 : 2]}
                            min={-200}
                            max={200}
                            step={2.54}
                            onChange={(e) => {
                              if (!e.target.value || !e.target.validity.valid) return;
                              const pos = [...selectedPart.position] as Vec;
                              pos[i === 0 ? 0 : 2] = +e.target.value;
                              update(selectedPart.id, { position: pos });
                            }}
                          />
                          <span>mm</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <label className="field-label">
                    Orientação
                    <select
                      value={selectedPart.rotation}
                      aria-label="Orientação"
                      onChange={(e) => update(selectedPart.id, { rotation: +e.target.value })}
                    >
                      {[0, 90, 180, 270].map((v) => (
                        <option key={v} value={v}>
                          {v}°
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="property-section">
                  <h3>
                    TERMINAIS <span>{terminals(selectedPart).length}</span>
                  </h3>
                  <div className="terminal-list">
                    {terminals(selectedPart).map((t) => (
                      <button
                        key={t.id}
                        className={pending === t.id ? 'selected' : ''}
                        onClick={() => terminalClick(t.id)}
                        title={t.id}
                      >
                        <span className="terminal-node" />
                        <span>{t.label}</span>
                        <code>
                          {reading.voltages[t.id] !== undefined
                            ? `${format(reading.voltages[t.id], 2)} V${rc ? '' : ` · ${reading.digital[t.id]}`}`
                            : 'flutuante / X'}
                        </code>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="model-note">
                  <BookOpen size={14} />
                  <p>{definitions[selectedPart.kind].limit}</p>
                </div>
                <button className="danger-button" onClick={() => remove()}>
                  <Trash2 size={13} /> Remover componente
                </button>
              </>
            ) : selectedWire ? (
              <>
                <div className="property-section">
                  <h2>Conexão selecionada</h2>
                  <p className="muted">
                    {selectedWire.from} ↔ {selectedWire.to}
                  </p>
                  <label className="field-label">
                    Cor do fio
                    <input
                      aria-label="Cor do fio selecionado"
                      type="color"
                      value={selectedWire.color}
                      onChange={(e) =>
                        edit({
                          ...project,
                          wires: project.wires.map((w) =>
                            w.id === selectedWire.id ? { ...w, color: e.target.value } : w,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="field-label">
                    Altura do jumper
                    <input
                      aria-label="Altura do jumper"
                      type="range"
                      min="2"
                      max="40"
                      step="1"
                      value={selectedWire.lift ?? 8}
                      onChange={(e) =>
                        edit({
                          ...project,
                          wires: project.wires.map((w) =>
                            w.id === selectedWire.id ? { ...w, lift: +e.target.value } : w,
                          ),
                        })
                      }
                    />
                    <span>{selectedWire.lift ?? 8} mm</span>
                  </label>
                  <p className="muted">Nó elétrico: {nets.node(selectedWire.from)}</p>
                  <button className="danger-button" onClick={() => remove()}>
                    <Trash2 size={14} /> Remover conexão
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-selection">
                <Crosshair size={24} />
                <h3>Inspecione a montagem</h3>
                <p>Selecione um componente ou fio na bancada.</p>
              </div>
            )}
            {source && (
              <div className="property-section source-controls">
                <h3>
                  FONTE DC <span>V1</span>
                </h3>
                <div className="source-reading">
                  {source.value.toFixed(2)}
                  <span> V</span>
                  <Zap size={16} />
                </div>
                <input
                  aria-label="Tensão da fonte"
                  type="range"
                  min="0"
                  max="5"
                  step=".1"
                  value={source.value}
                  onChange={(e) => update(source.id, { value: +e.target.value })}
                />
                <div className="range-labels">
                  <span>0 V</span>
                  <span>5 V</span>
                </div>
                <div className="source-buttons">
                  <button
                    className={source.value === 5 ? 'selected' : ''}
                    onClick={() => update(source.id, { value: 5 })}
                  >
                    Aplicar 5 V
                  </button>
                  <button
                    className={source.value === 0 ? 'selected' : ''}
                    onClick={() => update(source.id, { value: 0 })}
                  >
                    Aplicar 0 V
                  </button>
                </div>
              </div>
            )}
            {!rc && (
              <div className="property-section digital-controls">
                <h3>
                  ENTRADAS LÓGICAS <span>5 V CMOS</span>
                </h3>
                {input ? (
                  <>
                    {['A', 'B'].map((name, group) => (
                      <div className="bit-bank" key={name}>
                        <span>{name}</span>
                        {[3, 2, 1, 0].map((i) => (
                          <button
                            key={i}
                            aria-label={`${name}${i}`}
                            className={(bits >> (i + group * 4)) & 1 ? 'high' : ''}
                            onClick={() =>
                              update(input.id, { bits: bits ^ (1 << (i + group * 4)) })
                            }
                          >
                            {(bits >> (i + group * 4)) & 1}
                            <small>{i}</small>
                          </button>
                        ))}
                        <code>{(bits >> (group * 4)) & 15}</code>
                      </div>
                    ))}
                    <div className="carry-input">
                      <span>Carry in</span>
                      <button
                        aria-label="Carry in"
                        className={bits & 256 ? 'selected' : ''}
                        onClick={() => update(input.id, { bits: bits ^ 256 })}
                      >
                        {(bits >> 8) & 1}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="muted">Adicione um banco de entradas.</p>
                )}
                <div className="sum-result">
                  <span>RESULTADO / CARRY</span>
                  <strong data-testid="sum">
                    {reading.sum === null ? 'XXXX' : reading.sum.toString(2).padStart(4, '0')}{' '}
                    <i>{reading.carry ?? 'X'}</i>
                  </strong>
                  <small>
                    {reading.sum === null
                      ? 'Verifique alimentação e conexões.'
                      : `${bits & 15} + ${(bits >> 4) & 15} + ${(bits >> 8) & 1} = ${reading.sum + 16 * (reading.carry ?? 0)}`}
                  </small>
                </div>
              </div>
            )}
            <div className="property-section connection-editor">
              <h3>
                CONEXÕES <span>{project.wires.length}</span>
              </h3>
              <label className="field-label">
                Origem{terminalSelect(pending, setPending, 'Origem da conexão')}
              </label>
              <label className="field-label">
                Destino
                {terminalSelect(
                  '',
                  (v) => {
                    if (!pending) {
                      message('Selecione a origem primeiro.');
                      return;
                    }
                    if (v && v !== pending) {
                      edit({
                        ...project,
                        wires: [
                          ...project.wires,
                          { id: crypto.randomUUID(), from: pending, to: v, color: wireColor },
                        ],
                      });
                      setPending('');
                    }
                  },
                  'Destino da conexão',
                )}
              </label>
              <label className="wire-color">
                Cor do próximo fio{' '}
                <input
                  type="color"
                  aria-label="Cor do próximo fio"
                  value={wireColor}
                  onChange={(e) => setWireColor(e.target.value)}
                />
              </label>
              <div className="wire-list">
                {project.wires.map((w, i) => (
                  <button
                    key={w.id}
                    className={selected === w.id ? 'selected' : ''}
                    onClick={() => setSelected(w.id)}
                  >
                    <span style={{ background: w.color }} />
                    <code>
                      {i + 1}. {w.from.replace('bb:', '')} → {w.to.replace('bb:', '')}
                    </code>
                    <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>
      <footer className="simulation-bar">
        <div className="simulation-controls">
          <button
            className={`run-button ${running ? 'paused' : ''}`}
            onClick={() => setRunning((v) => !v)}
          >
            {running ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
            {running ? 'Pausar' : 'Executar'}
          </button>
          <Tool label="Avançar 50 ms" disabled={running} onClick={advance}>
            <SkipForward size={16} />
          </Tool>
          <Tool label="Reiniciar simulação" onClick={reset}>
            <RotateCcw size={15} />
          </Tool>
          <span className="sim-time">
            t <b>{sim.current.time.toFixed(2)}</b> s
          </span>
        </div>
        <div className="sim-status">
          {reading.issues.length ? (
            <>
              <span className="status-dot warning" />
              <span title={reading.issues.join('\n')}>{reading.issues[0]}</span>
            </>
          ) : (
            <>
              <span className="status-dot" /> Circuito conectado{' '}
              <span className="footer-divider">/</span>{' '}
              {rc
                ? reading.tau !== null
                  ? `τ = ${format(reading.tau, 2)} s`
                  : 'Rede analógica didática'
                : 'Lógica combinacional · 5 V'}
            </>
          )}
        </div>
        <div className="footer-meta">
          <span>{project.parts.length} componentes</span>
          <span>{project.wires.length} conexões</span>
          <span className="local-label">
            <span className="tiny-dot" /> 100% LOCAL
          </span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <span className="status-dot" />
          {toast}
          <button aria-label="Fechar aviso" onClick={() => setToast('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {guide && <Guide project={project} onClose={() => setGuide(false)} />}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <section
            className="modal project-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Abrir projeto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-heading">
              <span className="eyebrow">SEU LABORATÓRIO</span>
              <Tool label="Fechar projetos" onClick={() => setOpen(false)}>
                <X size={18} />
              </Tool>
            </div>
            <h2>Comece uma experiência.</h2>
            <p>Exemplos completos. Cada componente e fio pode ser modificado.</p>
            <button className="example-card" onClick={() => loadExample('rc')}>
              <Activity size={26} />
              <span>
                <strong>Carga e descarga RC</strong>
                <small>Eletrônica · 10 kΩ · 100 µF · 5 V</small>
              </span>
              <ChevronRight size={18} />
            </button>
            <button className="example-card" onClick={() => loadExample('adder')}>
              <Cpu size={26} />
              <span>
                <strong>Somador de 4 bits</strong>
                <small>Arquitetura · CD74HC283 · 9 entradas</small>
              </span>
              <ChevronRight size={18} />
            </button>
            <div className="experiment-presets">
              {(
                [
                  ['led', 'LED, resistor e botão'],
                  ['transistor', 'Chave NPN com LED'],
                  ['divider', 'Potenciômetro'],
                  ['double-rc', 'Dois capacitores'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  className="quiet-button"
                  onClick={() => {
                    edit(electronicsExample(id));
                    setSavedId(undefined);
                    setCloudId(undefined);
                    cloudGeneration.current++;
                    setChallenge(null);
                    reset();
                    setRunning(false);
                    setSelected('');
                    setOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <section className="saved-projects">
              <h3>Suas montagens</h3>
              <button className="quiet-button" onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? 'Ocultar arquivados' : 'Mostrar arquivados'}
              </button>
              {entries
                .filter((e) => showArchived || !e.archived)
                .map((entry) => (
                  <div key={entry.id}>
                    <button
                      className="quiet-button"
                      onClick={() => {
                        edit(structuredClone(entry.project));
                        setSavedId(entry.id);
                        setChallenge(null);
                        reset();
                        setRunning(false);
                        setSelected('');
                        setPending('');
                        setOpen(false);
                      }}
                    >
                      {entry.name}
                      {entry.archived ? ' (arquivado)' : ''}
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const shelf = readShelf(
                            localStorage.getItem(SHELF),
                            localStorage.getItem(STORAGE),
                          );
                          shelf.entries = shelf.entries.map((e) =>
                            e.id === entry.id ? { ...e, archived: !e.archived } : e,
                          );
                          localStorage.setItem(SHELF, JSON.stringify(shelf));
                          setEntries(shelf.entries);
                        } catch {
                          message('Não foi possível atualizar o acervo.');
                        }
                      }}
                    >
                      {entry.archived ? 'Restaurar' : 'Arquivar'}
                    </button>
                  </div>
                ))}
            </section>
            <div className="project-modal-actions">
              <button onClick={restore}>
                <FolderOpen size={16} /> Reabrir salvo local
              </button>
              <button onClick={() => loadExample(project.experiment, true)}>
                <FilePlus2 size={16} /> Bancada vazia
              </button>
              <button onClick={exportFile}>
                <ArrowDownToLine size={16} /> Exportar JSON v1
              </button>
              <button onClick={() => file.current?.click()}>
                <ArrowUpFromLine size={16} /> Importar projeto
              </button>
            </div>
          </section>
        </div>
      )}
      {chooseChallenge && (
        <div className="modal-backdrop" onClick={() => setChooseChallenge(false)}>
          <section
            className="modal project-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Escolher desafio"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="quiet-button" onClick={() => setChooseChallenge(false)}>
              Fechar desafios
            </button>
            <h2>Investigue e corrija.</h2>
            <p>
              Antes de iniciar, salve sua montagem. Cada desafio abre uma experiência com uma falha.
            </p>
            {challenges.map((c) => (
              <button
                className="example-card"
                key={c.id}
                onClick={() => {
                  edit(challengeProject(c.id));
                  setChallenge(c.id);
                  setSavedId(undefined);
                  setCloudId(undefined);
                  cloudGeneration.current++;
                  reset();
                  setRunning(false);
                  setSelected('');
                  setPending('');
                  setChooseChallenge(false);
                }}
              >
                <span>
                  <strong>{c.title}</strong>
                  <small>{c.goal}</small>
                </span>
              </button>
            ))}
          </section>
        </div>
      )}
      <input
        ref={file}
        hidden
        type="file"
        accept=".json,application/json"
        aria-label="Arquivo do projeto"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            if (f.size > 2e6) throw new Error('Arquivo excede 2 MB.');
            edit(parseProject(await f.text()));
            setSavedId(undefined);
            setCloudId(undefined);
            cloudGeneration.current++;
            setChallenge(null);
            reset();
            setRunning(false);
            setOpen(false);
            setSelected('');
            setPending('');
            message('Projeto importado.');
          } catch (error) {
            message((error as Error).message);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}
