import React, { useState } from 'react';
import { CallRecord, formatDuration, formatPhoneNumber, validateCallRecord } from '@call-agent/shared';
import { X, CheckCircle2, AlertTriangle, Clock, RefreshCw, Copy, Check, ShieldCheck, Terminal } from 'lucide-react';
import { syncManager } from '../domain/SyncManager';

interface RecordDetailModalProps {
  record: CallRecord;
  onClose: () => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const validation = validateCallRecord(record);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetrySync = async () => {
    setRetrying(true);
    await syncManager.triggerSync();
    setRetrying(false);
  };

  const formatDateTime = (ms: number) => {
    return new Date(ms).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Call Audit Record</h3>
            {record.isSimulated && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 rounded border border-purple-800 font-semibold">
                SIMULATION (BrowserMock)
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Validation Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            validation.valid
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-semibold">
                {validation.valid ? 'Contract Conformance Verified' : 'Validation Issues Detected'}
              </span>
            </div>
            <span className="text-[11px] opacity-80">
              {validation.valid ? 'All 10 contract rules passed' : `${validation.errors.length} errors`}
            </span>
          </div>

          {/* Core Call Overview Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Unique Call ID (UUID v4)</span>
              <span className="font-mono text-white select-all text-[11px] break-all">{record.callId}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Sync Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {record.syncStatus === 'SYNCED' ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced to Server
                  </span>
                ) : record.syncStatus === 'PENDING' ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending Queue
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Sync Failed ({record.syncAttempts} attempts)
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Employee Identity</span>
              <span className="text-white font-medium">
                {record.employeeName} ({record.employeeId})
              </span>
              <span className="text-[11px] text-slate-400 block">{record.employeeDepartment}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Phone & Contact</span>
              <span className="text-white font-medium">
                {record.contactName || 'Unknown Caller'}
              </span>
              <span className="text-[11px] font-mono text-slate-300 block">
                {formatPhoneNumber(record.phoneNumber)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Direction & Outcome</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-white">{record.direction}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-brand-300 border border-slate-700">
                  {record.outcome}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Connected Duration</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatDuration(record.connectedDurationSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({record.connectedDurationSeconds} seconds)
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">SIM Account</span>
              <span className="text-slate-200">
                Slot {record.simSlotIndex}: {record.simDisplayName}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Timeline</span>
              <span className="text-[11px] text-slate-300 block">
                Started: {formatDateTime(record.startedAt)}
              </span>
              {record.connectedAt && (
                <span className="text-[11px] text-emerald-400 block">
                  Connected: {formatDateTime(record.connectedAt)}
                </span>
              )}
              <span className="text-[11px] text-slate-300 block">
                Ended: {formatDateTime(record.endedAt)}
              </span>
            </div>
          </div>

          {record.syncErrorMessage && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-300">
              <span className="font-bold block">Last Sync Error:</span>
              <span className="font-mono text-[11px]">{record.syncErrorMessage}</span>
            </div>
          )}

          {/* Toggle Raw JSON Inspector */}
          <div>
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showJson ? 'Hide Raw Audit JSON Payload' : 'Inspect Raw Audit JSON Payload'}</span>
            </button>

            {showJson && (
              <div className="mt-2 relative">
                <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-slate-300 border border-slate-800 overflow-x-auto max-h-56">
                  {JSON.stringify(record, null, 2)}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                  title="Copy JSON"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Record JSON'}</span>
          </button>

          <div className="flex items-center gap-2">
            {record.syncStatus !== 'SYNCED' && (
              <button
                onClick={handleRetrySync}
                disabled={retrying}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>Retry Sync</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
