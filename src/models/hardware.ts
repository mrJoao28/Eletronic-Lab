import { computersCatalog } from './computersCatalog.ts';
import { makeComputer } from './computers.ts';
import {
  BoxGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  Path,
  Shape,
  TorusGeometry,
} from 'three';
import { material, metal, gold, black, white, box, cylinder, label, tube } from './primitives.ts';
import { makeElectronics } from './electronics.ts';
import type { ModelId } from './catalog.ts';
function smdField(parent: Group) {
  // Deterministic illustrative passives, instanced in three draws rather than hundreds.
  const locations: [number, number][] = [];
  for (let i = 0; i < 120; i++) {
    const x = -32 + (i % 20) * 3.2,
      z = -17 + Math.floor(i / 20) * 6.1;
    if ((x > -18 && x < 22 && z > -12 && z < 12) || (x < -22 && z > -10 && z < 9)) continue;
    locations.push([x, z]);
  }
  for (const [name, size, offset, mat] of [
    ['ceramic-passives', [1.3, 0.7, 0.7], 0, material('#b7a67e', 0.1)],
    ['solder-left', [0.4, 0.45, 0.8], -0.85, metal],
    ['solder-right', [0.4, 0.45, 0.8], 0.85, metal],
  ] as const) {
    const mesh = new InstancedMesh(new BoxGeometry(...size), mat, locations.length);
    mesh.name = name;
    const obj = new Object3D();
    locations.forEach(([x, z], i) => {
      obj.position.set(x + offset, 2.15, z);
      obj.updateMatrix();
      mesh.setMatrixAt(i, obj.matrix);
    });
    mesh.castShadow = true;
    parent.add(mesh);
  }
}
function makePi(): Group {
  const root = new Group();
  root.name = 'Raspberry-Pi-4-visual-study';
  const pcb = new Group();
  pcb.name = 'pcb';
  root.add(pcb);
  const shape = new Shape();
  const x = -42.5,
    y = -28,
    w = 85,
    h = 56,
    r = 3;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  for (const hx of [-39, 19])
    for (const hz of [-24.5, 24.5]) {
      const hole = new Path();
      hole.absarc(hx, hz, 1.35, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  const board = new Mesh(
    new ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: false, curveSegments: 8 }),
    material('#188746', 0.15, 0.48),
  );
  board.name = 'FR4-board';
  board.rotation.x = -Math.PI / 2;
  board.receiveShadow = true;
  pcb.add(board);
  for (const hx of [-39, 19])
    for (const hz of [-24.5, 24.5]) {
      const ring = new Mesh(new TorusGeometry(2.15, 0.75, 4, 24), gold);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(hx, 1.65, hz);
      pcb.add(ring);
    }
  const traceMat = material('#53a657', 0.3, 0.7);
  for (let i = 0; i < 28; i++) {
    const start = -20 + i * 1.05;
    tube(
      pcb,
      `illustrative-trace-${i}`,
      [
        [start, 1.65, -21],
        [start, 1.65, -16],
        [start + 3, 1.65, -13],
        [start + 3, 1.65, -10],
      ],
      0.055,
      traceMat,
    );
  }
  label(pcb, 'Raspberry Pi 4 Model B', -34, 1.75, 21, 1.6);
  label(pcb, 'GPIO', -34, 1.75, -20, 1.2);
  smdField(pcb);
  const soc = new Group();
  soc.name = 'processor';
  root.add(soc);
  box(soc, 'BCM2711-package', [15, 1.2, 15], [-9, 2.2, -2]);
  box(
    soc,
    'processor-heatspreader',
    [13, 0.45, 13],
    [-9, 3.05, -2],
    material('#a7aaa4', 0.72, 0.42),
  );
  label(soc, 'BCM2711', -14.7, 3.3, -2, 1.55, black);
  label(soc, 'BROADCOM', -14.7, 3.3, 1, 1, black);
  const memory = new Group();
  memory.name = 'memory';
  root.add(memory);
  box(memory, 'LPDDR4-package', [11, 1.1, 14], [9, 2.2, -1]);
  label(memory, 'LPDDR4', 4.3, 2.82, -1, 1.3);
  label(memory, 'SDRAM', 4.3, 2.82, 2, 1);
  const gpio = new Group();
  gpio.name = 'gpio';
  root.add(gpio);
  box(gpio, 'header-insulator', [50.8, 2.5, 5.08], [-10, 2.85, -24]);
  for (let col = 0; col < 20; col++)
    for (let row = 0; row < 2; row++) {
      box(
        gpio,
        `GPIO-${col * 2 + row + 1}`,
        [0.64, 8.5, 0.64],
        [-34.13 + col * 2.54, 7, -25.27 + row * 2.54],
        gold,
      );
      cylinder(pcb, 'GPIO-solder', 0.75, 0.2, [-34.13 + col * 2.54, -0.1, -25.27 + row * 2.54]);
    }
  const io = new Group();
  io.name = 'ports';
  root.add(io);
  for (const [z, name, insert] of [
    [-18, 'USB-2', '#252b29'],
    [0, 'USB-3', '#2867a4'],
    [18, 'Ethernet', '#222c28'],
  ] as const) {
    box(io, `${name}-shell`, [17.5, 15.6, 15.4], [35, 9.4, z], metal);
    box(io, `${name}-opening`, [0.25, 12, 12.7], [43.86, 9.5, z], material('#101a1b'));
    if (name === 'Ethernet') {
      box(io, 'RJ45-key', [0.4, 3, 6], [44.05, 4.8, z], black);
      for (let i = 0; i < 8; i++)
        box(io, 'RJ45-contact', [0.4, 0.25, 0.3], [44.12, 13, z - 3.5 + i], gold);
    } else
      for (const height of [5.5, 12.5]) {
        box(io, 'USB-tongue', [0.6, 1.3, 10.5], [44.1, height, z], material(insert));
        box(io, 'USB-divider', [0.6, 0.6, 12.5], [44.1, 9, z], metal);
      }
    box(io, `${name}-seam`, [12, 0.08, 0.14], [35, 17.23, z], black);
  }
  for (const [px, name, width] of [
    [-34, 'USB-C', 9],
    [-18, 'micro-HDMI-0', 7],
    [0, 'micro-HDMI-1', 7],
  ] as const) {
    box(io, `${name}-shell`, [width, 3.4, 6], [px, 3.3, 26], metal);
    box(io, `${name}-socket`, [width - 1.1, 2.2, 0.2], [px, 3.3, 29.1], black);
  }
  const ribbons = new Group();
  ribbons.name = 'ribbon';
  root.add(ribbons);
  for (const [px, pz, name] of [
    [-20, 14, 'CSI'],
    [-36, -2, 'DSI'],
  ] as const) {
    box(ribbons, `${name}-base`, [4, 3, 21], [px, 3.1, pz], white);
    box(ribbons, `${name}-latch`, [1.8, 1.3, 22], [px - 0.8, 5.15, pz], black);
    for (let i = 0; i < 15; i++)
      box(ribbons, 'FFC-contact', [0.5, 0.2, 0.35], [px + 1.4, 4.7, pz - 7 + i], gold);
  }
  const wireless = new Group();
  wireless.name = 'wireless';
  root.add(wireless);
  box(wireless, 'radio-shield', [12, 1.7, 11], [-28, 2.7, -12], metal);
  label(wireless, 'WIRELESS', -33, 3.6, -12, 1, black);
  const bottom = new Group();
  bottom.name = 'underside';
  root.add(bottom);
  box(bottom, 'microSD-holder', [14, 1.8, 15], [-33, -1.1, 9], metal);
  box(bottom, 'microSD-slot', [0.3, 1.2, 12], [-40.1, -1.1, 9], black);
  return root;
}
function makeChip(): Group {
  const g = new Group();
  g.name = 'CD74HC283-PDIP16';
  box(g, 'molded-body', [19.31, 4.5, 6.35], [0, 7, 0]);
  const dot = cylinder(g, 'pin-1-marker', 0.6, 0.04, [-8, 9.27, 1.9], material('#969c91'));
  dot.userData.description = 'Pin 1';
  label(g, 'CD74HC283', -6.8, 9.28, 0.3, 1.5);
  label(g, 'HC / PDIP-16', -6.8, 9.28, 2.1, 0.8);
  for (let i = 0; i < 16; i++) {
    const x = (i < 8 ? i : 15 - i) * 2.54 - 8.89,
      z = i < 8 ? 3.81 : -3.81;
    tube(
      g,
      `pin-${i + 1}`,
      [
        [x, 6.8, z * 0.7],
        [x, 6.5, z],
        [x, 4.15, z],
      ],
      0.24,
    );
  }
  return g;
}
function makeResistor(): Group {
  const g = new Group();
  g.name = 'MRS25-10k-1percent';
  const body = cylinder(g, 'metal-film-body', 1.25, 6.5, [0, 6, 0], material('#a1b99a', 0.1, 0.4));
  body.rotation.z = Math.PI / 2;
  const colors = ['#6b4432', '#20221f', '#20221f', '#c38043', '#6b4432'];
  [-2.1, -1.1, -0.1, 1.2, 2.3].forEach((x, i) => {
    const b = cylinder(g, `band-${i}`, 1.27, 0.48, [x, 6, 0], material(colors[i]));
    b.rotation.z = Math.PI / 2;
  });
  tube(
    g,
    'lead-1',
    [
      [-5.08, 4.15, 0],
      [-5.08, 5.5, 0],
      [-3.25, 6, 0],
    ],
    0.25,
  );
  tube(
    g,
    'lead-2',
    [
      [5.08, 4.15, 0],
      [5.08, 5.5, 0],
      [3.25, 6, 0],
    ],
    0.25,
  );
  return g;
}
function makeCapacitor(): Group {
  const g = new Group();
  g.name = 'UHE-representative-100uF-16V';
  cylinder(g, 'sleeve', 4, 11.5, [0, 12, 0], material('#193e43', 0.35, 0.38));
  cylinder(g, 'top-aluminium', 3.7, 0.15, [0, 17.82, 0]);
  box(g, 'vent-x', [5, 0.025, 0.08], [0, 17.91, 0], black);
  box(g, 'vent-z', [0.08, 0.025, 5], [0, 17.91, 0], black);
  box(g, 'negative-stripe', [0.18, 10.8, 2.1], [3.91, 12, 0], white);
  for (let i = 0; i < 3; i++)
    box(g, 'minus-mark', [0.04, 0.15, 1.3], [4.02, 8.8 + i * 3, 0], black);
  for (const x of [-1.27, 1.27])
    cylinder(g, x < 0 ? 'positive-lead' : 'negative-lead', 0.25, 3, [x, 5.6, 0]);
  return g;
}
export function createHardwareModel(id: ModelId): Group {
  if (id === 'pi4') return makePi();
  if (id === 'hc283') return makeChip();
  if (id === 'resistor') return makeResistor();
  if (id === 'capacitor') return makeCapacitor();
  if (id in computersCatalog) return makeComputer(id);
  return makeElectronics(id);
}
