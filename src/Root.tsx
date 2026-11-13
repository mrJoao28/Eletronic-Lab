import LocalProjects from './account/LocalProjects';
import type { SavedProject } from './projectShelf';
import UnsavedDialog from './account/UnsavedDialog';
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
type PendingChange = { run: () => void; cancel?: () => void; reason: string };
type Draft = {
  key: string;
  project: Project;
  id?: string;
  localId?: string;
  challenge?: ChallengeId;
};
export default function Root() {
  const [route, setRoute] = useState(window.location.hash);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [projectError, setProjectError] = useState('');
  const [editorReady, setEditorReady] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const pendingRef = useRef(pendingChange);
  pendingRef.current = pendingChange;
  const authOwner = useRef<string | undefined>(undefined);
  const editorContext = `${session?.user.id ?? 'guest'}:${draft?.key ?? 'default'}`;
  const contextRef = useRef(editorContext);
  contextRef.current = editorContext;
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
          setEditorDirty(false);
          pendingRef.current?.cancel?.();
          setPendingChange(null);
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
    if (!loading && (!route || route === '#')) {
      const next = session ? '#dashboard' : '#login';
      window.history.replaceState(null, '', next);
      setRoute(next);
    }
  }, [loading, route, session]);
  const openLocal = (entry: SavedProject) => {
    if (draft?.localId === entry.id && editorReady) {
      navigate('workbench');
      return;
    }
    replace(() => {
      setEditorDirty(false);
      setDraft({ key: crypto.randomUUID(), localId: entry.id, project: entry.project });
      navigate('workbench');
    }, 'abrir outro projeto');
  };
  useEffect(() => {
    if (!userId || !route.startsWith('#project/')) return;
    let active = true;
    const id = route.slice('#project/'.length);
    setProjectError('');
    if (draft?.id === id) return;
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
  const replace = (run: () => void, reason: string) => {
    if (editorDirty) setPendingChange({ run, reason });
    else run();
  };
  const start = (project: Project, challenge?: ChallengeId) =>
    replace(() => {
      setEditorDirty(false);
      setDraft({ key: crypto.randomUUID(), project, challenge });
      setProjectError('');
      navigate('workbench');
    }, 'abrir uma nova montagem');
  const open = (row: CloudProject) => {
    // Opening the active card is a resume operation, not a replacement from the database.
    if (draft?.id === row.id && editorReady) {
      setProjectError('');
      navigate(`project/${row.id}`);
      return;
    }
    replace(() => {
      setEditorDirty(false);
      setProjectError('');
      setDraft({ key: row.id, id: row.id, project: row.project });
      navigate(`project/${row.id}`);
    }, 'abrir outro projeto');
  };
  const logout = async () => {
    if (editorDirty) {
      const proceed = await new Promise<boolean>((resolve) =>
        setPendingChange({
          reason: 'sair da conta',
          run: () => resolve(true),
          cancel: () => resolve(false),
        }),
      );
      if (!proceed) return;
    }
    const { error } = await supabase!.auth.signOut();
    if (error) throw Error('Não foi possível sair. Tente novamente.');
    setDraft(null);
    setEditorReady(false);
    setEditorDirty(false);
    navigate('login');
  };
  let panel: ReactNode = null;
  if (loading)
    panel = (
      <div className="account-loading" role="status">
        Abrindo laboratório…
      </div>
    );
  else if (
    (!session && (!route || route === '#')) ||
    ['#login', '#signup', '#recover', '#reset-password'].includes(route)
  ) {
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
        onGuest={() => navigate(editorReady ? 'workbench' : 'projects')}
        resumeWorkbench={editorReady}
        onSuccess={() => navigate('dashboard')}
      />
    );
  } else if (route === '#projects' && !session) {
    panel = (
      <LocalProjects
        onLogin={() => navigate('login')}
        onNew={start}
        onOpen={openLocal}
        onResume={editorReady ? () => navigate('workbench') : undefined}
      />
    );
  } else if (
    route === '#dashboard' ||
    route === '#projects' ||
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
        onGuest={() => navigate(editorReady ? 'workbench' : 'projects')}
        resumeWorkbench={editorReady}
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
      {pendingChange && (
        <UnsavedDialog
          reason={pendingChange.reason}
          onKeep={() => {
            pendingChange.cancel?.();
            setPendingChange(null);
          }}
          onDiscard={() => {
            const run = pendingChange.run;
            setPendingChange(null);
            run();
          }}
        />
      )}
      {!loading && (editorReady || workspaceVisible) && (
        <div hidden={!workspaceVisible}>
          <App
            key={`${session?.user.id ?? 'guest'}:${draft?.key ?? 'default'}`}
            active={workspaceVisible}
            onDirtyChange={setEditorDirty}
            onPersisted={(id, snapshot) => {
              if (contextRef.current !== editorContext) return;
              setDraft((previous) => ({
                key: previous?.key ?? 'default',
                project: snapshot,
                id,
                challenge: previous?.challenge,
              }));
            }}
            accountId={userId}
            accountEmail={session?.user.email}
            initialProject={draft?.project}
            initialCloudId={draft?.id}
            initialSavedId={draft?.localId}
            onLocalPersisted={(id, snapshot) => {
              if (contextRef.current !== editorContext) return;
              setDraft((previous) => ({
                key: previous?.key ?? 'default',
                project: snapshot,
                localId: id,
              }));
            }}
            onProjects={() => navigate(session ? 'dashboard' : 'projects')}
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
