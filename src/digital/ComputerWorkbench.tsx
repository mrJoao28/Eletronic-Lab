import { GraphicsBoundary } from '../GraphicsBoundary';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  assemble,
  clockCPU,
  createCPU,
  demoPrograms,
  instructionSet,
  stepInstruction,
  type CPU,
} from './cpu';
import { alu, DigitalCircuit, gate, registerStep, type Gate, type AluOperation } from './logic';
const ComputerScene = lazy(() => import('./ComputerScene'));
const hex = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');
const blockNotes: Record<string, string> = {
  'PC / CONTROLE':
    'O contador de programa aponta a próxima posição. A unidade de controle alterna busca, decodificação, operando e execução.',
  'IR / DECODER':
    'IR guarda o opcode. A decodificação escolhe a operação; não executa JavaScript vindo do programa.',
  'RAM 256 × 8':
    '256 posições de um byte. Código e dados compartilham a memória; STA pode alterar ambos.',
  'REGISTRADOR A': 'Acumulador de 8 bits: recebe cargas e o resultado da ALU.',
  'ALU / FLAGS': 'ADD, SUB, AND, OR e XOR. Z indica zero; em SUB, C indica ausência de empréstimo.',
  SAÍDA: 'OUT copia o acumulador para o registrador de saída.',
};
export default function ComputerWorkbench({ onClose }: { onClose: () => void }) {
  const [lesson, setLesson] = useState('CPU'),
    [source, setSource] = useState<string>(demoPrograms.sum),
    [cpu, setCPU] = useState(() => createCPU(assemble(demoPrograms.sum))),
    [running, setRunning] = useState(false),
    [hz, setHz] = useState(4),
    [error, setError] = useState(''),
    [history, setHistory] = useState<string[]>([]),
    [selected, setSelected] = useState('PC / CONTROLE'),
    [scene, setScene] = useState(false),
    [breakpoint, setBreakpoint] = useState(''),
    [address, setAddress] = useState(240),
    [byte, setByte] = useState(0);
  const ref = useRef(cpu);
  ref.current = cpu;
  const publish = (next: CPU) => {
    ref.current = next;
    setCPU(next);
    setHistory((h) => [...h.slice(-31), `${next.cycles}: ${next.bus}`]);
    if (next.halted) setRunning(false);
  };
  const advance = useCallback(() => {
    const next = clockCPU(ref.current);
    ref.current = next;
    setCPU(next);
    setHistory((h) => [...h.slice(-31), `${next.cycles}: ${next.bus}`]);
    if (next.halted) setRunning(false);
  }, []);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (
        ref.current.phase === 'fetch' &&
        breakpoint !== '' &&
        ref.current.pc === Number(breakpoint)
      ) {
        setRunning(false);
        return;
      }
      advance();
    }, 1000 / hz);
    return () => clearInterval(id);
  }, [running, hz, breakpoint, advance]);
  const load = () => {
    try {
      const c = createCPU(assemble(source));
      setRunning(false);
      ref.current = c;
      setCPU(c);
      setHistory([]);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const [a, setA] = useState(1),
    [b, setB] = useState(0),
    [gateKind, setGateKind] = useState<Gate>('AND'),
    [d, setD] = useState(1),
    [clk, setClk] = useState(0),
    [q, setQ] = useState<0 | 1 | 'X'>('X'),
    [reg, setReg] = useState(0),
    [loadReg, setLoadReg] = useState(true),
    [operation, setOperation] = useState<AluOperation>('ADD');
  const ff = useRef(
    new DigitalCircuit([{ id: 'ff', kind: 'DFF', inputs: ['d', 'clock'], output: 'q', delay: 1 }]),
  );
  const pulse = () => {
    const c = ff.current;
    c.input('d', d as 0 | 1);
    c.input('clock', clk as 0 | 1);
    c.runUntil(c.time + 1);
    const next = clk ? 0 : 1;
    c.input('clock', next);
    c.runUntil(c.time + 1);
    setClk(next);
    setQ(c.read('q'));
    setReg((r) => registerStep(r, a, clk as 0 | 1, next as 0 | 1, loadReg));
  };
  const result = alu(a, b, operation);
  return (
    <main className="computer-workbench">
      <header>
        <button onClick={onClose}>← Voltar à bancada</button>
        <div>
          <span className="eyebrow">DO BIT AO COMPUTADOR</span>
          <h1>Arquitetura de 8 bits</h1>
        </div>
        <span className="small-label">ISA PRÓPRIA · MODELO LÓGICO</span>
      </header>
      <nav aria-label="Etapas de arquitetura">
        {['Portas', 'Flip-flop', 'Registrador', 'ALU', 'Memória', 'CPU'].map((name) => (
          <button
            key={name}
            aria-pressed={lesson === name}
            onClick={() => {
              setLesson(name);
              setRunning(false);
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      {lesson !== 'CPU' && lesson !== 'Memória' ? (
        <section className="digital-lesson">
          <h2>{lesson}</h2>
          <p>
            Blocos lógicos ideais. O motor de eventos representa atraso de propagação e estado X;
            não modela ruído, setup/hold ou níveis elétricos de uma família de CIs.
          </p>
          <div className="digital-controls">
            <label>
              Entrada A / dado{' '}
              <input
                aria-label="Entrada A digital"
                type="number"
                min="0"
                max="255"
                value={a}
                onChange={(e) => {
                  if (e.target.validity.valid) setA(+e.target.value);
                }}
              />
            </label>
            <label>
              Entrada B{' '}
              <input
                aria-label="Entrada B digital"
                type="number"
                min="0"
                max="255"
                value={b}
                onChange={(e) => {
                  if (e.target.validity.valid) setB(+e.target.value);
                }}
              />
            </label>
          </div>
          {lesson === 'Portas' ? (
            <>
              <select
                aria-label="Porta lógica"
                value={gateKind}
                onChange={(e) => setGateKind(e.target.value as Gate)}
              >
                {['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR'].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <output className="digital-output">
                {a & 1} {gateKind} {gateKind === 'NOT' ? '' : b & 1} →{' '}
                {gate(
                  gateKind,
                  gateKind === 'NOT' ? [(a & 1) as 0 | 1] : [(a & 1) as 0 | 1, (b & 1) as 0 | 1],
                )}
              </output>
              <table>
                <thead>
                  <tr>
                    <th>A</th>
                    <th>B</th>
                    <th>Q</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1].flatMap((x) =>
                    [0, 1].map((y) => (
                      <tr key={`${x}${y}`}>
                        <td>{x}</td>
                        <td>{y}</td>
                        <td>
                          {gate(
                            gateKind,
                            gateKind === 'NOT' ? [x as 0 | 1] : [x as 0 | 1, y as 0 | 1],
                          )}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </>
          ) : lesson === 'ALU' ? (
            <>
              <select
                aria-label="Operação da ALU"
                value={operation}
                onChange={(e) => setOperation(e.target.value as AluOperation)}
              >
                {['ADD', 'SUB', 'AND', 'OR', 'XOR'].map((op) => (
                  <option key={op}>{op}</option>
                ))}
              </select>
              <output className="digital-output">
                {a} {operation} {b} = {result.value} · Z={+result.zero} C={+result.carry}
              </output>
            </>
          ) : (
            <>
              <label>
                D{' '}
                <select aria-label="Entrada D" value={d} onChange={(e) => setD(+e.target.value)}>
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={loadReg}
                  onChange={(e) => setLoadReg(e.target.checked)}
                />{' '}
                Habilitar carga do registrador
              </label>
              <button onClick={pulse}>Alternar clock · CLK={clk}</button>
              <output className="digital-output">
                {lesson === 'Flip-flop'
                  ? `Q = ${q}`
                  : `Registrador = ${reg} / ${reg.toString(2).padStart(8, '0')}`}
              </output>
              <p>
                Captura apenas na borda 0 → 1. Alterar D sem clock não altera Q. O registrador
                captura A quando a carga está habilitada.
              </p>
            </>
          )}
        </section>
      ) : (
        <>
          <div className="cpu-controls">
            <button onClick={load}>Montar e reiniciar</button>
            <button onClick={() => setRunning((v) => !v)} disabled={cpu.halted}>
              {running ? 'Pausar CPU' : 'Executar CPU'}
            </button>
            <button onClick={advance} disabled={running || cpu.halted}>
              Passo de clock
            </button>
            <button
              onClick={() => publish(stepInstruction(ref.current))}
              disabled={running || cpu.halted}
            >
              Passo de instrução
            </button>
            <label>
              Clock{' '}
              <select
                aria-label="Frequência da CPU"
                value={hz}
                onChange={(e) => setHz(+e.target.value)}
              >
                {[1, 2, 4, 8, 16].map((h) => (
                  <option key={h} value={h}>
                    {h} Hz
                  </option>
                ))}
              </select>
            </label>
            <label>
              Breakpoint PC{' '}
              <input
                aria-label="Breakpoint da CPU"
                type="number"
                min="0"
                max="255"
                value={breakpoint}
                onChange={(e) => {
                  if (e.target.value === '' || e.target.validity.valid)
                    setBreakpoint(e.target.value);
                }}
              />
            </label>
            <button onClick={() => setScene((v) => !v)}>{scene ? 'Diagrama' : 'Placa 3D'}</button>
          </div>
          {error && (
            <p role="alert" className="cpu-error">
              {error}
            </p>
          )}
          <div className="cpu-layout">
            <section className="cpu-editor">
              <h2>Programa</h2>
              <div className="cpu-program-files">
                <button
                  onClick={() => {
                    try {
                      assemble(source);
                      localStorage.setItem(
                        'eletronic-lab.cpu.v1',
                        JSON.stringify({ version: 1, source }),
                      );
                      setError('Programa salvo neste navegador.');
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Salvar programa
                </button>
                <button
                  onClick={() => {
                    try {
                      const saved = JSON.parse(
                        localStorage.getItem('eletronic-lab.cpu.v1') ?? 'null',
                      );
                      if (!saved || saved.version !== 1 || typeof saved.source !== 'string')
                        throw Error('Nenhum programa salvo válido.');
                      assemble(saved.source);
                      setSource(saved.source);
                      setError('Programa recuperado. Use Montar e reiniciar para carregar a RAM.');
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Reabrir programa
                </button>
              </div>
              <label>
                Exemplo{' '}
                <select
                  aria-label="Programa de exemplo"
                  onChange={(e) =>
                    setSource(demoPrograms[e.target.value as keyof typeof demoPrograms])
                  }
                  defaultValue="sum"
                >
                  <option value="sum">Soma e RAM</option>
                  <option value="count">Contagem regressiva</option>
                  <option value="bitwise">Operações de bits</option>
                </select>
              </label>
              <textarea
                aria-label="Código assembly"
                value={source}
                maxLength={16000}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
              />
              <small>
                ADD/SUB/AND/OR/XOR usam imediato. LDA/STA usam endereço. JMP/JZ aceitam rótulos.
                .BYTE inclui um byte de dados.
              </small>
              <details>
                <summary>Conjunto de instruções</summary>
                <code>
                  {Object.entries(instructionSet)
                    .map(([name, value]) => `${hex(value)} ${name}`)
                    .join(' · ')}
                </code>
              </details>
            </section>
            <section className="cpu-main">
              <div className="cpu-status" role="status">
                {cpu.fault ?? (cpu.halted ? 'CPU parada em HLT' : `Fase: ${cpu.phase}`)} ·{' '}
                {cpu.cycles} clocks
              </div>
              {scene ? (
                <div className="cpu-scene">
                  <GraphicsBoundary
                    onAlternate={() => setScene(false)}
                    alternateLabel="Continuar pelos blocos da CPU"
                  >
                    <Suspense fallback={<p>Carregando placa…</p>}>
                      <ComputerScene cpu={cpu} onSelect={setSelected} />
                    </Suspense>
                  </GraphicsBoundary>
                </div>
              ) : (
                <div className="cpu-blocks">
                  {[
                    ['PC / CONTROLE', cpu.pc],
                    ['IR / DECODER', cpu.ir],
                    ['RAM 256 × 8', cpu.memory[cpu.mar]],
                    ['REGISTRADOR A', cpu.a],
                    ['ALU / FLAGS', +cpu.zero | (+cpu.carry << 1)],
                    ['SAÍDA', cpu.out],
                  ].map(([name, value]) => (
                    <button
                      key={name}
                      className={selected === name ? 'active' : ''}
                      onClick={() => setSelected(name as string)}
                    >
                      <span>{name}</span>
                      <strong>{value}</strong>
                      <code>{Number(value).toString(2).padStart(8, '0')}</code>
                    </button>
                  ))}
                </div>
              )}
              <p className="cpu-bus">{cpu.bus}</p>
              <p>{blockNotes[selected]}</p>
              <div className="cpu-flags">
                A={cpu.a} · PC={cpu.pc} · MAR={cpu.mar} · MDR={cpu.mdr} · Z={+cpu.zero} · C=
                {+cpu.carry} · OUT=<strong data-testid="cpu-output">{cpu.out}</strong>
              </div>
              <ol className="cpu-history">
                {history.map((entry, i) => (
                  <li key={`${i}-${entry}`}>{entry}</li>
                ))}
              </ol>
            </section>
            <section className="cpu-memory">
              <h2>RAM · 256 bytes</h2>
              <div className="memory-editor">
                <label>
                  Endereço
                  <input
                    aria-label="Endereço de memória"
                    type="number"
                    min="0"
                    max="255"
                    value={address}
                    onChange={(e) => {
                      if (e.target.validity.valid) setAddress(+e.target.value);
                    }}
                  />
                </label>
                <label>
                  Byte
                  <input
                    aria-label="Byte de memória"
                    type="number"
                    min="0"
                    max="255"
                    value={byte}
                    onChange={(e) => {
                      if (e.target.validity.valid) setByte(+e.target.value);
                    }}
                  />
                </label>
                <button
                  disabled={running}
                  onClick={() => {
                    const c = { ...ref.current, memory: [...ref.current.memory] };
                    c.memory[address] = byte;
                    publish(c);
                  }}
                >
                  Gravar byte
                </button>
              </div>
              <div className="memory-grid">
                {cpu.memory.map((value, i) => (
                  <button
                    key={i}
                    title={`${i}: ${value}`}
                    className={i === cpu.mar ? 'active' : ''}
                    onClick={() => {
                      setAddress(i);
                      setByte(value);
                    }}
                  >
                    <small>{hex(i)}</small>
                    {hex(value)}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
      <footer>
        CPU de ensino com ISA própria, memória de 256 bytes e clock discreto. A placa 3D é um
        diagrama conceitual; não é uma implementação elétrica ou uma emulação de processador
        comercial.
      </footer>
    </main>
  );
}
