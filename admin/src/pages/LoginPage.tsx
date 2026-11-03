import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, ShieldAlert, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@purpledrive.com');
    setPassword('Admin@PurpleDrive2026!');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 selection:bg-purple-600 selection:text-white">
      <div className="w-full max-w-md bg-navy-900 border border-charcoal-800 rounded-3xl p-8 shadow-2xl shadow-purple-950/20">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-900/40">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">PurpleDrive Admin</h1>
          <p className="text-xs text-slate-400 mt-1">HR Cellular Calling & Workforce Analytics Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@purpledrive.internal"
                className="w-full bg-navy-950 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-navy-950 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Credentials Quick Fill */}
        <div className="mt-6 pt-6 border-t border-charcoal-800 text-center">
          <p className="text-[11px] text-slate-400 mb-2">Pre-configured Administrator Access</p>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition underline underline-offset-4"
          >
            Fill Demo Admin Credentials (admin@purpledrive.internal)
          </button>
        </div>
      </div>
    </div>
  );
};
