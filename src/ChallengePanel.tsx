import { useState } from 'react';
import { challenges, evaluateChallenge, type ChallengeId } from './challenges';
import type { Project } from './engine';
export default function ChallengePanel({
  id,
  project,
  onReset,
  onClose,
}: {
  id: ChallengeId;
  project: Project;
  onReset: () => void;
  onClose: () => void;
}) {
  const challenge = challenges.find((c) => c.id === id)!;
  const [hint, setHint] = useState(false),
    [feedback, setFeedback] = useState('');
  return (
    <section className="challenge-panel" aria-label="Desafio ativo">
      <span className="eyebrow">INVESTIGAÇÃO PRÁTICA</span>
      <h3>{challenge.title}</h3>
      <p>{challenge.goal}</p>
      <button
        onClick={() => {
          const result = evaluateChallenge(id, project);
          setFeedback(result.feedback);
          if (result.passed) {
            try {
              const raw = JSON.parse(localStorage.getItem('eletronic-lab.challenges.v1') ?? '[]');
              const ids = Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
              localStorage.setItem(
                'eletronic-lab.challenges.v1',
                JSON.stringify([...new Set([...ids, id])]),
              );
            } catch {
              setFeedback(result.feedback + ' O progresso não pôde ser salvo.');
            }
          }
        }}
      >
        Verificar montagem
      </button>
      <button onClick={() => setHint((v) => !v)}>Dica</button>
      <button
        onClick={() => {
          onReset();
          setFeedback('');
        }}
      >
        Reiniciar desafio
      </button>
      <button onClick={onClose}>Sair do desafio</button>
      {hint && <p>{challenge.hint}</p>}
      {feedback && <p role="status">{feedback}</p>}
    </section>
  );
}
