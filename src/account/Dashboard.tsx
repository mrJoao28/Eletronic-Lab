import ProjectPreview from './ProjectPreview';
import { useEffect, useRef, useState } from 'react';
import {
  CircuitBoard,
  LayoutDashboard,
  FolderOpen,
  Trophy,
  UserRound,
  LogOut,
  Plus,
  ArrowUpRight,
  Archive,
  RotateCcw,
  Search,
  Upload,
  Cpu,
  Zap,
} from 'lucide-react';
import {
  listProjects,
  archiveProject,
  getProgress,
  saveProject,
  type CloudProject,
} from './projects';
import { challenges, type ChallengeId } from '../challenges';
import { example } from '../examples';
import { readShelf } from '../projectShelf';
import type { Project } from '../engine';
export default function Dashboard({
  userId,
  email,
  onOpen,
  onNew,
  onChallenge,
  onLogout,
  onPassword,
  onResume,
}: {
  userId: string;
  email: string;
  onOpen: (project: CloudProject) => void;
  onNew: (project: Project) => void;
  onChallenge: (id: ChallengeId) => void;
  onLogout: () => Promise<void>;
  onPassword: () => void;
  onResume?: () => void;
}) {
  const [section, setSection] = useState('projects');
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [progress, setProgress] = useState<ChallengeId[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('active');
  const [renaming, setRenaming] = useState(''),
    [name, setName] = useState('');
  const request = useRef(0);
  async function refresh() {
    const generation = ++request.current;
    setLoading(true);
    setError('');
    try {
      const [rows, done] = await Promise.all([listProjects(userId), getProgress(userId)]);
      if (generation === request.current) {
        setProjects(rows);
        setProgress(done);
      }
    } catch (err) {
      if (generation === request.current)
        setError(err instanceof Error ? err.message : 'Falha de conexão.');
    } finally {
      if (generation === request.current) setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    return () => {
      request.current++;
    };
  }, [userId]);
  async function action(operation: () => Promise<void>, refreshAfter = true) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await operation();
      if (refreshAfter) await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setBusy(false);
    }
  }
  const active = projects.filter((p) => !p.archived);
  const visible = projects.filter(
    (p) =>
      (filter === 'archived' ? p.archived : !p.archived) &&
      (filter === 'rc'
        ? p.project.experiment === 'rc'
        : filter === 'adder'
          ? p.project.experiment === 'adder'
          : true) &&
      p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const navigation = [
    ['overview', 'Visão geral', LayoutDashboard],
    ['projects', 'Projetos', FolderOpen],
    ['challenges', 'Desafios', Trophy],
    ['account', 'Conta', UserRound],
  ] as const;
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-nav">
        <a className="dashboard-brand" href="#dashboard">
          <CircuitBoard size={25} />
          <span>
            eletronic<b>lab</b>
          </span>
        </a>
        <span className="eyebrow">LABORATÓRIO PESSOAL</span>
        <nav aria-label="Seções da conta">
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => {
                setSection(id);
                setError('');
              }}
            >
              <Icon size={17} />
              {label}
              {id === 'projects' && <small>{active.length}</small>}
            </button>
          ))}
        </nav>
        <button className="dashboard-new" onClick={() => onNew(example('rc'))}>
          <Plus size={17} />
          Novo projeto
        </button>
        <div className="dashboard-identity">
          <span>{email[0]?.toUpperCase() ?? 'U'}</span>
          <div>
            <b>Minha conta</b>
            <small>{email}</small>
          </div>
        </div>
        <button
          className="dashboard-signout"
          disabled={busy}
          onClick={() => void action(onLogout, false)}
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">ELETRONIC LAB</span>
            <h1>
              {section === 'overview'
                ? 'Seu laboratório'
                : navigation.find((n) => n[0] === section)?.[1]}
            </h1>
          </div>
          {onResume && (
            <button className="dashboard-resume" onClick={onResume}>
              Continuar montagem
            </button>
          )}
          <button className="account-primary" onClick={() => onNew(example('rc'))}>
            <Plus size={16} />
            Novo projeto
          </button>
        </header>
        {error && (
          <div className="account-error" role="alert">
            {error}
            <button onClick={() => void refresh()}>Tentar novamente</button>
          </div>
        )}
        {notice && (
          <p className="account-message" role="status">
            {notice}
          </p>
        )}
        {loading && (
          <p className="dashboard-loading" role="status">
            Carregando sua área de trabalho…
          </p>
        )}
        {section === 'overview' && (
          <>
            <div className="dashboard-stats">
              <div>
                <FolderOpen size={18} />
                <strong>{active.length}</strong>
                <span>Projetos ativos</span>
              </div>
              <div>
                <CircuitBoard size={18} />
                <strong>{active.reduce((total, p) => total + p.project.parts.length, 0)}</strong>
                <span>Componentes nas montagens</span>
              </div>
              <div>
                <Trophy size={18} />
                <strong>
                  {progress.length}
                  <small> / {challenges.length}</small>
                </strong>
                <span>Desafios concluídos</span>
              </div>
            </div>
            <section className="dashboard-start">
              <h2>Começar uma montagem</h2>
              <div>
                <button onClick={() => onNew(example('rc'))}>
                  <Zap size={20} />
                  <span>
                    Circuito analógico<small>Fonte, resistor e capacitor</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
                <button onClick={() => onNew(example('adder'))}>
                  <Cpu size={20} />
                  <span>
                    Circuito digital<small>Somador de 4 bits</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </section>
          </>
        )}
        {(section === 'overview' || section === 'projects') && (
          <section className="dashboard-projects" aria-label="Meus projetos">
            <div className="dashboard-section-title">
              <h2>{section === 'overview' ? 'Projetos recentes' : 'Meus projetos'}</h2>
              <button
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    const shelf = readShelf(
                      localStorage.getItem('eletronic-lab.shelf.v1'),
                      localStorage.getItem('eletronic-lab.project.v1'),
                    );
                    const imported: CloudProject[] = [];
                    for (const entry of shelf.entries.filter((e) => !e.archived))
                      imported.push(await saveProject(userId, entry.project));
                    setNotice(`${imported.length} projeto(s) importado(s) para esta conta.`);
                  })
                }
              >
                <Upload size={14} />
                Importar projetos locais
              </button>
            </div>
            <div className="dashboard-filters">
              <label>
                <Search size={15} />
                <input
                  aria-label="Buscar meus projetos"
                  placeholder="Buscar projetos"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select
                aria-label="Filtrar projetos"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="active">Ativos</option>
                <option value="rc">Analógicos</option>
                <option value="adder">Digitais</option>
                <option value="archived">Arquivados</option>
              </select>
            </div>
            {!loading && !visible.length && (
              <div className="dashboard-empty">
                <CircuitBoard size={30} />
                <h3>
                  {search
                    ? 'Nenhum projeto encontrado'
                    : filter === 'archived'
                      ? 'Nenhum projeto arquivado'
                      : 'Nenhum projeto salvo'}
                </h3>
                <p>
                  {search ? 'Tente outro nome.' : 'Crie um projeto ou importe uma montagem local.'}
                </p>
              </div>
            )}
            <div className="project-grid">
              {(section === 'overview' ? visible.slice(0, 6) : visible).map((row) => (
                <article className="project-card" key={row.id}>
                  <button
                    className="project-preview"
                    aria-label={`Abrir projeto ${row.name}`}
                    onClick={() => onOpen(row)}
                  >
                    <ProjectPreview project={row.project} />
                    <span>{row.project.experiment === 'rc' ? 'ANALÓGICO' : 'DIGITAL'}</span>
                    <b>
                      {row.project.parts.length} componentes · {row.project.wires.length} conexões
                    </b>
                    <ArrowUpRight size={17} />
                  </button>
                  <div className="project-card-body">
                    {renaming === row.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void action(async () => {
                            await saveProject(
                              userId,
                              { ...row.project, name: name.trim() },
                              row.id,
                            );
                            setRenaming('');
                          });
                        }}
                      >
                        <input
                          aria-label="Novo nome do projeto"
                          maxLength={120}
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <button type="submit" disabled={busy}>
                          Salvar nome
                        </button>
                        <button type="button" onClick={() => setRenaming('')}>
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <>
                        <button className="project-card-title" onClick={() => onOpen(row)}>
                          {row.name}
                        </button>
                        <p>Editado {new Date(row.updated).toLocaleDateString('pt-BR')}</p>
                        <div className="project-card-actions">
                          <button
                            disabled={busy}
                            onClick={() => {
                              setRenaming(row.id);
                              setName(row.name);
                            }}
                          >
                            Renomear
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void action(() => archiveProject(userId, row.id, !row.archived))
                            }
                          >
                            {row.archived ? <RotateCcw size={13} /> : <Archive size={13} />}{' '}
                            {row.archived ? 'Restaurar' : 'Arquivar'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {section === 'challenges' && (
          <section className="dashboard-challenges">
            <h2>Investigações práticas</h2>
            {challenges.map((challenge, index) => (
              <article key={challenge.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.goal}</p>
                </div>
                <button onClick={() => onChallenge(challenge.id)}>
                  {progress.includes(challenge.id) ? 'Refazer desafio' : 'Iniciar desafio'}
                  <ArrowUpRight size={15} />
                </button>
                {progress.includes(challenge.id) && <small>Concluído</small>}
              </article>
            ))}
          </section>
        )}
        {section === 'account' && (
          <section className="dashboard-account">
            <h2>Dados de acesso</h2>
            <label>
              E-mail<span>{email}</span>
            </label>
            <p>Seus projetos e seu progresso ficam vinculados a esta conta.</p>
            <button onClick={onPassword}>Alterar senha</button>
            <button disabled={busy} onClick={() => void action(onLogout, false)}>
              Sair da conta
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
