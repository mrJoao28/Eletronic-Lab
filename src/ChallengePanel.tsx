import { useState } from 'react';
import { challenges, evaluateChallenge, type ChallengeId } from './challenges';
import type { Project } from './engine';
export default function ChallengePanel({
  id,
  project,
  onReset,
  onClose,
  storageScope,
  onComplete,
}: {
  id: ChallengeId;
  project: Project;
  onReset: () => void;
  onClose: () => void;
  storageScope?: string;
  onComplete?: (id: ChallengeId) => Promise<void>;
}) {
  const progressKey = storageScope
    ? `eletronic-lab.${storageScope}.challenges.v1`
    : 'eletronic-lab.challenges.v1';
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
          if (result.passed && onComplete) {
            void onComplete(id).catch(() =>
              setFeedback(result.feedback + ' O progresso não pôde ser salvo na conta.'),
            );
          } else if (result.passed) {
            try {
              const raw = JSON.parse(localStorage.getItem(progressKey) ?? '[]');
              const ids = Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
              localStorage.setItem(progressKey, JSON.stringify([...new Set([...ids, id])]));
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
