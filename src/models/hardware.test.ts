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

describe('Formatos de computador', () => {
  it('preserva as dimensões principais e distingue os formatos de memória', () => {
    for (const [id, width, depth] of [
      ['ram', 133.35, 31.25],
      ['sodimm', 69.6, 30],
      ['nvme', 80, 22],
      ['motherboard', 244, 244],
    ] as const) {
      const model = createHardwareModel(id);
      const size = new Box3()
        .setFromObject(model.getObjectByName('FR4-board')!)
        .getSize(new Vector3());
      expect(size.x).toBeCloseTo(width);
      expect(size.z).toBeCloseTo(depth);
    }
  });
  it('mantém anatomia reconhecível sem atribuir simulação às peças de computador', () => {
    expect(createHardwareModel('gpu').getObjectsByProperty('name', 'curved-blade')).toHaveLength(
      14,
    );
    expect(createHardwareModel('fan').getObjectsByProperty('name', 'curved-blade')).toHaveLength(7);
    expect(createHardwareModel('hdd').getObjectByName('actuator-arm')).toBeDefined();
    const nvme = createHardwareModel('nvme');
    const edge = new Box3().setFromObject(nvme.getObjectByName('M-key-connector')!);
    expect(edge.getSize(new Vector3()).z).toBeGreaterThan(edge.getSize(new Vector3()).x);
    expect(nvme.getObjectByName('M2-mounting-ring')).toBeDefined();
    expect(createHardwareModel('atxcable').getObjectsByProperty('name', 'pin-cavity')).toHaveLength(
      48,
    );
    const computers = Object.values(modelCatalog).filter((item) => item.family === 'computers');
    expect(computers.length).toBe(17);
    expect(computers.every((item) => !item.benchKind)).toBe(true);
    expect(Object.keys(modelCatalog)).toHaveLength(40);
  });
});
