import { useState, type FormEvent } from 'react';
import { CircuitBoard, ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { supabase } from './client';
export type AuthMode = 'login' | 'signup' | 'recover' | 'reset';
export default function AuthForm({
  mode: initial,
  onGuest,
  onSuccess,
  resumeWorkbench = false,
}: {
  mode: AuthMode;
  onGuest: () => void;
  onSuccess: () => void;
  resumeWorkbench?: boolean;
}) {
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const titles = {
    login: 'Entrar no laboratório',
    signup: 'Criar sua conta',
    recover: 'Recuperar acesso',
    reset: 'Definir nova senha',
  };
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setMessage('');
    setError('');
    setPassword('');
    setConfirmation('');
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!supabase) {
      setError(
        'O acesso às contas está temporariamente indisponível. Você pode usar a bancada como visitante.',
      );
      return;
    }
    if ((mode === 'signup' || mode === 'reset') && password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onSuccess();
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${location.origin}/#dashboard` },
        });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        if (data.session) onSuccess();
        else setMessage('Confira seu e-mail para confirmar a conta. Depois, entre no laboratório.');
      } else if (mode === 'recover') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${location.origin}/#reset-password`,
        });
        if (error) throw error;
        setMessage('Se houver uma conta com esse e-mail, você receberá um link de recuperação.');
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword('');
        setConfirmation('');
        onSuccess();
      }
    } catch (failure) {
      const code = failure && typeof failure === 'object' && 'code' in failure ? failure.code : '';
      setError(
        code === 'invalid_credentials'
          ? 'E-mail ou senha incorretos.'
          : code === 'email_not_confirmed'
            ? 'Confirme seu e-mail antes de entrar.'
            : code === 'over_email_send_rate_limit'
              ? 'Muitas tentativas de envio. Aguarde alguns minutos.'
              : 'Não foi possível concluir. Confira os dados e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-brand">
        <CircuitBoard size={24} />
        <span>
          eletronic<span>lab</span>
        </span>
      </div>
      <button className="auth-back" onClick={onGuest}>
        <ArrowLeft size={15} /> {resumeWorkbench ? 'Voltar à bancada' : 'Continuar como visitante'}
      </button>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-icon">
          <LockKeyhole size={22} />
        </div>
        <span className="eyebrow">SUA ÁREA DE TRABALHO</span>
        <h1 id="auth-title">{titles[mode]}</h1>
        <p>
          {mode === 'login'
            ? 'Seus projetos, em qualquer computador.'
            : mode === 'signup'
              ? 'Salve suas montagens em uma conta pessoal.'
              : 'Use o e-mail cadastrado para recuperar seu acesso.'}
        </p>
        <form onSubmit={submit}>
          {mode !== 'reset' && (
            <label>
              E-mail
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {mode !== 'recover' && (
            <label>
              Senha
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'login' ? 1 : 10}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {(mode === 'signup' || mode === 'reset') && (
            <>
              <label>
                Confirmar senha
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
              <small>Use pelo menos 10 caracteres.</small>
            </>
          )}
          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="account-message" role="status">
              {message}
            </p>
          )}
          <button className="account-primary" type="submit" disabled={busy}>
            {busy
              ? 'Aguarde…'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'signup'
                  ? 'Criar conta'
                  : mode === 'recover'
                    ? 'Enviar link'
                    : 'Salvar nova senha'}
            <ArrowRight size={16} />
          </button>
        </form>
        {mode === 'login' ? (
          <div className="auth-links">
            <button onClick={() => switchMode('recover')}>Esqueci minha senha</button>
            <button onClick={() => switchMode('signup')}>Criar conta</button>
          </div>
        ) : (
          <button className="auth-back-login" onClick={() => switchMode('login')}>
            Já tenho conta · Entrar
          </button>
        )}
      </section>
      <footer className="auth-footer">ELETRÔNICA · ARQUITETURA · EXPERIMENTAÇÃO</footer>
    </main>
  );
}
