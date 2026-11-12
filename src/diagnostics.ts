import { netlist, type Project, type Reading } from './engine';
export interface Diagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  detail: string;
  parts: string[];
  terminals: string[];
}
export function diagnose(p: Project, r: Reading): Diagnostic[] {
  const items: Diagnostic[] = [],
    net = netlist(p);
  const add = (
    id: string,
    severity: Diagnostic['severity'],
    title: string,
    detail: string,
    parts: string[],
    terminals: string[] = [],
  ) => items.push({ id, severity, title, detail, parts, terminals });
  for (const part of p.parts) {
    const v = (pin: string) => r.voltages[`${part.id}:${pin}`];
    if (part.kind === 'source' && net.node(`${part.id}:+`) === net.node(`${part.id}:-`))
      add(
        `short-${part.id}`,
        'error',
        `${part.ref}: saída em curto`,
        'Separe os polos positivo e negativo. Uma fonte real pode limitar corrente ou aquecer.',
        [part.id],
        [`${part.id}:+`, `${part.id}:-`],
      );
    if (part.kind === 'led' || part.kind === 'diode') {
      const a = v('A'),
        k = v('K');
      if (a !== undefined && k !== undefined && a < k - 0.1)
        add(
          `reverse-${part.id}`,
          'warning',
          `${part.ref}: polaridade reversa`,
          'A é o ânodo; K é o cátodo. Inverta a peça se deseja condução direta. O modelo não simula ruptura reversa.',
          [part.id],
          [`${part.id}:A`, `${part.id}:K`],
        );
      if (part.kind === 'led' && (r.currents[part.id] ?? 0) > 0.02)
        add(
          `led-current-${part.id}`,
          'error',
          `${part.ref}: corrente acima de 20 mA`,
          'Use um resistor em série maior. O brilho virtual não garante operação física segura.',
          [part.id],
        );
    }
    if (part.kind === 'resistor') {
      const power = (r.currents[part.id] ?? 0) ** 2 * part.value;
      if (power > 0.25)
        add(
          `power-${part.id}`,
          'warning',
          `${part.ref}: dissipação elevada`,
          `${power.toFixed(3)} W no modelo ideal. Confira a potência nominal do componente físico.`,
          [part.id],
        );
    }
    if (part.kind === 'capacitor' && (v('+') ?? 0) - (v('-') ?? 0) < -0.01)
      add(
        `cap-reverse-${part.id}`,
        'error',
        `${part.ref}: capacitor invertido`,
        'O terminal + deve ficar no potencial mais alto. Não reproduza esta ligação com um eletrolítico real.',
        [part.id],
        [`${part.id}:+`, `${part.id}:-`],
      );
    if (part.kind === 'adder') {
      const floating = [5, 3, 14, 12, 6, 2, 15, 11, 7]
        .map((pin) => `${part.id}:${pin}`)
        .filter((t) => r.digital[t] === 'X');
      if (floating.length)
        add(
          `inputs-${part.id}`,
          'warning',
          `${part.ref}: entradas indefinidas`,
          'Conecte cada entrada a um nível lógico definido. Verifique também alimentação e conflitos.',
          [part.id],
          floating,
        );
    }
  }
  r.issues.forEach((message, i) => {
    const parts = p.parts
      .filter((part) => message.includes(`${part.id}:`) || message.startsWith(`${part.ref}:`))
      .map((part) => part.id);
    add(
      `engine-${i}`,
      message.includes('Conflito') || message.includes('singular') || message.includes('convergiu')
        ? 'error'
        : 'warning',
      message,
      'Revise os terminais e as condições suportadas indicadas na inspeção.',
      parts,
    );
  });
  return items;
}
