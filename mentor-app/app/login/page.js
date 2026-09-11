'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Could not reach the server. Is the app running?');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-7 bg-canvas">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <Logo size={56} borderWidth={4} />
          <div className="mt-4 text-[22px] font-semibold tracking-[-0.01em] text-text-primary">CipherSchools</div>
          <div className="text-[15px] text-text-secondary mt-0.5">Mentor attendance</div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[54px] rounded-2xl border border-border px-4 text-[15px] outline-none focus:border-[1.5px] focus:border-accent"
              placeholder="you@cipherschools.com"
              autoComplete="username"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[14px] text-text-secondary">Password</label>
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="text-[13px] font-medium text-accent-ink"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[54px] rounded-2xl border border-border px-4 text-[15px] outline-none focus:border-[1.5px] focus:border-accent"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-[13px] text-flagged-fg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-accent text-white text-[17px] font-semibold shadow-button-orange disabled:opacity-60 mt-1"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-[13px] text-text-secondary text-center mt-6">
          Accounts are issued by the CipherSchools ops team. Contact your coordinator for access.
        </p>
      </div>
    </div>
  );
}
