import type { Diagnostic } from './diagnostics';
export default function DiagnosticsPanel({
  items,
  onSelect,
}: {
  items: Diagnostic[];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="diagnostics-panel" aria-label="Diagnóstico do circuito">
      <h3>
        DIAGNÓSTICO <span>{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="diagnostic-clear">Nenhum problema detectado pelos modelos disponíveis.</p>
      ) : (
        items.map((item) => (
          <details key={item.id} className={`diagnostic ${item.severity}`}>
            <summary>
              {item.severity === 'error'
                ? 'Erro'
                : item.severity === 'warning'
                  ? 'Atenção'
                  : 'Informação'}{' '}
              · {item.title}
            </summary>
            <p>{item.detail}</p>
            {item.terminals.length > 0 && <code>{item.terminals.join(' · ')}</code>}
            {item.parts.map((id) => (
              <button key={id} onClick={() => onSelect(id)}>
                Inspecionar {id}
              </button>
            ))}
          </details>
        ))
      )}
    </section>
  );
}
