import React from 'react';
import { Clock, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { admin } = useAuth();

  return (
    <header className="h-20 bg-navy-900/60 backdrop-blur-md border-b border-charcoal-800 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {actions}

        {/* IST Timezone Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800/80 border border-charcoal-800 text-[11px] font-medium text-slate-300">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Indian Standard Time (IST)</span>
        </div>

        {/* Security Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-[11px] font-semibold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{admin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};
