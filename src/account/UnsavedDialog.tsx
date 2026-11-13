import { useEffect, useRef } from 'react';
export default function UnsavedDialog({
  reason,
  onKeep,
  onDiscard,
}: {
  reason: string;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="unsaved-dialog"
      aria-labelledby="unsaved-title"
      onCancel={(event) => {
        event.preventDefault();
        onKeep();
      }}
    >
      <span className="eyebrow">MONTAGEM EM ANDAMENTO</span>
      <h2 id="unsaved-title">Alterações não salvas</h2>
      <p>
        Você está prestes a {reason}. A montagem atual tem alterações que ainda não foram salvas.
      </p>
      <p>Escolha manter a montagem para voltar e salvá-la.</p>
      <div>
        <button autoFocus className="account-primary" onClick={onKeep}>
          Manter montagem
        </button>
        <button className="discard-draft" onClick={onDiscard}>
          Descartar e continuar
        </button>
      </div>
    </dialog>
  );
}
