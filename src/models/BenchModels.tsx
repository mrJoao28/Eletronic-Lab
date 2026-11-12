import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { CatmullRomCurve3, Vector3 } from 'three';
import type { Vec } from '../engine';

// Reuse the same exported asset that can be downloaded in the atlas.
export function BenchModel({ id }: { id: 'hc283' | 'capacitor' }) {
  const { scene } = useGLTF(`/models/${id}.glb`);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.scale.setScalar(1000);
    return copy;
  }, [scene]);
  return <primitive object={model} dispose={null} />;
}
export function JumperModel({
  from,
  to,
  color,
  lift,
  selected,
  onSelect,
}: {
  from: Vec;
  to: Vec;
  color: string;
  lift?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const curve = useMemo(() => {
    const a = new Vector3(...from),
      b = new Vector3(...to);
    const height = Math.max(a.y, b.y) + (lift ?? Math.min(12, 4 + a.distanceTo(b) * 0.12));
    return new CatmullRomCurve3(
      [a, new Vector3(a.x, height, a.z), new Vector3(b.x, height, b.z), b],
      false,
      'centripetal',
    );
  }, [from, to, lift]);
  return (
    <mesh
      castShadow
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <tubeGeometry args={[curve, 24, selected ? 0.48 : 0.36, 6, false]} />
      <meshStandardMaterial
        color={selected ? '#f7e9bd' : color}
        roughness={0.48}
        metalness={0.05}
      />
    </mesh>
  );
}
