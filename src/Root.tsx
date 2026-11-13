import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import App from './App';
import { supabase } from './account/client';
import AuthForm from './account/AuthForm';
import './account/account.css';
export function navigate(route: string) {
  window.location.hash = route;
}
export default function Root() {
  const [route, setRoute] = useState(window.location.hash);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
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
  if (loading)
    return (
      <div className="account-loading" role="status">
        Abrindo laboratório…
      </div>
    );
  if (
    route === '#login' ||
    route === '#signup' ||
    route === '#recover' ||
    route === '#reset-password'
  ) {
    if (route === '#reset-password' && !session)
      return (
        <AuthForm
          key="recover"
          mode="recover"
          onGuest={() => navigate('workbench')}
          onSuccess={() => navigate('dashboard')}
        />
      );
    return (
      <AuthForm
        key={route}
        mode={
          route === '#signup'
            ? 'signup'
            : route === '#recover'
              ? 'recover'
              : route === '#reset-password'
                ? 'reset'
                : 'login'
        }
        onGuest={() => navigate('workbench')}
        onSuccess={() => navigate('dashboard')}
      />
    );
  }
  if (route === '#dashboard' || (session && !route)) {
    if (!session)
      return (
        <AuthForm
          mode="login"
          onGuest={() => navigate('workbench')}
          onSuccess={() => navigate('dashboard')}
        />
      );
    return (
      <main className="account-loading">
        <h1>Minha conta</h1>
        <p>{session.user.email}</p>
        <button className="account-primary" onClick={() => navigate('workbench')}>
          Abrir bancada
        </button>
        <button onClick={() => void supabase?.auth.signOut().then(() => navigate('login'))}>
          Sair
        </button>
      </main>
    );
  }
  return (
    <App
      key={session?.user.id ?? 'guest'}
      accountEmail={session?.user.email}
      onAccount={() => navigate(session ? 'dashboard' : 'login')}
    />
  );
}
