import { describe, it, expect } from 'vitest';
import { readShelf, saveToShelf } from './projectShelf';
import { example } from './examples';
import { challengeProject, evaluateChallenge } from './challenges';
import { electronicsExample } from './electronicsExamples';
describe('Acervo de montagens', () => {
  it('migra o salvo legado sem apagar dados', () => {
    const p = example('rc'),
      s = readShelf(null, JSON.stringify(p));
    expect(s.entries[0].project).toEqual(p);
    expect(readShelf(JSON.stringify(s))).toEqual(s);
  });
  it('preserva vários projetos e atualiza somente o ID escolhido', () => {
    let a = saveToShelf(readShelf(null), example('rc'));
    let b = saveToShelf(a.shelf, example('adder'));
    const p = example('rc');
    p.name = 'RC revisado';
    const c = saveToShelf(b.shelf, p, a.id);
    expect(c.shelf.entries).toHaveLength(2);
    expect(c.shelf.entries.find((e) => e.id === a.id)!.name).toBe(p.name);
    expect(c.shelf.entries.find((e) => e.id === b.id)!.project.experiment).toBe('adder');
  });
  it('rejeita acervos corrompidos e projetos inválidos', () => {
    expect(() => readShelf('{')).toThrow();
    expect(() => readShelf('{"version":2,"entries":[]}')).toThrow();
  });
});
describe('Desafios avaliados pela montagem', () => {
  it('rejeita cada falha inicial e reconhece uma correção funcional', () => {
    for (const id of ['switch', 'current', 'rc-open', 'adder-input'] as const) {
      expect(evaluateChallenge(id, challengeProject(id)).passed).toBe(false);
      const fixed =
        id === 'switch' || id === 'current'
          ? electronicsExample('led')
          : example(id === 'rc-open' ? 'rc' : 'adder');
      expect(evaluateChallenge(id, fixed).passed).toBe(true);
    }
  });
});
