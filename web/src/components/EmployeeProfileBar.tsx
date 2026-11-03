import React from 'react';
import { EmployeeIdentity } from '@call-agent/shared';
import { ShieldCheck, CloudOff, Cloud, RefreshCw } from 'lucide-react';
import { NetworkCondition } from '../domain/SyncManager';

interface EmployeeProfileBarProps {
  employee: EmployeeIdentity;
  networkCondition: NetworkCondition;
  isSyncing: boolean;
  onOpenSyncDetails: () => void;
}

export const EmployeeProfileBar: React.FC<EmployeeProfileBarProps> = ({
  employee,
  networkCondition,
  isSyncing,
  onOpenSyncDetails
}) => {
  return (
    <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
          {employee.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white leading-tight">{employee.name}</span>
            <ShieldCheck className="w-3 h-3 text-brand-400" />
          </div>
          <span className="text-[10px] text-slate-400 block">{employee.department}</span>
        </div>
      </div>

      <button
        onClick={onOpenSyncDetails}
        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
        title="View sync queue & call records"
      >
        {networkCondition === 'OFFLINE' ? (
          <>
            <CloudOff className="w-3 h-3 text-rose-400" />
            <span className="text-rose-400">Offline</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3 h-3 text-brand-400 animate-spin" />
            <span className="text-brand-300">Syncing...</span>
          </>
        ) : networkCondition === 'FLAKY' ? (
          <>
            <Cloud className="w-3 h-3 text-amber-400" />
            <span className="text-amber-300">Flaky</span>
          </>
        ) : (
          <>
            <Cloud className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-300">Synced</span>
          </>
        )}
      </button>
    </div>
  );
};
