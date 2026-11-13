import Modal from './Modal';
export const toolKeys: Record<string, string> = {
  Selecionar: 'V',
  Mover: 'M',
  'Girar 90°': 'R',
  'Conectar terminais': 'W',
  Excluir: 'X',
  Desfazer: 'Ctrl+Z',
  Refazer: 'Ctrl+Shift+Z',
};
export default function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const entries = [
    ['V / M / R / W / X', 'Selecionar, mover, girar, conectar ou excluir'],
    ['1 / 2 / 3', 'Perspectiva, superior ou esquema'],
    ['B / P / I', 'Biblioteca, inspeção ou instrumentos'],
    ['F', 'Ampliar a bancada / restaurar painéis'],
    ['L / N', 'Referências ou tensões dos nós'],
    ['Espaço', 'Executar / pausar a simulação'],
    ['Ctrl/⌘ + S', 'Salvar projeto'],
    ['Ctrl/⌘ + Z', 'Desfazer'],
    ['Ctrl/⌘ + Shift + Z', 'Refazer'],
    ['Delete', 'Excluir a seleção'],
    ['?', 'Abrir esta ajuda'],
    ['Escape', 'Fechar janela ou cancelar conexão'],
  ];
  return (
    <Modal label="Atalhos de teclado" className="keyboard-help" onClose={onClose}>
      <div className="panel-heading">
        <h2>Atalhos de teclado</h2>
        <button onClick={onClose} aria-label="Fechar atalhos">
          Fechar
        </button>
      </div>
      <p>Na bancada. Ao escrever em um campo, as teclas continuam editando o texto.</p>
      <dl>
        {entries.map(([key, text]) => (
          <div key={key}>
            <dt>
              <kbd>{key}</kbd>
            </dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <p>
        No atlas: ← / → troca o modelo filtrado; 1–4 troca a vista; Espaço ativa o giro; Escape
        volta à bancada.
      </p>
    </Modal>
  );
}
