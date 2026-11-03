import React, { useState } from 'react';
import { CallRecord, formatDuration, formatPhoneNumber } from '@call-agent/shared';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Phone, CheckCircle2, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CallHistoryProps {
  records: CallRecord[];
  onSelectRecord: (record: CallRecord) => void;
  onRedial: (phoneNumber: string, simSlotIndex: number) => void;
}

type FilterType = 'ALL' | 'MISSED' | 'OUTGOING' | 'INCOMING';

export const CallHistory: React.FC<CallHistoryProps> = ({
  records,
  onSelectRecord,
  onRedial
}) => {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filtered = records.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'MISSED') return r.outcome === 'MISSED' || r.outcome === 'UNANSWERED';
    if (filter === 'OUTGOING') return r.direction === 'OUTGOING';
    if (filter === 'INCOMING') return r.direction === 'INCOMING';
    return true;
  });

  const formatTime = (epochMs: number) => {
    const d = new Date(epochMs);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDirectionIcon = (r: CallRecord) => {
    if (r.outcome === 'MISSED' || r.outcome === 'UNANSWERED' || r.outcome === 'REJECTED') {
      return <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />;
    }
    if (r.direction === 'INCOMING') {
      return <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400" />;
  };

  const getSyncBadge = (status: string) => {
    if (status === 'SYNCED') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>Synced</span>
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
          <Clock className="w-2.5 h-2.5" />
          <span>Queue</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[9px] font-semibold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
        <AlertTriangle className="w-2.5 h-2.5" />
        <span>Failed</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-3 pt-2">
      {/* Segmented Filter Control */}
      <div className="flex p-0.5 bg-slate-900 rounded-lg mb-2 border border-slate-800 text-[11px] font-medium text-slate-400">
        {(['ALL', 'MISSED', 'OUTGOING', 'INCOMING'] as FilterType[]).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex-1 py-1 rounded-md transition ${
              filter === t
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Recents Call List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No call records found.
          </div>
        ) : (
          filtered.map(r => (
            <div
              key={r.callId}
              onClick={() => onSelectRecord(r)}
              className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-900/60 rounded-xl cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-full bg-slate-800/80 border border-slate-700/60 shrink-0">
                  {getDirectionIcon(r)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">
                      {r.contactName || formatPhoneNumber(r.phoneNumber)}
                    </span>
                    {r.isSimulated && (
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-purple-950 text-purple-300 rounded border border-purple-800/50">
                        TEST
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{formatTime(r.startedAt)}</span>
                    <span>•</span>
                    <span>{r.outcome}</span>
                    {r.connectedDurationSeconds > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-300">
                          {formatDuration(r.connectedDurationSeconds)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getSyncBadge(r.syncStatus)}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRedial(r.phoneNumber, r.simSlotIndex);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                  title="Redial"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
