import Modal from './Modal';
import { definitions, type Project } from './engine';
export default function ExtendedGuide({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} className="guide" label="Guia do experimento">
      <button className="quiet-button" aria-label="Fechar guia" onClick={onClose}>
        Fechar guia
      </button>
      <span className="eyebrow">MONTAGEM ANALÓGICA</span>
      <h2>{project.name}</h2>
      <p>
        Use o multímetro para comparar potenciais e o osciloscópio para acompanhar mudanças.
        Componentes inseridos nos mesmos grupos da protoboard compartilham um nó elétrico. Abra
        Esquema para conferir a montagem efetiva.
      </p>
      <h3>Materiais e modelos</h3>
      <table>
        <thead>
          <tr>
            <th>Referência</th>
            <th>Componente</th>
            <th>Condições</th>
          </tr>
        </thead>
        <tbody>
          {project.parts
            .filter((p) => p.kind !== 'ground')
            .map((p) => (
              <tr key={p.id}>
                <td>{p.ref}</td>
                <td>{definitions[p.kind].name}</td>
                <td>{definitions[p.kind].limit}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <h3>Da simulação à bancada</h3>
      <p>
        Os modelos são didáticos. Confira pinagem, polaridade, potência e código de compra no
        datasheet. O transistor representa somente uma chave aproximada; LEDs devem ter resistor de
        limitação. Vários capacitores usam integração numérica backward Euler com passos internos de
        até 1 ms no avanço normal de 50 ms.
      </p>
      <p>
        Resistência e continuidade exigem fonte desligada e rede apenas resistiva. O instrumento
        virtual não modela carga, fusíveis ou modos de corrente.
      </p>
      <p>
        <a
          href="https://www.kingbrightusa.com/images/catalog/SPEC/WP7113ID.pdf"
          target="_blank"
          rel="noreferrer"
        >
          LED Kingbright
        </a>{' '}
        ·{' '}
        <a href="https://www.vishay.com/docs/81857/1n4148.pdf" target="_blank" rel="noreferrer">
          1N4148
        </a>{' '}
        ·{' '}
        <a
          href="https://www.onsemi.com/pdf/datasheet/2n3904-d.pdf"
          target="_blank"
          rel="noreferrer"
        >
          2N3904
        </a>
      </p>
      <h3>Conexões editadas</h3>
      <div className="guide-nets">
        {project.wires.map((w) => (
          <div key={w.id}>
            <code>{w.from}</code> ↔ <code>{w.to}</code>
          </div>
        ))}
      </div>
    </Modal>
  );
}
