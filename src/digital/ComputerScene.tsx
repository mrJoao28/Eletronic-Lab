import { Canvas } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import type { CPU } from './cpu';
export default function ComputerScene({
  cpu,
  onSelect,
}: {
  cpu: CPU;
  onSelect: (name: string) => void;
}) {
  const blocks = [
    { name: 'PC / CONTROLE', value: cpu.pc, x: -28, z: -19 },
    { name: 'IR / DECODER', value: cpu.ir, x: 0, z: -19 },
    { name: 'RAM 256 × 8', value: cpu.memory[cpu.mar], x: 28, z: -19 },
    { name: 'REGISTRADOR A', value: cpu.a, x: -28, z: 15 },
    { name: 'ALU / FLAGS', value: (cpu.zero ? 1 : 0) | (cpu.carry ? 2 : 0), x: 0, z: 15 },
    { name: 'SAÍDA', value: cpu.out, x: 28, z: 15 },
  ];
  return (
    <Canvas camera={{ position: [85, 90, 100], fov: 42 }} frameloop="demand" dpr={[1, 1.5]}>
      <color attach="background" args={['#0b101a']} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[30, 100, 20]} intensity={2.5} />
      <OrbitControls target={[0, 0, 0]} minDistance={50} maxDistance={240} />
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[95, 2, 65]} />
        <meshStandardMaterial color="#267047" roughness={0.5} />
      </mesh>
      {blocks.map((b) => (
        <group
          key={b.name}
          position={[b.x, 0, b.z]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(b.name);
          }}
        >
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[23, 5, 17]} />
            <meshStandardMaterial
              color={cpu.bus.includes(b.name.split(' ')[0]) ? '#9c915d' : '#303c3b'}
            />
          </mesh>
          <Html zIndexRange={[8, 0]} position={[0, 8, 0]} center>
            <button className="scene-tag" onClick={() => onSelect(b.name)}>
              {b.name}
              <span>{b.value.toString(2).padStart(8, '0')}</span>
            </button>
          </Html>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[-9 + i * 2.5, 5, 5]}>
              <sphereGeometry args={[0.6, 8, 6]} />
              <meshStandardMaterial
                color={(b.value >> i) & 1 ? '#f2cf7c' : '#576353'}
                emissive={(b.value >> i) & 1 ? '#a87b21' : '#000000'}
              />
            </mesh>
          ))}
        </group>
      ))}
      {[-8, 0, 8].map((z) => (
        <Line
          key={z}
          points={[
            [-38, 0, z],
            [38, 0, z],
          ]}
          color="#c2ad56"
          lineWidth={2}
        />
      ))}
      <Html zIndexRange={[8, 0]} position={[0, -1, 38]} center>
        <span className="computer-board-label">ARQUITETURA DIDÁTICA · PLACA CONCEITUAL</span>
      </Html>
    </Canvas>
  );
}
