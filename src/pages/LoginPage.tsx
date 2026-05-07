import { Plane, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const DEMO_USERNAME = 'Synapse';
const DEMO_PASSWORD = '1516';

export function LoginPage() {
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const [error, setError] = useState('');
  const authenticated = localStorage.getItem('synapse-authenticated') === 'true';

  if (authenticated) {
    return <Navigate to="/normal-operation" replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      setError('Kullanıcı adı veya şifre hatalı.');
      return;
    }

    localStorage.setItem('synapse-authenticated', 'true');
    navigate('/normal-operation', { replace: true });
  };

  return (
    <main className="login-page">
      <div className="login-surface" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <section className="login-hero" aria-label="Synapse giriş ekranı">
        <div className="login-logo">
          {logoError ? (
            <div className="login-logo__fallback" aria-label="Synapse logo">
              <Plane size={34} />
            </div>
          ) : (
            <img src={logo} alt="Synapse" onError={() => setLogoError(true)} />
          )}
        </div>

        <h1>Synapse Dijital Kara Kutu Sistemi</h1>

        <form className="login-panel" onSubmit={submit}>
          <h2>✈︎ Güvenli Operatör Girişi</h2>
          <label>
            Kullanıcı adı
            <input autoComplete="username" name="username" placeholder="username" type="text" />
          </label>
          <label>
            Şifre
            <input autoComplete="current-password" name="password" placeholder="password" type="password" />
          </label>
          {error ? <p className="login-panel__error">{error}</p> : null}
          <button className="button button--primary" type="submit">
            <ShieldCheck size={18} />
            Panele Giriş Yap
          </button>
        </form>
      </section>
    </main>
  );
}
