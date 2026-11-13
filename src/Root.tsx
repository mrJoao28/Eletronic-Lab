import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import App from './App';
import { supabase } from './account/client';
import AuthForm from './account/AuthForm';
import Dashboard from './account/Dashboard';
import { getProject, saveProject, completeChallenge, type CloudProject } from './account/projects';
import { challengeProject, type ChallengeId } from './challenges';
import type { Project } from './engine';
import './account/account.css';
export function navigate(route: string) {
  window.location.hash = route;
}
type Draft = { key: string; project: Project; id?: string; challenge?: ChallengeId };
export default function Root() {
  const [route, setRoute] = useState(window.location.hash);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [projectError, setProjectError] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const authOwner = useRef<string | undefined>(undefined);
  useEffect(() => {
    const change = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let active = true,
      changed = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      changed = true;
      if (active) {
        if (authOwner.current !== next?.user.id) {
          setDraft(null);
          setEditorReady(false);
        }
        authOwner.current = next?.user.id;
        setSession(next);
        setLoading(false);
      }
      if (event === 'PASSWORD_RECOVERY') navigate('reset-password');
    });
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && !changed) {
          setSession(error ? null : data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId || !route.startsWith('#project/')) return;
    let active = true;
    const id = route.slice('#project/'.length);
    if (draft?.id === id) return;
    setProjectError('');
    void getProject(userId, id)
      .then((row) => {
        if (active) setDraft({ key: row.id, id: row.id, project: row.project });
      })
      .catch((err) => {
        if (active)
          setProjectError(err instanceof Error ? err.message : 'Não foi possível abrir o projeto.');
      });
    return () => {
      active = false;
    };
  }, [route, userId]);
  const start = (project: Project, challenge?: ChallengeId) => {
    setDraft({ key: crypto.randomUUID(), project, challenge });
    navigate('workbench');
  };
  const open = (row: CloudProject) => {
    setDraft({ key: row.id, id: row.id, project: row.project });
    navigate(`project/${row.id}`);
  };
  const logout = async () => {
    const { error } = await supabase!.auth.signOut();
    if (error) throw Error('Não foi possível sair. Tente novamente.');
    setDraft(null);
    setEditorReady(false);
    navigate('login');
  };
  let panel: ReactNode = null;
  if (loading)
    panel = (
      <div className="account-loading" role="status">
        Abrindo laboratório…
      </div>
    );
  else if (['#login', '#signup', '#recover', '#reset-password'].includes(route)) {
    const mode =
      route === '#signup'
        ? 'signup'
        : route === '#recover' || (route === '#reset-password' && !session)
          ? 'recover'
          : route === '#reset-password'
            ? 'reset'
            : 'login';
    panel = (
      <AuthForm
        key={mode}
        mode={mode}
        onGuest={() => navigate('workbench')}
        onSuccess={() => navigate('dashboard')}
      />
    );
  } else if (
    route === '#dashboard' ||
    (session && !route) ||
    (!session && route.startsWith('#project/'))
  ) {
    panel = session ? (
      <Dashboard
        key={session.user.id}
        userId={session.user.id}
        email={session.user.email ?? ''}
        onOpen={open}
        onNew={(project) => start(project)}
        onChallenge={(id) => start(challengeProject(id), id)}
        onLogout={logout}
        onPassword={() => navigate('reset-password')}
        onResume={
          editorReady ? () => navigate(draft?.id ? `project/${draft.id}` : 'workbench') : undefined
        }
      />
    ) : (
      <AuthForm
        mode="login"
        onGuest={() => navigate('workbench')}
        onSuccess={() => navigate('dashboard')}
      />
    );
  } else if (
    session &&
    route.startsWith('#project/') &&
    (projectError || draft?.id !== route.slice('#project/'.length))
  ) {
    panel = (
      <main className="account-loading">
        <p role={projectError ? 'alert' : 'status'}>{projectError || 'Abrindo projeto…'}</p>
        <button className="account-primary" onClick={() => navigate('dashboard')}>
          Voltar aos meus projetos
        </button>
      </main>
    );
  }
  const workspaceVisible = panel === null;
  useEffect(() => {
    if (workspaceVisible) setEditorReady(true);
  }, [workspaceVisible]);
  return (
    <>
      {panel}
      {!loading && (editorReady || workspaceVisible) && (
        <div hidden={!workspaceVisible}>
          <App
            key={`${session?.user.id ?? 'guest'}:${draft?.key ?? 'default'}`}
            active={workspaceVisible}
            accountId={userId}
            accountEmail={session?.user.email}
            initialProject={draft?.project}
            initialCloudId={draft?.id}
            initialChallenge={draft?.challenge}
            onCloudSave={
              userId
                ? async (project, id) => (await saveProject(userId, project, id)).id
                : undefined
            }
            onChallengeComplete={userId ? (id) => completeChallenge(userId, id) : undefined}
            onAccount={() => navigate(session ? 'dashboard' : 'login')}
          />
        </div>
      )}
    </>
  );
}
