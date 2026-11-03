import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { AuditLogEntry } from '@call-agent/shared';
import { ShieldAlert, RefreshCw, Terminal } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatIST = (epochMs: number) => {
    return new Date(epochMs).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">System Security & Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Immutable log of administrative changes, employee provisioning, CSV exports, and authentication events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300"
          title="Refresh audit logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
        </button>
      </div>

      <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-charcoal-800 bg-navy-950/70 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Loading audit trail...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-navy-950/40 font-mono">
                    <td className="py-3 px-4 text-slate-400">
                      {formatIST(log.timestamp)}
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-charcoal-800 text-purple-300 border border-charcoal-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div>{log.actorEmail || log.actorId}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.actorType === 'ADMIN' ? 'bg-purple-950 text-purple-300' :
                        log.actorType === 'EMPLOYEE' ? 'bg-blue-950 text-blue-300' :
                        'bg-charcoal-800 text-slate-400'
                      }`}>
                        {log.actorType}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
