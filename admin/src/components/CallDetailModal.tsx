import React, { useState } from 'react';
import { CallRecord, formatDuration } from '@call-agent/shared';
import { X, Copy, Check, Eye, EyeOff, ShieldCheck, Phone, Clock, Terminal } from 'lucide-react';

interface CallDetailModalProps {
  record: CallRecord;
  onClose: () => void;
}

export const CallDetailModal: React.FC<CallDetailModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [maskPhone, setMaskPhone] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatIST = (epochMs: number) => {
    return new Date(epochMs).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatUTC = (epochMs: number) => {
    return new Date(epochMs).toISOString();
  };

  const displayPhone = (phone?: string) => {
    if (!phone) return '—';
    if (!maskPhone) return phone;
    if (phone.length <= 4) return '****';
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-charcoal-900 border border-charcoal-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-charcoal-800 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-white">Call Audit Record</h3>
            {record.isSimulated ? (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 rounded border border-purple-800 font-semibold">
                SIMULATED TEST
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800 font-semibold">
                NATIVE CELLULAR CALL
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMaskPhone(!maskPhone)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-charcoal-800 text-slate-300 hover:text-white"
              title="Toggle phone privacy mask"
            >
              {maskPhone ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{maskPhone ? 'Reveal Numbers' : 'Mask Numbers'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3.5 bg-navy-950/70 p-4 rounded-2xl border border-charcoal-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Unique Call ID (UUID)</span>
              <span className="font-mono text-white select-all text-[11px] break-all">{record.callId}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Outcome & Direction</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-white">{record.direction}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-charcoal-800 text-purple-300 border border-charcoal-800">
                  {record.outcome}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">HR Employee</span>
              <span className="text-white font-semibold">
                {record.employeeName} ({record.employeeId})
              </span>
              <span className="text-[11px] text-slate-400 block">{record.employeeDepartment}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Registered Employee Number</span>
              <span className="font-mono text-purple-300 font-semibold block">
                {displayPhone(record.registeredPhoneNumber || '+14155550100')}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Contact (Other Party)</span>
              <span className="text-white font-semibold">{record.contactName || 'Unknown Contact'}</span>
              <span className="font-mono text-slate-300 block">{displayPhone(record.phoneNumber)}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Connected Duration</span>
              <span className="font-mono font-bold text-white text-base">
                {formatDuration(record.connectedDurationSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({record.connectedDurationSeconds} seconds actual talk time)
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">SIM Card Account</span>
              <span className="text-slate-200">
                Slot {record.simSlotIndex}: {record.simDisplayName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Sync Status & Attempts</span>
              <span className="text-emerald-400 font-semibold">
                {record.syncStatus} ({record.syncAttempts} attempts)
              </span>
            </div>
          </div>

          {/* Timeline details */}
          <div className="bg-navy-950/70 p-4 rounded-2xl border border-charcoal-800 text-xs space-y-2">
            <span className="font-bold text-white block mb-1">Timeline (Indian Standard Time & UTC)</span>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Initiated / Ring Start:</span>
              <div className="text-right">
                <span className="font-medium text-white">{formatIST(record.startedAt)}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{formatUTC(record.startedAt)}</span>
              </div>
            </div>

            {record.connectedAt && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-emerald-400 font-medium">Audio Connected:</span>
                <div className="text-right">
                  <span className="font-medium text-emerald-300">{formatIST(record.connectedAt)}</span>
                  <span className="text-[10px] text-slate-500 font-mono block">{formatUTC(record.connectedAt)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Call Terminated:</span>
              <div className="text-right">
                <span className="font-medium text-white">{formatIST(record.endedAt)}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{formatUTC(record.endedAt)}</span>
              </div>
            </div>
          </div>

          {/* JSON Inspector */}
          <div>
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showJson ? 'Hide Raw Audit JSON Payload' : 'Inspect Raw Audit JSON Payload'}</span>
            </button>

            {showJson && (
              <pre className="mt-2 p-3 bg-navy-950 rounded-xl text-[11px] font-mono text-slate-300 border border-charcoal-800 overflow-x-auto max-h-52">
                {JSON.stringify(record, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-charcoal-800 bg-navy-950/60 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-charcoal-800 hover:bg-charcoal-700 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
