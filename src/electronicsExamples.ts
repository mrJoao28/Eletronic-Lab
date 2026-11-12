import type { Part, Project, Wire } from './engine';
export type ElectronicsPreset = 'led' | 'transistor' | 'divider' | 'double-rc';
export function electronicsExample(preset: ElectronicsPreset): Project {
  const parts: Part[] = [
    { id: 'ps', kind: 'source', ref: 'V1', position: [-64, 0, -12], rotation: 0, value: 5 },
    { id: 'gnd', kind: 'ground', ref: 'GND', position: [-48, 0, 23], rotation: 0, value: 0 },
    { id: 'bb', kind: 'board', ref: 'BB1', position: [0, 0, 0], rotation: 0, value: 0 },
  ];
  const wires: Wire[] = [];
  const wire = (from: string, to: string) =>
    wires.push({ id: `w${wires.length}`, from, to, color: '#d9ad62' });
  const part = (
    id: string,
    kind: Part['kind'],
    ref: string,
    x: number,
    z: number,
    value = 0,
    extra: Partial<Part> = {},
  ) => parts.push({ id, kind, ref, position: [x, 0, z], rotation: 0, value, ...extra });
  wire('ps:-', 'gnd:0');
  let positive = 'led:A';
  if (preset === 'led' || preset === 'transistor') {
    part('r1', 'resistor', 'R1', -18, -8, 330);
    part('led', 'led', 'D1', 12, 0);
    wire('ps:+', 'r1:1');
    wire('r1:2', 'led:A');
    if (preset === 'led') {
      part('sw', 'button', 'SW1', -10, 18, 0, { bits: 1 });
      wire('led:K', 'sw:1');
      wire('sw:2', 'gnd:0');
    } else {
      part('q1', 'transistor', 'Q1', 20, 17);
      part('rb', 'resistor', 'R2', -20, 17, 10000);
      part('sw', 'button', 'SW1', -38, 18, 0, { bits: 1 });
      wire('led:K', 'q1:C');
      wire('q1:E', 'gnd:0');
      wire('ps:+', 'sw:1');
      wire('sw:2', 'rb:1');
      wire('rb:2', 'q1:B');
      positive = 'q1:C';
    }
  } else if (preset === 'divider') {
    part('rv', 'potentiometer', 'RV1', 0, 0, 10000, { ratio: 0.5 });
    wire('ps:+', 'rv:A');
    wire('rv:B', 'gnd:0');
    positive = 'rv:W';
  } else {
    part('r1', 'resistor', 'R1', -18, -8, 10000);
    part('r2', 'resistor', 'R2', -18, 8, 20000);
    part('c1', 'capacitor', 'C1', 10, -10, 100e-6);
    part('c2', 'capacitor', 'C2', 10, 10, 100e-6);
    for (const i of [1, 2]) {
      wire('ps:+', `r${i}:1`);
      wire(`r${i}:2`, `c${i}:+`);
      wire(`c${i}:-`, 'gnd:0');
    }
    positive = 'c1:+';
  }
  return {
    version: 1,
    name: {
      led: 'LED com botão e resistor de 330 Ω',
      transistor: 'LED controlado por chave NPN',
      divider: 'Divisor com potenciômetro',
      'double-rc': 'Dois capacitores independentes',
    }[preset],
    experiment: 'rc',
    parts,
    wires,
    probes: { positive, negative: 'gnd:0' },
    digitalProbes: [],
  };
}
