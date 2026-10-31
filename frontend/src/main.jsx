import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {getSession, login, logout, credentials, clearSession, startActivityTracking} from './api';
import './style.css';
import './dashboard.css';
import DashboardLayout from './DashboardLayout';

function App() {
  const [role,setRole]=useState('manager');
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkSession() {
    setPhase('loading'); setError('');
    try {
      const hadCredentials = Boolean(credentials());
      const data = await getSession();
      if (data.authenticated) { setRole(data.role||'manager');setPhase('signedIn'); }
      else { setPhase(hadCredentials ? 'unauthorized' : 'signedOut'); }
    } catch (e) { setError(e.message); setPhase('error'); }
  }
  useEffect(() => {
    if (!credentials()) { setPhase('signedOut'); return; }
    checkSession();
  }, []);
  useEffect(() => {
    const expired=()=>setPhase('unauthorized');
    window.addEventListener('auth-expired',expired);
    return ()=>window.removeEventListener('auth-expired',expired);
  }, []);
  useEffect(() => {
    if (phase==='signedIn') return startActivityTracking();
  }, [phase]);

  async function handleLogin(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await login(String(form.get('username')).trim(), String(form.get('password')));
      if (!result.authenticated) throw new Error(result.message || 'ვერ გაიარა ავტორიზაცია');
      // Verify that the browser stored the session cookie before changing the view.
      const session = await getSession();
      if (!session.authenticated) {
        throw new Error('ვერ გაიარა ავტორიზაცია');
      }
      setRole(session.role||'manager');setPhase('signedIn');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function handleLogout() {
    if (busy) return; setBusy(true); setError('');
    try { await logout(); setPhase('signedOut'); }
    catch { setPhase('signedOut'); }
    finally { setBusy(false); }
  }
  if (phase === 'unauthorized') return <main aria-label="არაავტორიზებული გვერდი"/>;
  if (phase === 'signedIn') return <DashboardLayout role={role} onLogout={handleLogout} busy={busy} error={error}/>;
  return <main className="shell">
    <header className="brand"><span className="mark" aria-hidden="true">▦</span><span>სასწავლო კალენდარი</span></header>
    {phase === 'loading' ? <section className="card" role="status"><h1>სესიის შემოწმება</h1><p>გთხოვთ, მოიცადოთ.</p></section>
    : phase === 'error' ? <section className="card"><h1>კავშირი ვერ დამყარდა</h1><p role="alert">{error}</p><button onClick={checkSession}>ხელახლა შემოწმება</button></section>
    : <section className="card"><span className="eyebrow">მომხმარებლის ანგარიში</span><h1>სისტემაში შესვლა</h1><p>სამუშაო სივრცის გასახსნელად შეიყვანეთ თქვენი მონაცემები.</p>
      <form onSubmit={handleLogin}>
        <label htmlFor="username">მომხმარებლის სახელი</label><input id="username" name="username" autoComplete="username" maxLength={190} required disabled={busy}/>
        <label htmlFor="password">პაროლი</label><input id="password" name="password" type="password" autoComplete="current-password" maxLength={1024} required disabled={busy}/>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'მოწმდება…' : 'შესვლა'}</button>
      </form>
    </section>}
    <footer>calendar.learn.net.ge</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
