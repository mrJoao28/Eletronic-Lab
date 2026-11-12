import { parseProject, type Project } from './engine';
export interface SavedProject {
  id: string;
  name: string;
  updated: string;
  project: Project;
  archived?: boolean;
}
export interface Shelf {
  version: 1;
  entries: SavedProject[];
}
export function readShelf(raw: string | null, legacy: string | null = null): Shelf {
  if (!raw)
    return {
      version: 1,
      entries: legacy
        ? [
            {
              id: 'legacy',
              name: parseProject(legacy).name,
              updated: new Date(0).toISOString(),
              project: parseProject(legacy),
            },
          ]
        : [],
    };
  if (raw.length > 8e6) throw Error('Acervo local excede o limite de leitura.');
  const shelf = JSON.parse(raw) as Shelf;
  if (!shelf || shelf.version !== 1 || !Array.isArray(shelf.entries) || shelf.entries.length > 50)
    throw Error('Acervo local inválido. Exporte seus dados antes de limpar o armazenamento.');
  const ids = new Set<string>();
  for (const entry of shelf.entries) {
    if (
      !entry ||
      typeof entry.id !== 'string' ||
      !/^[\w-]{1,80}$/.test(entry.id) ||
      ids.has(entry.id) ||
      typeof entry.name !== 'string' ||
      entry.name.length > 120 ||
      typeof entry.updated !== 'string' ||
      !Number.isFinite(Date.parse(entry.updated)) ||
      (entry.archived !== undefined && typeof entry.archived !== 'boolean')
    )
      throw Error('Entrada de projeto inválida.');
    ids.add(entry.id);
    entry.project = parseProject(JSON.stringify(entry.project));
  }
  return shelf;
}
export function saveToShelf(
  shelf: Shelf,
  project: Project,
  id?: string,
): { shelf: Shelf; id: string } {
  const valid = parseProject(JSON.stringify(project));
  const existing = shelf.entries.some((e) => e.id === id),
    nextId = existing ? id! : crypto.randomUUID();
  if (!existing && shelf.entries.length >= 50)
    throw Error('Limite de 50 projetos. Exporte cópias antes de liberar espaço.');
  const entry: SavedProject = {
    id: nextId,
    name: valid.name,
    project: valid,
    updated: new Date().toISOString(),
  };
  return {
    id: nextId,
    shelf: {
      version: 1,
      entries: existing
        ? shelf.entries.map((e) => (e.id === nextId ? entry : e))
        : [entry, ...shelf.entries],
    },
  };
}
