import type { Part, Reading } from './engine';
import { Html, Line } from '@react-three/drei';
export default function ExtendedModel({
  part,
  reading,
  onToggle,
}: {
  part: Part;
  reading: Reading;
  onToggle: () => void;
}) {
  const active = (reading.currents[part.id] ?? 0) > 0.0001;
  if (part.kind === 'led')
    return (
      <>
        <mesh position={[0, 8, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 4, 24]} />
          <meshStandardMaterial
            color="#b73d2b"
            emissive={active ? '#f84b17' : '#000000'}
            emissiveIntensity={Math.min(1, (reading.currents[part.id] ?? 0) / 0.01)}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 10, 0]}>
          <sphereGeometry args={[2.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#bf3525"
            emissive={active ? '#fa5726' : '#000000'}
            emissiveIntensity={active ? 0.6 : 0}
            roughness={0.25}
          />
        </mesh>
        {[-1.27, 1.27].map((x) => (
          <Line
            key={x}
            points={[
              [x, 4.15, 0],
              [x, 7, 0],
            ]}
            color="#c2c8bc"
            lineWidth={2}
          />
        ))}
      </>
    );
  if (part.kind === 'diode')
    return (
      <>
        <mesh position={[0, 6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.95, 0.95, 3.9, 16]} />
          <meshStandardMaterial color="#c7763d" roughness={0.3} />
        </mesh>
        <mesh position={[1, 6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.97, 0.97, 0.5, 16]} />
          <meshStandardMaterial color="#252c2d" />
        </mesh>
        <Line
          points={[
            [-1.27, 4.15, 0],
            [-2.7, 6, 0],
            [2.7, 6, 0],
            [1.27, 4.15, 0],
          ]}
          color="#b7c1be"
          lineWidth={2}
        />
      </>
    );
  if (part.kind === 'button')
    return (
      <>
        <mesh position={[0, 6.3, 0]}>
          <boxGeometry args={[6, 3, 6]} />
          <meshStandardMaterial color="#8e9c9a" metalness={0.6} />
        </mesh>
        <mesh position={[0, part.bits === 1 ? 8 : 9, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 2, 16]} />
          <meshStandardMaterial color={part.bits === 1 ? '#ad7f40' : '#252b2b'} />
        </mesh>
        <Html position={[0, 15, 0]} center>
          <button
            className="scene-tag"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {part.bits === 1 ? 'Abrir' : 'Fechar'}
          </button>
        </Html>
      </>
    );
  if (part.kind === 'potentiometer')
    return (
      <>
        <mesh position={[0, 8, 0]}>
          <cylinderGeometry args={[4.5, 4.5, 6, 24]} />
          <meshStandardMaterial color="#294d66" />
        </mesh>
        <mesh position={[0, 12, 0]} rotation={[0, (part.ratio ?? 0.5) * Math.PI * 1.6, 0]}>
          <boxGeometry args={[0.6, 1, 6]} />
          <meshStandardMaterial color="#e4ded0" />
        </mesh>
      </>
    );
  if (part.kind === 'transistor')
    return (
      <>
        <mesh position={[0, 8, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 5, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#272c2c" />
        </mesh>
        {[-2.54, 0, 2.54].map((x) => (
          <Line
            key={x}
            points={[
              [x, 4.15, 0],
              [x * 0.7, 7, 0],
            ]}
            color="#c7ceca"
            lineWidth={2}
          />
        ))}
        <Html position={[0, 12, 0]} center>
          <span className="board-number">2N3904</span>
        </Html>
      </>
    );
  return null;
}
