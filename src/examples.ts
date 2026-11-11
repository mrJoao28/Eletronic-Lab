import { INPUT_NAMES, type Part, type Project, type Wire } from './engine';
const part = (
  id: string,
  kind: Part['kind'],
  ref: string,
  position: Part['position'],
  value = 0,
): Part => ({ id, kind, ref, position, rotation: 0, value });
export function example(mode: 'rc' | 'adder'): Project {
  let n = 0;
  const wires: Wire[] = [];
  const wire = (from: string, to: string, color = '#e5ae56') =>
    wires.push({ id: `w${++n}`, from, to, color });
  const parts: Part[] = [
    part('bb', 'board', 'BB1', [0, 0, 0]),
    part('ps', 'source', 'V1', [-64, 0, -12], 5),
    part('gnd', 'ground', 'GND', [-48, 0, 23]),
  ];
  wire('ps:-', 'gnd:0', '#64758c');
  wire('ps:-', 'bb:N1', '#64758c');
  wire('ps:+', 'bb:P1', '#e78868');
  if (mode === 'rc') {
    parts.push(
      part('r1', 'resistor', 'R1', [-16.51, 0, -10.16], 10000),
      part('c1', 'capacitor', 'C1', [7.62, 0, 7.62], 100e-6),
    );
    wire('bb:P4', 'bb:a7', '#e78868');
    // R1 leads are physically inserted at c7 and c11 (10.16 mm apart).
    wire('bb:e11', 'c1:+');
    wire('c1:-', 'bb:N20', '#64758c');
    return {
      version: 1,
      name: 'Carga e descarga de um capacitor',
      experiment: mode,
      parts,
      wires,
      probes: { positive: 'c1:+', negative: 'gnd:0' },
      digitalProbes: [],
    };
  }
  parts.push(part('u1', 'adder', 'U1', [5.08, 0, -1.27]), {
    ...part('in', 'inputs', 'SW1', [0, 0, 37]),
    bits: 53,
  });
  wire('bb:P24', 'u1:16', '#e78868');
  wire('bb:N24', 'u1:8', '#64758c');
  wire('bb:P20', 'in:VCC', '#e78868');
  wire('bb:N20', 'in:GND', '#64758c');
  [5, 3, 14, 12, 6, 2, 15, 11, 7].forEach((pin, i) =>
    wire(`in:${INPUT_NAMES[i]}`, `u1:${pin}`, i < 4 ? '#79b8a4' : i < 8 ? '#7d9fc4' : '#e5ae56'),
  );
  return {
    version: 1,
    name: 'Somador binário de 4 bits',
    experiment: mode,
    parts,
    wires,
    probes: { positive: 'u1:4', negative: 'gnd:0' },
    digitalProbes: [4, 1, 13, 10, 9].map((n) => `u1:${n}`),
  };
}
