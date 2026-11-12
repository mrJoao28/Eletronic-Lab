import type { Object3D } from 'three';
export const inspectionGroups = [
  'processor',
  'memory',
  'gpio',
  'ports',
  'ribbon',
  'wireless',
  'pcb',
  'underside',
] as const;
export function inspectModel(root: Object3D, explosion: number, hidden: readonly string[]) {
  const amount = Math.min(1, Math.max(0, explosion));
  inspectionGroups.forEach((name, i) => {
    const object = root.getObjectByName(name);
    if (!object) return;
    object.visible = !hidden.includes(name);
    object.position.y = (name === 'pcb' ? 0 : name === 'underside' ? -10 : (i + 1) * 7) * amount;
  });
  root.updateMatrixWorld(true);
  return root;
}
