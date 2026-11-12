import { Html, Line } from '@react-three/drei';
import type { MeterMode, MeterReading } from './metering';
import { terminals, world, type Project, type Vec } from './engine';
export interface InstrumentState {
  meter: MeterReading;
  mode: MeterMode;
  trace: string;
  volts: number;
  timebase: number;
  onMode: (mode: MeterMode) => void;
  onScale: () => void;
  onTimebase: () => void;
  onProbe: (target: string) => void;
}
export default function Instruments3D({
  project,
  state,
}: {
  project: Project;
  state: InstrumentState;
}) {
  const endpoints = new Map<string, Vec>();
  project.parts.forEach((p) => terminals(p).forEach((t) => endpoints.set(t.id, world(p, t))));
  return (
    <group>
      <group position={[4, 0, -60]}>
        <mesh position={[0, 10, 0]} castShadow>
          <boxGeometry args={[55, 20, 27]} />
          <meshStandardMaterial color="#a3afa6" metalness={0.2} roughness={0.5} />
        </mesh>
        <mesh position={[-7, 20.1, 0]}>
          <boxGeometry args={[35, 0.3, 21]} />
          <meshStandardMaterial color="#182e2e" />
        </mesh>
        <Html
          position={[-7, 20.5, 0]}
          transform
          rotation={[-Math.PI / 2, 0, 0]}
          distanceFactor={35}
        >
          <div className="physical-scope">
            <strong>OSCILOSCÓPIO / CH1</strong>
            <svg viewBox="0 0 240 90">
              <path d="M0 30H240M0 60H240M60 0V90M120 0V90M180 0V90" stroke="#365853" fill="none" />
              <path d={state.trace} stroke="#f0c578" strokeWidth="2" fill="none" />
            </svg>
            <div>
              <button onClick={state.onScale}>{state.volts} V/div</button>
              <button onClick={state.onTimebase}>{state.timebase} s/div</button>
            </div>
            <div>
              <button onClick={() => state.onProbe('scope-positive')}>CH1 +</button>
              <button onClick={() => state.onProbe('scope-negative')}>CH1 −</button>
            </div>
          </div>
        </Html>
        {[3, -5].map((z) => (
          <mesh key={z} position={[20, 21, z]}>
            <cylinderGeometry args={[2.8, 2.8, 2, 20]} />
            <meshStandardMaterial color="#c9c8b7" />
          </mesh>
        ))}
      </group>
      <group position={[-57, 0, 42]}>
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[28, 10, 41]} />
          <meshStandardMaterial color="#d5ae58" roughness={0.6} />
        </mesh>
        <mesh position={[0, 10.1, 0]}>
          <boxGeometry args={[24, 0.2, 36]} />
          <meshStandardMaterial color="#253c37" />
        </mesh>
        <Html position={[0, 10.5, 0]} transform rotation={[-Math.PI / 2, 0, 0]} distanceFactor={32}>
          <div className="physical-meter">
            <strong>MULTÍMETRO</strong>
            <div className="physical-meter-reading" aria-label="Leitura do multímetro 3D">
              {state.meter.text} <small>{state.meter.unit}</small>
            </div>
            <select
              aria-label="Modo do multímetro 3D"
              value={state.mode}
              onChange={(e) => state.onMode(e.target.value as MeterMode)}
            >
              <option value="voltage">V DC</option>
              <option value="resistance">Ω</option>
              <option value="continuity">Continuidade</option>
            </select>
            <div>
              <button onClick={() => state.onProbe('meter-positive')}>VΩ +</button>
              <button onClick={() => state.onProbe('meter-negative')}>COM −</button>
            </div>
          </div>
        </Html>
      </group>
      {(['positive', 'negative'] as const).map((key, i) => {
        const end = endpoints.get((project.meterProbes ?? project.probes)[key]);
        return end ? (
          <Line
            key={key}
            points={[[-57 + (i ? 5 : -5), 5, 62], [-45, 15, 50], end]}
            color={i ? '#5e758b' : '#d26449'}
            lineWidth={2}
          />
        ) : null;
      })}
    </group>
  );
}
