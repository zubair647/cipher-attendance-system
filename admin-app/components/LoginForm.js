'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Enter both email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); setLoading(false); return; }
      router.push('/');
      router.refresh();
    } catch {
      setError('Could not reach the server. Is the app running?');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="block text-[14px] text-text-secondary mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 rounded-2xl border border-border px-4 text-[15px] outline-none focus:border-[1.5px] focus:border-accent"
          placeholder="admin@cipherschools.com"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="block text-[14px] text-text-secondary mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-12 rounded-2xl border border-border px-4 text-[15px] outline-none focus:border-[1.5px] focus:border-accent"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      {error && <div className="text-[13px] text-flagged-fg">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-[50px] rounded-2xl bg-accent text-white text-[16px] font-semibold shadow-button-orange disabled:opacity-60 mt-1"
      >
        {loading ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}
