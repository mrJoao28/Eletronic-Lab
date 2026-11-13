import { describe, expect, it } from 'vitest';
import { Box3, Mesh, Vector3 } from 'three';
import { createHardwareModel } from './hardware';
import { modelCatalog, type ModelId } from './catalog';
describe('Modelos de hardware exportáveis', () => {
  it('tem 40 pinos GPIO e contorno de placa com 85 × 56 mm', () => {
    const pi = createHardwareModel('pi4');
    const header = pi.getObjectByName('gpio')!;
    expect(header.children.filter((p) => p.name.startsWith('GPIO-'))).toHaveLength(40);
    const board = new Box3().setFromObject(pi.getObjectByName('FR4-board')!);
    const size = board.getSize(new Vector3());
    expect(size.x).toBeCloseTo(85);
    expect(size.z).toBeCloseTo(56);
    expect(pi.getObjectByName('processor')).toBeDefined();
    expect(pi.getObjectByName('microSD-slot')).toBeDefined();
  });
  it('preserva os 16 terminais identificados do somador', () => {
    const chip = createHardwareModel('hc283');
    for (let i = 1; i <= 16; i++) expect(chip.getObjectByName(`pin-${i}`)).toBeDefined();
  });
  it('usa geometria finita e materiais locais sem texturas externas', () => {
    for (const id of Object.keys(modelCatalog) as ModelId[]) {
      const model = createHardwareModel(id);
      const box = new Box3().setFromObject(model);
      expect([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)).toBe(true);
      model.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const positions = object.geometry.getAttribute('position');
        expect([...positions.array].every(Number.isFinite)).toBe(true);
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const mat of materials) expect('map' in mat ? mat.map : null).toBeFalsy();
      });
    }
  });
});

describe('Acervo de eletrônica', () => {
  it('mantém 400 pontos visuais e referências rastreáveis para os modelos', () => {
    const board = createHardwareModel('breadboard');
    let holes = 0;
    board.traverse((object) => {
      if (['terminal-hole', 'rail-hole'].includes(object.name)) holes++;
    });
    expect(holes).toBe(400);
    for (const item of Object.values(modelCatalog)) {
      expect(new URL(item.source).protocol).toBe('https:');
      expect(item.description.length).toBeGreaterThan(50);
    }
  });
});
