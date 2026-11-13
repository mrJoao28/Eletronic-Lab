import { Group, Mesh, Shape, ExtrudeGeometry, TorusGeometry } from 'three';
import { box, cylinder, label, tube, material, metal, gold, black, white } from './primitives.ts';
import type { ModelId } from './catalog.ts';
const pcb = material('#155744', 0.2, 0.5),
  dark = material('#111820', 0.15, 0.42),
  copper = material('#be7945', 0.8, 0.25);
function board(g: Group, width: number, depth: number) {
  box(g, 'FR4-board', [width, 1.6, depth], [0, 0.8, 0], pcb);
  for (const x of [-width / 2 + 4, width / 2 - 4])
    for (const z of [-depth / 2 + 4, depth / 2 - 4]) {
      const ring = new Mesh(new TorusGeometry(1.6, 0.6, 5, 20), gold);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 1.7, z);
      g.add(ring);
      cylinder(g, 'mounting-hole', 1.1, 0.1, [x, 1.76, z], dark);
    }
}
function passives(g: Group, width: number, depth: number, count = 32) {
  for (let i = 0; i < count; i++) {
    const x = -width / 2 + 6 + ((i % 8) * (width - 12)) / 8,
      z = -depth / 2 + 5 + (Math.floor(i / 8) * (depth - 10)) / Math.ceil(count / 8);
    box(g, 'SMD-package', [1.8, 0.65, 1], [x, 2, z], i % 3 ? white : black);
    for (const dx of [-1.1, 1.1]) box(g, 'solder', [0.4, 0.45, 1], [x + dx, 1.9, z], metal);
  }
}
function contacts(g: Group, count: number, span: number, z: number) {
  for (let i = 0; i < count; i++) {
    if (Math.abs(i - count * 0.43) < 1.5) continue;
    const x = ((i - (count - 1) / 2) * span) / count;
    for (const y of [-0.05, 1.65])
      box(g, 'edge-contact', [(span / count) * 0.7, 0.1, 3.7], [x, y, z], gold);
  }
}
function fan(g: Group, x: number, y: number, z: number, size: number, depth: number) {
  const frame = new Group();
  frame.name = 'fan';
  frame.position.set(x, y, z);
  g.add(frame);
  for (const sign of [-1, 1]) {
    box(frame, 'frame-bar', [size, depth, size * 0.08], [0, 0, sign * size * 0.46], dark);
    box(frame, 'frame-bar', [size * 0.08, depth, size], [sign * size * 0.46, 0, 0], dark);
  }
  const ring = new Mesh(new TorusGeometry(size * 0.43, size * 0.035, 6, 48), dark);
  ring.rotation.x = -Math.PI / 2;
  frame.add(ring);
  cylinder(frame, 'hub', size * 0.13, depth * 0.7, [0, 0, 0], dark);
  cylinder(frame, 'hub-label', size * 0.1, 0.1, [0, depth * 0.36, 0], material('#80918d', 0.3));
  for (let i = 0; i < 7; i++) {
    const blade = new Shape();
    blade.moveTo(size * 0.1, 0);
    blade.quadraticCurveTo(size * 0.23, -size * 0.14, size * 0.4, -size * 0.14);
    blade.quadraticCurveTo(size * 0.44, -size * 0.02, size * 0.37, size * 0.07);
    blade.quadraticCurveTo(size * 0.21, size * 0.09, size * 0.1, size * 0.03);
    blade.closePath();
    const mesh = new Mesh(
      new ExtrudeGeometry(blade, { depth: size * 0.025, bevelEnabled: false, curveSegments: 10 }),
      material('#303b42', 0.22, 0.4),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = (i * Math.PI * 2) / 7;
    mesh.position.y = depth * 0.18;
    mesh.name = 'curved-blade';
    frame.add(mesh);
  }
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const ring = new Mesh(new TorusGeometry(size * 0.025, size * 0.012, 5, 16), metal);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(sx * size * 0.435, depth / 2 + 0.1, sz * size * 0.435);
      frame.add(ring);
    }
  for (const sign of [-1, 1])
    box(
      frame,
      'rear-support',
      [size * 0.7, 1.5, size * 0.025],
      [sign * size * 0.12, -depth * 0.4, 0],
      dark,
    );
}
function sata(g: Group, x: number, y: number, z: number) {
  box(g, 'SATA-data', [14, 4, 7], [x, y, z]);
  box(g, 'SATA-power', [23, 4, 7], [x + 21, y, z]);
  for (let i = 0; i < 7; i++)
    box(g, 'SATA-data-contact', [0.6, 0.15, 3], [x - 5 + i * 1.4, y + 2.1, z + 2], gold);
  for (let i = 0; i < 15; i++)
    box(g, 'SATA-power-contact', [0.6, 0.15, 3], [x + 11 + i * 1.35, y + 2.1, z + 2], gold);
  box(g, 'data-L-key', [1, 1, 5], [x - 6.8, y + 2, z]);
  box(g, 'power-L-key', [1, 1, 5], [x + 9.8, y + 2, z]);
}
export function makeComputer(id: ModelId): Group {
  const g = new Group();
  g.name = id;
  if (id === 'cpu') {
    box(g, 'substrate', [37.5, 1.4, 45], [0, 0.7, 0], pcb);
    box(g, 'heatspreader', [32, 2.6, 38], [0, 2.7, 0], metal);
    label(g, 'DESKTOP CPU', -13, 4.05, -3, 2.5, black);
    label(g, 'LGA / VISUAL STUDY', -13, 4.05, 3, 1.3, black);
    for (let i = 0; i < 20; i++)
      for (let j = 0; j < 22; j++) {
        if (i > 5 && i < 14 && j > 6 && j < 15) continue;
        box(g, 'LGA-contact', [0.75, 0.1, 0.75], [-16 + i * 1.7, -0.05, -18 + j * 1.7], gold);
      }
    const marker = new Shape();
    marker.moveTo(-17, 18);
    marker.lineTo(-13, 18);
    marker.lineTo(-17, 14);
    marker.closePath();
    const triangle = new Mesh(
      new ExtrudeGeometry(marker, { depth: 0.06, bevelEnabled: false }),
      gold,
    );
    triangle.rotation.x = -Math.PI / 2;
    triangle.position.y = 1.46;
    g.add(triangle);
  } else if (id === 'ram' || id === 'sodimm') {
    const small = id === 'sodimm',
      w = small ? 69.6 : 133.35,
      d = small ? 30 : 31.25,
      count = small ? 4 : 8;
    board(g, w, d);
    for (let i = 0; i < count; i++)
      for (const side of [-1, 1])
        box(
          g,
          'DRAM-package',
          [small ? 11 : 12, 1.2, 11],
          [(i - (count - 1) / 2) * (small ? 14 : 15), side === 1 ? 2.3 : -0.7, -2],
        );
    contacts(g, small ? 130 : 144, w - 12, d / 2 - 2);
    box(g, 'key-gap', [1.3, 1.8, 4], [-w * 0.07, 0.8, d / 2 - 1], dark);
    label(g, small ? 'DDR4 SO-DIMM' : 'DDR4 DIMM', -w / 2 + 7, 3, -8, small ? 1.5 : 2, white);
  } else if (id === 'motherboard') {
    board(g, 244, 244);
    passives(g, 220, 200, 96);
    box(g, 'socket-base', [58, 5, 68], [-25, 4, -35], dark);
    box(g, 'socket-retention-frame', [50, 1, 60], [-25, 7, -35], metal);
    box(g, 'socket-contact-field', [40, 1.1, 48], [-25, 7.6, -35], material('#646559', 0.6));
    tube(
      g,
      'retention-lever',
      [
        [6, 8, -68],
        [8, 9, -68],
        [8, 9, -4],
        [2, 8, -2],
      ],
      1,
      metal,
    );
    for (let i = 0; i < 4; i++) {
      box(g, 'DIMM-slot', [5, 11, 140], [35 + i * 11, 7, -20], i % 2 ? dark : material('#77858b'));
      for (const z of [-93, 53]) box(g, 'DIMM-latch', [7, 12, 7], [35 + i * 11, 7, z], white);
      box(g, 'DIMM-slot-groove', [1.2, 0.2, 130], [35 + i * 11, 12.6, -20], black);
    }
    for (const z of [40, 80]) {
      box(g, 'PCIe-x16', [90, 9, 11], [-45, 6, z], dark);
      box(g, 'PCIe-groove', [83, 0.2, 2], [-45, 10.6, z], black);
      box(g, 'PCIe-latch', [8, 12, 12], [4, 7, z], white);
    }
    box(g, 'PCIe-x1', [27, 9, 11], [-75, 6, 60]);
    box(g, 'chipset-heatsink', [36, 8, 32], [47, 6, 84], metal);
    for (let i = 0; i < 9; i++) box(g, 'chipset-fin', [2, 6, 32], [31 + i * 4, 12, 84], dark);
    for (let i = 0; i < 8; i++) {
      cylinder(g, 'VRM-capacitor', 3, 8, [-66 + i * 11, 6, -92], metal);
      box(g, 'VRM-choke', [7, 6, 7], [-66 + i * 11, 4.8, -80]);
    }
    for (let i = 0; i < 4; i++) box(g, 'SATA-port', [12, 10, 15], [108, 7, 55 + i * 16], dark);
    box(g, 'ATX-24-pin', [12, 14, 51], [107, 8, -32]);
    for (let i = 0; i < 12; i++)
      for (const x of [104, 110])
        box(g, 'ATX-cavity', [3, 0.12, 2.6], [x, 15.1, -55 + i * 4.2], material('#030609'));
    for (let i = 0; i < 5; i++) {
      box(g, 'rear-IO-shell', [20, 18, 23], [-112, 11, -87 + i * 28], metal);
      box(g, 'rear-IO-opening', [0.15, 12, 17], [-122.1, 11, -87 + i * 28], dark);
    }
    cylinder(g, 'CMOS-holder', 13, 4, [5, 4, 110]);
    cylinder(g, 'CMOS-cell', 10, 3.2, [5, 7, 110], metal);
    label(g, 'microATX / VISUAL STUDY', -90, 1.75, 106, 4);
  } else if (id === 'gpu') {
    board(g, 240, 110);
    contacts(g, 82, 85, 53);
    box(g, 'heatsink-base', [210, 4, 83], [0, 6, -2], metal);
    for (let i = 0; i < 40; i++)
      box(g, 'aluminium-fin', [1.4, 17, 80], [-103 + i * 5.2, 15, -2], metal);
    for (const x of [-105, 0, 105]) box(g, 'shroud-bridge', [10, 5, 100], [x, 26, 0], dark);
    for (const z of [-48, 48]) box(g, 'shroud-edge', [220, 5, 5], [0, 26, z], dark);
    fan(g, -53, 30, 0, 90, 10);
    fan(g, 53, 30, 0, 90, 10);
    box(g, 'IO-bracket', [2, 39, 110], [-121, 20, 0], metal);
    for (let i = 0; i < 4; i++) box(g, 'video-port', [2.5, 8, 14], [-122, 18, -35 + i * 23]);
    box(g, 'power-8-pin', [19, 10, 12], [97, 7, -52]);
    label(g, 'GRAPHICS', -25, 39, 0, 4);
  } else if (id === 'nvme') {
    board(g, 80, 22);
    contacts(g, 28, 18, 9);
    for (let i = 0; i < 3; i++)
      box(g, i === 0 ? 'controller' : 'NAND-package', [15, 1.2, 14], [-23 + i * 22, 2.3, 0]);
    label(g, 'M.2 2280', -30, 3, 3, 2);
    passives(g, 70, 18, 8);
  } else if (id === 'satassd') {
    box(g, 'aluminium-enclosure', [100, 7, 69.85], [0, 3.5, 0], material('#263039', 0.7, 0.35));
    box(g, 'product-label', [65, 0.05, 43], [-6, 7.05, 0], white);
    label(g, 'SATA SSD', -32, 7.12, -5, 4, black);
    label(g, '2.5 / VISUAL STUDY', -32, 7.12, 3, 2, black);
    sata(g, -25, 3, 34);
    for (const x of [-44, 44])
      for (const z of [-29, 29]) {
        cylinder(g, 'cover-screw', 1.3, 0.15, [x, 7.1, z]);
        box(g, 'screw-slot', [1.6, 0.06, 0.25], [x, 7.22, z], black);
      }
  } else if (id === 'hdd') {
    box(g, 'cast-base', [147, 7, 101.6], [0, 3.5, 0], material('#697778', 0.65, 0.4));
    for (const x of [-71, 71]) box(g, 'housing-wall', [5, 18, 101.6], [x, 13, 0], metal);
    for (const z of [-48, 48]) box(g, 'housing-wall', [147, 18, 5], [0, 13, z], metal);
    cylinder(g, 'magnetic-platter', 45, 1.3, [-18, 13, 0], material('#a6bcc5', 0.95, 0.15));
    cylinder(g, 'spindle-hub', 12, 5, [-18, 16, 0], metal);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      cylinder(g, 'spindle-screw', 1, 0.15, [-18 + 8 * Math.cos(a), 18.6, 8 * Math.sin(a)], black);
    }
    cylinder(g, 'actuator-pivot', 9, 9, [49, 11, 25]);
    tube(
      g,
      'actuator-arm',
      [
        [49, 16, 25],
        [29, 16, 8],
        [0, 14, -3],
      ],
      3,
      metal,
    );
    box(g, 'head-slider', [4, 1.5, 4], [0, 13.3, -3]);
    box(g, 'voice-coil-block', [22, 8, 19], [48, 11, -2]);
    sata(g, 13, 2, 51);
  } else if (id === 'psu') {
    box(g, 'steel-enclosure', [150, 86, 140], [0, 43, 0], material('#303c43', 0.65, 0.45));
    fan(g, 0, 88, 0, 120, 4);
    for (let i = 0; i < 7; i++) {
      const guard = new Mesh(new TorusGeometry(10 + i * 6, 0.7, 5, 48), metal);
      guard.rotation.x = -Math.PI / 2;
      guard.position.y = 91;
      g.add(guard);
    }
    box(g, 'IEC-input', [28, 21, 2], [42, 35, 71]);
    for (const x of [35, 49]) box(g, 'IEC-contact', [2, 7, 2], [x, 35, 72.2], metal);
    box(g, 'IEC-earth', [2, 7, 2], [42, 41, 72.2], metal);
    box(g, 'power-switch', [13, 19, 2], [11, 35, 71], dark);
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 5; j++)
        box(g, 'rear-vent', [5, 3, 0.2], [-62 + i * 8, 17 + j * 11, 70.1], black);
    for (let i = 0; i < 4; i++) box(g, 'modular-output', [25, 12, 3], [-50 + i * 33, 28, -71]);
    label(g, 'ATX / POWER SUPPLY', -57, 86.1, 61, 4);
  } else if (id === 'fan') {
    fan(g, 0, 13, 0, 120, 25);
  } else if (id === 'cooler') {
    box(g, 'cold-plate', [40, 5, 40], [0, 3, 0], copper);
    for (const x of [-24, -8, 8, 24])
      tube(
        g,
        'heatpipe',
        [
          [x * 0.5, 5, 0],
          [x, 10, -24],
          [x, 130, -24],
          [x, 137, 24],
          [x, 10, 24],
          [x * 0.5, 5, 0],
        ],
        2.8,
        copper,
      );
    for (let i = 0; i < 32; i++) box(g, 'cooling-fin', [90, 0.55, 72], [0, 23 + i * 3, 0], metal);
    fan(g, 0, 135, 0, 90, 18);
    label(g, 'CPU COOLER', -31, 145, 0, 4);
  } else if (id === 'nic' || id === 'wifi') {
    const radio = id === 'wifi';
    board(g, radio ? 80 : 100, radio ? 55 : 65);
    contacts(g, 18, 23, radio ? 26 : 31);
    passives(g, radio ? 70 : 90, 45, 16);
    box(
      g,
      radio ? 'RF-shield' : 'Ethernet-controller',
      [radio ? 26 : 18, radio ? 3 : 2, radio ? 25 : 18],
      [0, radio ? 3.2 : 2.6, 0],
      radio ? metal : black,
    );
    box(g, 'metal-bracket', [2, 20, 80], [radio ? -41 : -51, 10, 0], metal);
    if (radio)
      for (const z of [-18, 18]) {
        cylinder(g, 'antenna-connector', 3, 7, [-45, 8, z], gold).rotation.z = Math.PI / 2;
        tube(
          g,
          'coax',
          [
            [-42, 6, z],
            [-30, 6, z],
            [-12, 5, z / 2],
          ],
          0.4,
          black,
        );
        tube(
          g,
          'external-antenna',
          [
            [-48, 8, z],
            [-55, 12, z],
            [-55, 62, z],
          ],
          2.2,
          dark,
        );
      }
    else {
      box(g, 'RJ45-shell', [20, 16, 16], [-43, 10, 0], metal);
      box(g, 'RJ45-socket', [0.2, 10, 12], [-53.1, 10, 0]);
      for (let i = 0; i < 8; i++)
        box(g, 'RJ45-contact', [0.2, 1, 0.6], [-53.3, 14, -4.2 + i * 1.2], gold);
    }
    label(g, radio ? 'WIRELESS' : 'ETHERNET', -16, radio ? 4.8 : 3.7, 3, 2, radio ? black : white);
  } else if (id === 'satacable') {
    for (let i = 0; i < 4; i++)
      tube(
        g,
        'ribbon-conductor',
        [
          [-50, 5, -20],
          [-20, 5, -15 + i],
          [0, 8, 8 + i],
          [25, 5, 18 + i],
          [50, 5, 20],
        ],
        0.85,
        material('#b63536'),
      );
    for (const sign of [-1, 1]) {
      const x = sign * 53,
        z = sign * 20;
      box(g, 'SATA-plug', [14, 5, 9], [x, 5, z]);
      box(g, 'L-key', [1, 1, 6], [x - 5.5, 7.6, z]);
      for (let i = 0; i < 7; i++)
        box(g, 'contact', [0.5, 0.1, 3], [x - 4.2 + i * 1.4, 7.6, z], gold);
    }
  } else if (id === 'atxcable') {
    for (const end of [-1, 1]) {
      box(g, '24-pin-housing', [51, 12, 14], [end * 55, 8, end * 15]);
      box(g, 'locking-latch', [8, 4, 3], [end * 55, 15, end * 15 + 8]);
      for (let i = 0; i < 12; i++)
        for (let row = 0; row < 2; row++) {
          const x = end * 55 + (i - 5.5) * 4.2,
            z = end * 15 + (row - 0.5) * 5;
          box(g, 'pin-cavity', [2.8, 0.2, 2.8], [x, 14.1, z], material('#030405'));
          box(g, 'pin-contact', [1.2, 0.25, 1.2], [x, 14.25, z], gold);
        }
    }
    const colors = ['#d9b547', '#b73730', '#1c2024', '#d27b33'];
    for (let i = 0; i < 24; i++) {
      const offset = ((i % 12) - 5.5) * 1.2;
      tube(
        g,
        `wire-${i + 1}`,
        [
          [-55 + ((i % 12) - 5.5) * 4.2, 5, -15 + (Math.floor(i / 12) - 0.5) * 5],
          [-20, 5 + Math.floor(i / 12) * 2, offset],
          [20, 5 + Math.floor(i / 12) * 2, offset + 8],
          [55 + ((i % 12) - 5.5) * 4.2, 5, 15 + (Math.floor(i / 12) - 0.5) * 5],
        ],
        0.55,
        material(colors[i % 4]),
      );
    }
  } else if (id === 'coinbattery') {
    cylinder(g, 'negative-can', 10, 2.8, [0, 1.4, 0], metal);
    cylinder(g, 'insulating-gasket', 10.05, 0.2, [0, 2.85, 0], black);
    cylinder(g, 'positive-cap', 9.8, 0.3, [0, 3.05, 0], metal);
    label(g, 'CR2032', -7, 3.22, -1, 2, black);
    label(g, '3V  +', -4, 3.22, 3, 1.8, black);
  } else throw Error(`No computer geometry for ${id}`);
  return g;
}
