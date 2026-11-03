import React from 'react';
import { LayoutDashboard, PhoneCall, Users, ShieldAlert, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AdminTab = 'dashboard' | 'calls' | 'employees' | 'audit';

interface SidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { logout, admin } = useAuth();

  const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'calls', label: 'Call Records', icon: <PhoneCall className="w-4 h-4" /> },
    { id: 'employees', label: 'HR Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'audit', label: 'Security Audit', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-charcoal-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-charcoal-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight leading-none">PurpleDrive</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800/60 leading-none">
                ADMIN
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">HR Call Monitoring</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                currentTab === item.id
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-charcoal-800/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Admin User Footer & Logout */}
      <div className="p-4 border-t border-charcoal-800 bg-navy-950/40">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">{admin?.name}</span>
            <span className="text-[10px] text-slate-400 block truncate">{admin?.email}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-charcoal-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-charcoal-800 hover:border-rose-800/40 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
