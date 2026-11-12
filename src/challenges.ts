import { electronicsExample } from './electronicsExamples';
import { example } from './examples';
import { simulate, type Project } from './engine';
export const challenges = [
  {
    id: 'switch',
    title: 'Por que o LED não acende?',
    goal: 'Faça circular entre 5 e 20 mA pelo LED acionando a chave correta.',
    hint: 'Inspecione SW1 e confira se existe um caminho fechado entre a fonte e o terra.',
  },
  {
    id: 'current',
    title: 'Limite a corrente do LED',
    goal: 'Ajuste o circuito para manter a corrente entre 5 e 15 mA.',
    hint: 'Aumente R1. Como estimativa inicial, R ≈ (5 − 1,9) / I.',
  },
  {
    id: 'rc-open',
    title: 'Recupere a carga do capacitor',
    goal: 'Encontre a ligação interrompida. A montagem deve carregar C1 para aproximadamente 3,16 V após 1 s.',
    hint: 'R1 está inserido em c7/c11. Verifique a ligação entre o trilho positivo e a coluna 7.',
  },
  {
    id: 'adder-input',
    title: 'Elimine o estado X',
    goal: 'Defina todas as entradas do somador e obtenha 5 + 3 = 8.',
    hint: 'Confira a entrada A1, pino 5 do CD74HC283, e sua conexão ao banco de entradas.',
  },
] as const;
export type ChallengeId = (typeof challenges)[number]['id'];
export function challengeProject(id: ChallengeId): Project {
  let p: Project;
  if (id === 'switch' || id === 'current') {
    p = electronicsExample('led');
    if (id === 'switch') p.parts.find((c) => c.id === 'sw')!.bits = 0;
    else p.parts.find((c) => c.id === 'r1')!.value = 100;
  } else if (id === 'rc-open') {
    p = example('rc');
    p.wires = p.wires.filter((w) => w.to !== 'bb:a7');
  } else {
    p = example('adder');
    p.wires = p.wires.filter((w) => w.to !== 'u1:5');
  }
  p.name = `Desafio: ${challenges.find((c) => c.id === id)!.title}`;
  return p;
}
export function evaluateChallenge(
  id: ChallengeId,
  p: Project,
): { passed: boolean; feedback: string } {
  const r = simulate(p, 0, id === 'rc-open' ? 1 : 0);
  let passed = false;
  if (id === 'switch' || id === 'current') {
    const current = r.currents.led ?? 0;
    passed =
      Number.isFinite(current) &&
      current >= 0.005 &&
      current <= (id === 'current' ? 0.015 : 0.02) &&
      r.issues.length === 0;
  } else if (id === 'rc-open')
    passed =
      r.issues.length === 0 &&
      Math.abs(r.capacitor - 5 * (1 - Math.exp(-1))) < 0.03 &&
      r.tau !== null;
  else passed = r.issues.length === 0 && r.sum === 8 && r.carry === 0;
  return {
    passed,
    feedback: passed
      ? 'Objetivo atingido pela simulação da sua montagem.'
      : 'Objetivo ainda não atingido. Use os instrumentos, o esquema e o diagnóstico para testar sua hipótese.',
  };
}
