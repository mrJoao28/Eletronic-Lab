import ExtendedModel from './ExtendedModels';
import { BenchModel, JumperModel } from './models/BenchModels';
import { snapPlacement } from './placement';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { Color, InstancedMesh, Object3D, Plane, Vector3, type Group } from 'three';
import {
  definitions,
  terminals,
  world,
  type Part,
  type Project,
  type Reading,
  type Terminal,
  type Vec,
} from './engine';

type Props = {
  project: Project;
  selected: string;
  pending: string;
  tool: string;
  view: string;
  quality: string;
  wireColor: string;
  labels: boolean;
  nodes: boolean;
  reading: Reading;
  faults: string[];
  onSelect: (id: string) => void;
  onTerminal: (id: string) => void;
  onMove: (id: string, pos: Vec) => void;
  onToggle: (id: string) => void;
};
function resistorBands(value: number) {
  const colors = [
    '#20221f',
    '#6b4432',
    '#a34938',
    '#c38043',
    '#d6bd69',
    '#679069',
    '#4a6fa0',
    '#89629d',
    '#90958b',
    '#d8dcd0',
  ];
  let exp = Math.floor(Math.log10(value)) - 2;
  let digits = Math.round(value / 10 ** exp);
  if (digits >= 1000) {
    digits = 100;
    exp++;
  }
  return [...String(digits).padStart(3, '0')]
    .map((d) => colors[+d])
    .concat(exp === -1 ? '#c8b278' : exp === -2 ? '#a5aaa5' : colors[exp], colors[1]);
}
function Camera({ view }: { view: string }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.up.set(0, view === 'top' ? 0 : 1, view === 'top' ? -1 : 0);
    camera.position.set(
      view === 'top' ? -12 : 95,
      view === 'top' ? 170 : 105,
      view === 'top' ? 5 : 120,
    );
    camera.lookAt(-12, 0, 5);
    camera.updateProjectionMatrix();
    invalidate();
  }, [view, camera, invalidate]);
  return null;
}
const Plate = ({
  position = [0, 0, 0],
  size,
  color = '#e9e6df',
}: {
  position?: Vec;
  size: Vec;
  color?: string;
}) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.6} metalness={0.12} />
  </mesh>
);
const Board = memo(function Board({
  part,
  onTerminal,
  onSelect,
  pending,
  selected,
  nodes,
  reading,
}: {
  part: Part;
  onTerminal: Props['onTerminal'];
  onSelect: Props['onSelect'];
  pending: string;
  selected: string;
  nodes: boolean;
  reading?: Reading;
}) {
  const list = useMemo(() => terminals(part), [part]);
  const mesh = useRef<InstancedMesh>(null);
  const [hover, setHover] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const obj = new Object3D();
    list.forEach((t, i) => {
      obj.position.set(...t.local);
      obj.updateMatrix();
      mesh.current!.setMatrixAt(i, obj.matrix);
      const v = reading?.voltages[t.id];
      mesh.current!.setColorAt(
        i,
        new Color(
          pending === t.id
            ? '#f2bc6d'
            : hover === i
              ? '#b9fff0'
              : nodes && v !== undefined
                ? v > 2.5
                  ? '#86d5b2'
                  : '#739db9'
                : '#3b4240',
        ),
      );
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [list, pending, hover, nodes, reading]);
  return (
    <group>
      <Plate
        position={[0, 0, 0]}
        size={[85, 8, 55]}
        color={selected === part.id ? '#eeeadd' : '#d8d9cf'}
      />
      <Plate position={[0, 4.02, -1.27]} size={[78, 0.15, 3]} color="#8d938b" />
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, list.length]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) onTerminal(list[e.instanceId].id);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          setHover(e.instanceId ?? null);
        }}
        onPointerOut={() => setHover(null)}
      >
        <cylinderGeometry args={[0.68, 0.55, 0.18, 8]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      {[-24.7, -18.2, 18.2, 24.7].map((z, i) => (
        <Line
          key={z}
          points={[
            [-33, 4.15, z],
            [33, 4.15, z],
          ]}
          color={i % 2 === 0 ? '#bc654d' : '#557e9d'}
          lineWidth={1}
        />
      ))}
      <Html position={[-43, 5, 0]} center>
        <button className="scene-tag board-tag" onClick={() => onSelect(part.id)}>
          {part.ref} <span>2.54 mm</span>
        </button>
      </Html>
      {hover !== null && (
        <Html
          position={[list[hover].local[0], 9, list[hover].local[2]]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className="terminal-tip">
            {part.ref} · {list[hover].label}
          </span>
        </Html>
      )}
      {[1, 5, 10, 15, 20, 25, 30].map((c) => (
        <Html
          key={c}
          position={[(c - 1) * 2.54 - 36.83, 4.5, -17.5]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span className="board-number">{c}</span>
        </Html>
      ))}
    </group>
  );
});
function Component({ part, props }: { part: Part; props: Props }) {
  const { invalidate } = useThree();
  const group = useRef<Group>(null);
  const [hover, setHover] = useState('');
  const [snapped, setSnapped] = useState(false);
  const dragging = useRef<{ x: number; y: number; z: number } | null>(null);
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (props.tool === 'delete') {
      props.onSelect(part.id);
      return;
    }
    props.onSelect(part.id);
  };
  const down = (e: ThreeEvent<PointerEvent>) => {
    if (props.tool !== 'move') return;
    e.stopPropagation();
    dragging.current = { x: e.point.x, y: e.point.y, z: e.point.z };
    (e.target as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture(
      e.pointerId,
    );
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    e.stopPropagation();
    (e.target as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture(
      e.pointerId,
    );
    const pos = group.current?.position;
    if (pos) props.onMove(part.id, [Number(pos.x.toFixed(6)), 0, Number(pos.z.toFixed(6))]);
    dragging.current = null;
    setSnapped(false);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !group.current) return;
    e.stopPropagation();
    const d = dragging.current;
    const point = e.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -d.y), new Vector3());
    if (!point) return;
    const proposed: Vec = [part.position[0] + point.x - d.x, 0, part.position[2] + point.z - d.z];
    const fit = snapPlacement(props.project, part, proposed);
    setSnapped(Boolean(fit));
    group.current.position.set(...(fit?.position ?? proposed));
    invalidate();
  };
  return (
    <group
      ref={group}
      position={part.position}
      rotation={[0, (-part.rotation * Math.PI) / 180, 0]}
      onClick={click}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerMove={move}
    >
      {props.faults.includes(part.id) && (
        <mesh position={[0, 5, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
          <ringGeometry args={[7, 7.5, 32]} />
          <meshBasicMaterial color="#f66f55" depthTest={false} />
        </mesh>
      )}
      {snapped && (
        <>
          {terminals(part).map((t) => (
            <mesh
              key={`snap-${t.id}`}
              position={[t.local[0], t.local[1] + 0.2, t.local[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
              raycast={() => {}}
            >
              <ringGeometry args={[0.8, 1.2, 20]} />
              <meshBasicMaterial color="#7dffc0" depthTest={false} />
            </mesh>
          ))}
          <Html position={[0, 28, 0]} center style={{ pointerEvents: 'none' }}>
            <span className="terminal-tip">Encaixe válido · solte para inserir</span>
          </Html>
        </>
      )}
      {part.kind === 'board' ? (
        <Board
          part={part}
          onTerminal={props.onTerminal}
          onSelect={props.onSelect}
          pending={props.pending}
          selected={props.selected}
          nodes={props.nodes}
          reading={props.nodes ? props.reading : undefined}
        />
      ) : (
        <>
          <ExtendedModel
            part={part}
            reading={props.reading}
            onToggle={() => props.onToggle(part.id)}
          />
          {part.kind === 'resistor' && (
            <>
              <Line
                points={[
                  [-5.08, 4.15, 0],
                  [-4, 6, 0],
                  [4, 6, 0],
                  [5.08, 4.15, 0],
                ]}
                color="#aaa99e"
                lineWidth={2}
              />
              <mesh position={[0, 6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[1.25, 1.25, 6.5, 12]} />
                <meshStandardMaterial color="#adbc9d" roughness={0.5} />
              </mesh>
              {[-2.1, -1.1, -0.1, 1.2, 2.3].map((x, i) => (
                <mesh key={x} position={[x, 6, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[1.27, 1.27, 0.5, 12]} />
                  <meshStandardMaterial color={resistorBands(part.value)[i]} />
                </mesh>
              ))}
            </>
          )}
          {part.kind === 'capacitor' && <BenchModel id="capacitor" />}
          {part.kind === 'source' && (
            <>
              <Plate position={[0, 10, 0]} size={[33, 20, 27]} color="#a6b2ad" />
              <Plate position={[0, 11, 13.6]} size={[29, 15, 1]} color="#263537" />
              <Html
                position={[0, 17, 14.3]}
                center
                transform
                rotation={[-0.18, 0, 0]}
                distanceFactor={90}
              >
                <div className="ps-screen">
                  DC {part.value.toFixed(2)}
                  <small>V · OUTPUT</small>
                </div>
              </Html>
              <mesh position={[10, 9, 14]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2.7, 2.7, 2, 16]} />
                <meshStandardMaterial color="#cbd0c8" />
              </mesh>
            </>
          )}
          {part.kind === 'ground' && (
            <>
              <Line
                points={[
                  [0, 4.2, 0],
                  [0, 4.2, 3],
                  [-3, 4.2, 3],
                  [3, 4.2, 3],
                ]}
                color="#90a49b"
                lineWidth={2}
              />
              <Line
                points={[
                  [-2, 4.2, 4.5],
                  [2, 4.2, 4.5],
                ]}
                color="#90a49b"
                lineWidth={2}
              />
            </>
          )}
          {part.kind === 'adder' && <BenchModel id="hc283" />}
          {part.kind === 'inputs' && (
            <>
              <Plate position={[0, 4, 0]} size={[32, 6, 13]} color="#3b5850" />
              {Array.from({ length: 9 }, (_, i) => (
                <Plate
                  key={i}
                  position={[(i - 4) * 3.2, 8, ((part.bits ?? 0) >> i) & 1 ? -1.7 : 1.7]}
                  size={[2, 2.5, 3]}
                  color={((part.bits ?? 0) >> i) & 1 ? '#e5bd7c' : '#818c86'}
                />
              ))}
            </>
          )}
          {terminals(part).map((t) => (
            <mesh
              key={t.id}
              position={t.local}
              onClick={(e) => {
                e.stopPropagation();
                props.onTerminal(t.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(t.id);
              }}
              onPointerOut={() => setHover('')}
            >
              <sphereGeometry args={[props.pending === t.id ? 1 : 0.65, 10, 8]} />
              <meshStandardMaterial
                color={props.pending === t.id ? '#ffeeae' : t.label === '-' ? '#7b98bd' : '#dfb875'}
                emissive={props.pending === t.id ? '#b78b3e' : '#000000'}
              />
            </mesh>
          ))}
          {(props.labels || props.selected === part.id) && (
            <Html
              position={[0, part.kind === 'capacitor' ? 22 : part.kind === 'source' ? 25 : 13, 0]}
              center
            >
              <button
                className={`scene-tag ${props.selected === part.id ? 'selected' : ''}`}
                onClick={() => props.onSelect(part.id)}
              >
                {part.ref}
                <span>
                  {part.kind === 'resistor'
                    ? `${part.value / 1000} kΩ`
                    : part.kind === 'capacitor'
                      ? `${Math.round(part.value * 1e6)} µF`
                      : part.kind === 'adder'
                        ? 'CD74HC283'
                        : part.kind === 'inputs'
                          ? 'ENTRADAS'
                          : part.kind === 'source'
                            ? 'FONTE DC'
                            : '0 V'}
                </span>
              </button>
            </Html>
          )}
          {hover && (
            <Html
              position={[0, part.kind === 'capacitor' ? 26 : 17, 0]}
              center
              style={{ pointerEvents: 'none' }}
            >
              <span className="terminal-tip">
                {part.ref} · {terminals(part).find((t) => t.id === hover)?.label}
                {props.nodes && props.reading.voltages[hover] !== undefined
                  ? ` · ${props.reading.voltages[hover].toFixed(2)} V`
                  : ''}
              </span>
            </Html>
          )}
        </>
      )}
    </group>
  );
}
// Simulated time does not change static geometry. Keep it out of the render loop
// unless the optional voltage layer is visible. Event closures depend on these
// same editing fields, including wireColor; project identity changes on every edit.
export default memo(
  Bench,
  (a, b) =>
    a.project === b.project &&
    a.selected === b.selected &&
    a.pending === b.pending &&
    a.tool === b.tool &&
    a.view === b.view &&
    a.quality === b.quality &&
    a.labels === b.labels &&
    a.wireColor === b.wireColor &&
    a.nodes === b.nodes &&
    a.faults.join() === b.faults.join() &&
    ((!a.nodes && !a.project.parts.some((p) => p.kind === 'led')) || a.reading === b.reading),
);
function Bench(props: Props) {
  const endpoints = useMemo(() => {
    const m = new Map<string, Vec>();
    props.project.parts.forEach((p) => terminals(p).forEach((t) => m.set(t.id, world(p, t))));
    return m;
  }, [props.project.parts]);
  return (
    <Canvas
      shadows={props.quality === 'high'}
      dpr={props.quality === 'high' ? [1, 1.5] : 1}
      frameloop="demand"
      camera={{ position: [95, 105, 120], fov: 43, near: 0.1, far: 800 }}
      onPointerMissed={() => props.onSelect('')}
      gl={{ antialias: props.quality === 'high', powerPreference: 'low-power' }}
    >
      <color attach="background" args={['#202b2d']} />
      <fog attach="fog" args={['#202b2d', 260, 500]} />
      <ambientLight intensity={1.2} />
      <hemisphereLight args={['#f0f2df', '#44545a', 1.6]} />
      <directionalLight
        position={[-30, 100, 40]}
        intensity={2.5}
        castShadow={props.quality === 'high'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-130}
        shadow-camera-right={130}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <Camera view={props.view} />
      <OrbitControls
        makeDefault
        target={[-12, 0, 5]}
        enabled={props.tool !== 'move'}
        enableDamping
        minDistance={55}
        maxDistance={280}
        maxPolarAngle={Math.PI / 2.08}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.5, 0]} receiveShadow>
        <planeGeometry args={[700, 700]} />
        <meshStandardMaterial color="#293638" roughness={0.9} />
      </mesh>
      <gridHelper args={[600, 120, '#405052', '#344244']} position={[0, -4.35, 0]} />
      {props.project.parts.map((p) => (
        <Component key={p.id} part={p} props={props} />
      ))}
      {props.project.wires.map((w) => {
        const a = endpoints.get(w.from),
          b = endpoints.get(w.to);
        if (!a || !b) return null;
        return (
          <JumperModel
            key={w.id}
            from={a}
            to={b}
            color={w.color}
            selected={props.selected === w.id}
            onSelect={() => props.onSelect(w.id)}
          />
        );
      })}
      {(
        [
          ['positive', '#f4c678', [-48, 27, -34]],
          ['negative', '#7ca6bf', [-45, 24, -34]],
        ] as const
      ).map(([key, color, start]) => {
        const point = endpoints.get(props.project.probes[key]);
        return point ? (
          <Line
            key={key}
            points={[[...start], [-33, 30, -24], [point[0], point[1] + 2, point[2]], point]}
            color={color}
            lineWidth={1.5}
            dashed
            dashSize={1}
            gapSize={0.7}
          />
        ) : null;
      })}
    </Canvas>
  );
}
