import React, { useState } from 'react';
import { getSupabaseClient } from '../utils/persistence';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const client = getSupabaseClient();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!client) {
      setError('Supabase is not configured. Check environment variables.');
      return;
    }
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await client.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        if (err) throw err;
      } else {
        const { data, error: err } = await client.auth.signUp({
          email: trimmed,
          password,
        });
        if (err) throw err;
        if (data.user && !data.session) {
          setMessage(
            'Check your email to confirm your account, then sign in here.'
          );
          setMode('signin');
          setPassword('');
          return;
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (!client) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">Sign in unavailable</h1>
          <p className="auth-muted">
            Set <code>REACT_APP_SUPABASE_URL</code> and{' '}
            <code>REACT_APP_SUPABASE_ANON_KEY</code> to use cloud sign-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">My expense tracker</h1>
        <p className="auth-sub">
          {mode === 'signin'
            ? 'Sign in with your email to load your data.'
            : 'Create an account. Your data is stored per user in Supabase.'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-message">{message}</p> : null}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={busy}
          >
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'signin' ? (
            <>
              <span className="auth-muted">New here?</span>{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setMessage('');
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              <span className="auth-muted">Already have an account?</span>{' '}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setMessage('');
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
