import { supabase } from './client';
import { parseProject, type Project } from '../engine';
import { challenges, type ChallengeId } from '../challenges';
export interface CloudProject {
  id: string;
  ownerId: string;
  name: string;
  project: Project;
  updated: string;
  archived: boolean;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseCloudProject(value: unknown, ownerId: string): CloudProject {
  if (!value || typeof value !== 'object') throw Error('Projeto inválido.');
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    !uuid.test(row.id) ||
    row.owner_id !== ownerId ||
    typeof row.name !== 'string' ||
    row.name.length > 120 ||
    typeof row.updated_at !== 'string' ||
    !Number.isFinite(Date.parse(row.updated_at)) ||
    typeof row.archived !== 'boolean'
  )
    throw Error('Não foi possível abrir este projeto.');
  const project = parseProject(JSON.stringify(row.document));
  if (row.name !== project.name) throw Error('Nome do projeto inconsistente.');
  return {
    id: row.id,
    ownerId,
    name: row.name,
    project,
    updated: row.updated_at,
    archived: row.archived,
  };
}
function client() {
  if (!supabase) throw Error('Conexão indisponível.');
  return supabase;
}
const fields = 'id,owner_id,name,document,updated_at,archived';
export async function listProjects(ownerId: string): Promise<CloudProject[]> {
  const { data, error } = await client()
    .from('lab_projects')
    .select(fields)
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) throw Error('Não foi possível carregar seus projetos.');
  return data.map((row) => parseCloudProject(row, ownerId));
}
export async function getProject(ownerId: string, id: string): Promise<CloudProject> {
  if (!uuid.test(id)) throw Error('Projeto não encontrado.');
  const { data, error } = await client()
    .from('lab_projects')
    .select(fields)
    .eq('owner_id', ownerId)
    .eq('id', id)
    .single();
  if (error) throw Error('Projeto não encontrado ou acesso indisponível.');
  return parseCloudProject(data, ownerId);
}
export async function saveProject(
  ownerId: string,
  project: Project,
  id?: string,
): Promise<CloudProject> {
  const document = parseProject(JSON.stringify(project));
  if (document.name.length > 120) throw Error('O nome deve ter até 120 caracteres.');
  const query = id
    ? client()
        .from('lab_projects')
        .update({ name: document.name, document })
        .eq('owner_id', ownerId)
        .eq('id', id)
    : client().from('lab_projects').insert({ owner_id: ownerId, name: document.name, document });
  const { data, error } = await query.select(fields).single();
  if (error) throw Error('Não foi possível salvar na sua conta. Sua montagem continua aberta.');
  return parseCloudProject(data, ownerId);
}
export async function archiveProject(ownerId: string, id: string, archived: boolean) {
  const { data, error } = await client()
    .from('lab_projects')
    .update({ archived })
    .eq('owner_id', ownerId)
    .eq('id', id)
    .select('id')
    .single();
  if (error || !data) throw Error('Não foi possível atualizar o projeto.');
}
export async function getProgress(ownerId: string): Promise<ChallengeId[]> {
  const { data, error } = await client()
    .from('lab_progress')
    .select('challenge_id')
    .eq('owner_id', ownerId);
  if (error) throw Error('Não foi possível carregar seu progresso.');
  return data
    .map((row) => row.challenge_id)
    .filter((id): id is ChallengeId => challenges.some((c) => c.id === id));
}
export async function completeChallenge(ownerId: string, id: ChallengeId) {
  const { error } = await client()
    .from('lab_progress')
    .upsert(
      { owner_id: ownerId, challenge_id: id },
      { onConflict: 'owner_id,challenge_id', ignoreDuplicates: true },
    );
  if (error) throw Error('Não foi possível salvar seu progresso.');
}
