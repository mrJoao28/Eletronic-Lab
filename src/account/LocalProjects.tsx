import { useState } from 'react';
import { ArrowUpRight, CircuitBoard, Plus, Search } from 'lucide-react';
import { readShelf, type SavedProject } from '../projectShelf';
import { example } from '../examples';
import type { Project } from '../engine';
export default function LocalProjects({
  onOpen,
  onNew,
  onLogin,
  onResume,
}: {
  onOpen: (entry: SavedProject) => void;
  onNew: (project: Project) => void;
  onLogin: () => void;
  onResume?: () => void;
}) {
  const [search, setSearch] = useState('');
  const [result] = useState(() => {
    try {
      return {
        entries: readShelf(
          localStorage.getItem('eletronic-lab.shelf.v1'),
          localStorage.getItem('eletronic-lab.project.v1'),
        ).entries,
        error: '',
      };
    } catch {
      return {
        entries: [],
        error: 'Não foi possível ler os projetos locais. Seus dados foram preservados.',
      };
    }
  });
  const entries = result.entries.filter(
    (e) => !e.archived && e.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <main className="dashboard-main local-projects">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">ELETRONIC LAB · VISITANTE</span>
          <h1>Meus projetos</h1>
          <p>Montagens salvas neste navegador.</p>
        </div>
        <button onClick={onLogin}>Entrar na conta</button>
        {onResume && <button onClick={onResume}>Continuar montagem</button>}
      </header>
      <section className="dashboard-start">
        <h2>Novo projeto</h2>
        <div>
          <button onClick={() => onNew(example('rc'))}>
            <Plus size={20} />
            Circuito analógico
            <ArrowUpRight size={16} />
          </button>
          <button onClick={() => onNew(example('adder'))}>
            <Plus size={20} />
            Circuito digital
            <ArrowUpRight size={16} />
          </button>
        </div>
      </section>
      <section className="dashboard-projects" aria-label="Projetos neste navegador">
        <div className="dashboard-filters">
          <label>
            <Search size={16} />
            <input
              aria-label="Buscar projetos locais"
              placeholder="Buscar projetos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {result.error && <p role="alert">{result.error}</p>}
        {!entries.length && (
          <div className="dashboard-empty">
            <CircuitBoard size={30} />
            <h2>{search ? 'Nenhum projeto encontrado' : 'Nenhuma montagem salva'}</h2>
            <p>
              Escolha um novo projeto para começar. Use Salvar projeto na bancada para encontrá-lo
              aqui.
            </p>
          </div>
        )}
        <div className="project-grid">
          {entries.map((entry) => (
            <article className="project-card" key={entry.id}>
              <button
                className="project-preview"
                aria-label={`Abrir projeto ${entry.name}`}
                onClick={() => onOpen(entry)}
              >
                <CircuitBoard size={58} />
                <span>{entry.project.experiment === 'rc' ? 'ANALÓGICO' : 'DIGITAL'}</span>
                <b>
                  {entry.project.parts.length} componentes · {entry.project.wires.length} conexões
                </b>
              </button>
              <div className="project-card-body">
                <button className="project-card-title" onClick={() => onOpen(entry)}>
                  {entry.name}
                </button>
                <p>Editado {new Date(entry.updated).toLocaleDateString('pt-BR')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
