import { Group, Mesh, SphereGeometry, TorusGeometry } from 'three';
import { box, cylinder, label, tube, material, metal, gold, black, white } from './primitives.ts';
import type { ModelId } from './catalog.ts';
const copper = material('#bd733d', 0.75, 0.3);
const blue = material('#235a91', 0.12, 0.4);
const green = material('#176b47', 0.15, 0.5);
function leads(g: Group, xs: number[], z = 0) {
  xs.forEach((x, i) => cylinder(g, `terminal-${i + 1}`, 0.25, 5, [x, 3, z]));
}
function header(g: Group, count: number, x: number, z: number, female = false) {
  box(g, 'header-insulator', [count * 2.54, 2.5, 2.54], [x, 3, z]);
  for (let i = 0; i < count; i++) {
    const px = x + (i - (count - 1) / 2) * 2.54;
    if (female) box(g, `socket-${i}`, [1.2, 0.12, 1.2], [px, 4.3, z], material('#080b0c'));
    else box(g, `header-pin-${i}`, [0.64, 7, 0.64], [px, 4.5, z], gold);
  }
}
export function makeElectronics(id: ModelId): Group {
  const g = new Group();
  g.name = id;
  if (id === 'led') {
    const lens = material('#dc3026', 0.05, 0.24);
    lens.transparent = true;
    lens.opacity = 0.8;
    cylinder(g, 'lens-barrel', 2.5, 4, [0, 8, 0], lens);
    const dome = new Mesh(new SphereGeometry(2.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens);
    dome.position.set(0, 10, 0);
    g.add(dome);
    cylinder(g, 'flange', 2.9, 0.8, [0, 6, 0], lens);
    leads(g, [-1.27, 1.27]);
    box(g, 'cathode-cup', [1.8, 0.5, 1.3], [0.7, 8, 0], metal);
    tube(
      g,
      'bond-wire',
      [
        [-0.8, 8, 0],
        [0, 10, 0],
        [0.7, 8.5, 0],
      ],
      0.07,
      gold,
    );
  } else if (id === 'diode' || id === 'fuse') {
    const fuse = id === 'fuse',
      length = fuse ? 20 : 3.9,
      radius = fuse ? 2.5 : 0.95;
    const glass = material(fuse ? '#c9e0df' : '#be713c', 0.05, 0.18);
    glass.transparent = true;
    glass.opacity = 0.4;
    const body = cylinder(g, 'glass-body', radius, length, [0, 6, 0], glass);
    body.rotation.z = Math.PI / 2;
    for (const sign of [-1, 1]) {
      const cap = cylinder(
        g,
        'end-cap',
        radius + 0.06,
        fuse ? 4 : 0.6,
        [sign * (length / 2 - (fuse ? 2 : 0.3)), 6, 0],
        metal,
      );
      cap.rotation.z = Math.PI / 2;
    }
    tube(
      g,
      'internal-element',
      [
        [-length / 2, 6, 0],
        [0, 6.2, 0],
        [length / 2, 6, 0],
      ],
      fuse ? 0.1 : 0.2,
      metal,
    );
    if (!fuse) {
      const band = cylinder(g, 'cathode-band', 1, 0.5, [1.1, 6, 0], black);
      band.rotation.z = Math.PI / 2;
      tube(
        g,
        'anode',
        [
          [-5.08, 4.15, 0],
          [-4, 6, 0],
          [-2, 6, 0],
        ],
        0.23,
      );
      tube(
        g,
        'cathode',
        [
          [5.08, 4.15, 0],
          [4, 6, 0],
          [2, 6, 0],
        ],
        0.23,
      );
    }
  } else if (id === 'transistor') {
    cylinder(g, 'molded-body', 2.5, 4.8, [0, 8, 0]);
    box(g, 'flat-face', [4.5, 4.8, 1.2], [0, 8, 1.5]);
    leads(g, [-2.54, 0, 2.54]);
    label(g, 'NPN', -1.8, 10.5, 0, 0.8);
  } else if (id === 'mosfet' || id === 'regulator') {
    box(g, 'encapsulation', [10, 9, 4.5], [0, 10, 0]);
    box(g, 'metal-tab', [10, 6, 0.8], [0, 17, -1.8], metal);
    const ring = new Mesh(new TorusGeometry(1.6, 0.65, 6, 24), metal);
    ring.position.set(0, 18, -1.25);
    g.add(ring);
    cylinder(g, 'mounting-hole-dark', 1.35, 0.08, [0, 18, -1.28], black).rotation.x = Math.PI / 2;
    leads(g, [-2.54, 0, 2.54]);
    label(g, id === 'mosfet' ? 'MOSFET' : '7805', -3.5, 14.6, 1, 1);
  } else if (id === 'button') {
    box(g, 'base', [6, 2, 6], [0, 5, 0]);
    box(g, 'metal-cover', [5.8, 0.5, 5.8], [0, 6.3, 0], metal);
    cylinder(g, 'actuator', 1.7, 2, [0, 7.4, 0]);
    leads(g, [-3.81, 3.81]);
    for (const x of [-2.2, 2.2])
      for (const z of [-2.2, 2.2]) cylinder(g, 'rivet', 0.3, 0.15, [x, 6.65, z]);
  } else if (id === 'potentiometer') {
    box(g, 'blue-housing', [9, 6, 9], [0, 8, 0], blue);
    cylinder(g, 'adjustment', 2, 1, [0, 11.5, 0], white);
    box(g, 'screw-slot', [3, 0.1, 0.5], [0, 12.05, 0]);
    leads(g, [-2.54, 0, 2.54]);
    label(g, '103', -3.7, 11.1, 3.7, 1.1);
  } else if (id === 'ceramic') {
    cylinder(g, 'ceramic-disc', 3, 1.6, [0, 9, 0], material('#b98139')).rotation.x = Math.PI / 2;
    leads(g, [-2.54, 2.54]);
    label(g, '104', -1.6, 12.05, 0, 1);
  } else if (id === 'film') {
    box(g, 'epoxy-case', [13, 10, 5], [0, 10, 0], material('#b83135'));
    leads(g, [-5, 5]);
    label(g, '100n', -4, 15.05, 1, 1.5);
  } else if (id === 'inductor') {
    const torus = new Mesh(new TorusGeometry(6, 2, 12, 40), material('#49584d'));
    torus.rotation.x = -Math.PI / 2;
    torus.position.y = 6;
    g.add(torus);
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24;
      const points = [];
      for (let j = 0; j <= 16; j++) {
        const b = (j * Math.PI * 2) / 16;
        points.push([
          (6 + 2.2 * Math.cos(b)) * Math.cos(a),
          6 + 2.2 * Math.sin(b),
          (6 + 2.2 * Math.cos(b)) * Math.sin(a),
        ]);
      }
      tube(g, `winding-${i}`, points, 0.32, copper);
    }
    leads(g, [-6, 6]);
  } else if (id === 'relay') {
    box(g, 'base', [19, 2, 15], [0, 4, 0]);
    box(g, 'relay-cover', [18.5, 14, 14.5], [0, 12, 0], blue);
    label(g, 'SPDT', -7, 19.05, 1, 2);
    label(g, 'COIL / COM / NO / NC', -8, 19.05, 5, 0.65);
    leads(g, [-7, 0, 7], -5);
    leads(g, [-7, 7], 5);
  } else if (id === 'buzzer') {
    cylinder(g, 'housing', 6, 8, [0, 10, 0]);
    cylinder(g, 'acoustic-port', 1.2, 0.1, [0, 14.1, 0], material('#050607'));
    leads(g, [-3, 3]);
    label(g, '+', 2, 14.12, 0, 1.7);
  } else if (id === 'crystal') {
    box(g, 'metal-can', [10.8, 4, 4], [0, 8, 0], metal);
    cylinder(g, 'rounded-end', 2, 4, [-5, 8, 0]).rotation.x = Math.PI / 2;
    cylinder(g, 'rounded-end', 2, 4, [5, 8, 0]).rotation.x = Math.PI / 2;
    box(g, 'insulating-base', [11.5, 0.8, 4.8], [0, 5.8, 0]);
    leads(g, [-2.44, 2.44]);
    label(g, '16.000', -4, 10.1, 1, 1.2, black);
  } else if (id === 'battery') {
    box(g, 'battery-can', [26, 47, 17], [0, 24, 0], material('#bd8738', 0.5, 0.35));
    box(g, 'insulating-cap', [26, 2, 17], [0, 48.5, 0]);
    cylinder(g, 'positive-snap', 2.5, 3, [-6, 51, 0]);
    cylinder(g, 'negative-snap', 3.7, 2, [6, 50.5, 0]);
    cylinder(g, 'negative-opening', 2.5, 0.1, [6, 51.6, 0]);
    label(g, '9V', -7, 47.6, 6, 4, black);
  } else if (id === 'sevensegment') {
    box(g, 'display-body', [13, 8, 19], [0, 6, 0], white);
    box(g, 'display-face', [12, 0.3, 18], [0, 10.2, 0], black);
    const red = material('#dc463b');
    for (const z of [-6, 0, 6]) box(g, 'horizontal-segment', [6, 0.15, 1], [0, 10.42, z], red);
    for (const x of [-3.7, 3.7])
      for (const z of [-3, 3]) box(g, 'vertical-segment', [1, 0.15, 4.8], [x, 10.42, z], red);
    cylinder(g, 'decimal-point', 0.65, 0.15, [4.5, 10.42, 7], red);
    leads(g, [-5.08, -2.54, 0, 2.54, 5.08], -8);
    leads(g, [-5.08, -2.54, 0, 2.54, 5.08], 8);
  } else if (id === 'oled') {
    box(g, 'pcb', [27, 1.6, 27], [0, 1, 0], blue);
    box(g, 'glass', [24, 1, 17], [0, 2.3, 3]);
    box(g, 'active-area', [20, 0.1, 12], [0, 2.9, 3], material('#102832', 0.2, 0.25));
    label(g, 'OLED', -8, 3.01, 4, 3, material('#7ce6e1'));
    header(g, 4, 0, -11);
  } else if (id === 'uno' || id === 'esp32') {
    const uno = id === 'uno',
      w = uno ? 68.6 : 54,
      d = uno ? 53.4 : 28;
    box(g, 'pcb', [w, 1.6, d], [0, 0.8, 0], uno ? blue : green);
    for (const z of [-d / 2 + 3, d / 2 - 3]) header(g, uno ? 14 : 19, uno ? 9 : 0, z, uno);
    box(
      g,
      'usb-shell',
      [uno ? 12 : 8, uno ? 10 : 3.5, uno ? 12 : 6],
      [-w / 2 + 4, uno ? 6.6 : 3.4, 0],
      metal,
    );
    box(g, 'usb-opening', [0.2, uno ? 7 : 2.2, uno ? 8 : 4.5], [-w / 2 - 2.1, uno ? 6.6 : 3.4, 0]);
    if (uno) {
      box(g, 'ATmega328P', [35, 4, 8], [8, 4, 4]);
      for (let i = 0; i < 14; i++)
        for (const z of [8.5, -0.5])
          box(g, 'DIP-lead', [0.5, 2, 0.6], [-8 + i * 2.54, 2.3, z], metal);
      box(g, 'barrel-jack', [14, 10, 9], [-26, 6.6, 17]);
      cylinder(g, 'jack-hole', 2.8, 0.3, [-33.1, 7, 17]).rotation.z = Math.PI / 2;
      label(g, 'UNO R3', -17, 1.68, -8, 3);
    } else {
      box(g, 'ESP32-module', [22, 1, 16], [8, 2.2, 0]);
      box(g, 'RF-shield', [16, 2, 15], [6, 3.5, 0], metal);
      label(g, 'ESP32', 0, 4.55, 1, 2, black);
      for (let i = 0; i < 6; i++)
        box(g, 'antenna-meander', [0.4, 0.15, 7], [19 + i, 2.8, i % 2 ? 2 : -2], gold);
    }
    cylinder(g, 'reset', 2, 1, [-18, 2.3, -7], material('#a83e35'));
    for (let i = 0; i < 14; i++) {
      box(
        g,
        'SMD-passive',
        [1.5, 0.6, 0.7],
        [-17 + (i % 7) * 3.2, 2, 5 + Math.floor(i / 7) * 3],
        white,
      );
    }
  } else if (id === 'breadboard') {
    box(g, 'breadboard-base', [85, 8, 55], [0, 0, 0], white);
    box(g, 'central-channel', [79, 0.1, 3], [0, 4.1, -1.27], material('#8e958e'));
    const hole = material('#344342');
    for (let col = 0; col < 30; col++)
      for (const z of [-15.24, -12.7, -10.16, -7.62, -5.08, 2.54, 5.08, 7.62, 10.16, 12.7])
        box(g, 'terminal-hole', [0.85, 0.08, 0.85], [(col - 14.5) * 2.54, 4.05, z], hole);
    for (const z of [-23, -20, 20, 23])
      for (let i = 0; i < 25; i++)
        box(g, 'rail-hole', [0.85, 0.08, 0.85], [(i - 12) * 2.54, 4.05, z], hole);
    for (const [z, color] of [
      [-25, '#c64436'],
      [-18, '#3575a6'],
      [18, '#c64436'],
      [25, '#3575a6'],
    ] as const)
      box(g, 'power-rail', [73, 0.06, 0.4], [0, 4.06, z], material(color));
    for (let i = 0; i < 30; i += 5)
      label(g, String(i + 1), (i - 14.5) * 2.54, 4.12, -16.8, 1.3, black);
  } else {
    throw new Error(`No electronics geometry for ${id}`);
  }
  return g;
}
