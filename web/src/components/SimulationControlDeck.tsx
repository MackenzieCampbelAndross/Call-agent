import React, { useState } from 'react';
import {
  BrowserMockTelephonyAdapter,
  SimulatedOutgoingBehavior
} from '../telephony/BrowserMockTelephonyAdapter';
import { EmployeeIdentity } from '@call-agent/shared';
import { NetworkCondition, syncManager } from '../domain/SyncManager';
import { callRecordStore } from '../domain/CallRecordStore';
import {
  PhoneIncoming,
  Radio,
  Wifi,
  WifiOff,
  CloudLightning,
  UserCheck,
  RefreshCw,
  Trash2,
  Sliders,
  AlertTriangle,
  Play
} from 'lucide-react';

interface SimulationControlDeckProps {
  adapter: BrowserMockTelephonyAdapter;
  employees: EmployeeIdentity[];
  activeEmployee: EmployeeIdentity;
  onSelectEmployee: (emp: EmployeeIdentity) => void;
  networkCondition: NetworkCondition;
  onSetNetworkCondition: (cond: NetworkCondition) => void;
  isCallActive: boolean;
}

export const SimulationControlDeck: React.FC<SimulationControlDeckProps> = ({
  adapter,
  employees,
  activeEmployee,
  onSelectEmployee,
  networkCondition,
  onSetNetworkCondition,
  isCallActive
}) => {
  const [incomingNumber, setIncomingNumber] = useState('+14155552671');
  const [incomingName, setIncomingName] = useState('David Miller (Candidate)');
  const [incomingSim, setIncomingSim] = useState(0);

  const [outgoingBehavior, setOutgoingBehavior] = useState<SimulatedOutgoingBehavior>(
    adapter.getSimulationConfig().outgoingBehavior
  );

  const handleOutgoingBehaviorChange = (behavior: SimulatedOutgoingBehavior) => {
    setOutgoingBehavior(behavior);
    adapter.setSimulationConfig({ outgoingBehavior: behavior });
  };

  const handleTriggerIncoming = () => {
    adapter.simulateIncomingCall(incomingNumber, incomingName, incomingSim);
  };

  const handleMidCallDrop = () => {
    adapter.simulateMidCallInterruption();
  };

  const handleResetData = () => {
    if (confirm('Clear local call history and pending sync queue?')) {
      callRecordStore.clearAll();
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-xs select-none">
      {/* Simulation Banner */}
      <div className="p-3 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-800/60 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white text-xs block">
            BROWSER TEST SIMULATION MODE ACTIVE
          </span>
          <span className="text-[11px] text-purple-200 block mt-0.5 leading-relaxed">
            Running <strong>BrowserMockTelephonyAdapter</strong>. This exercises real call records, duration calculations, duplicate prevention, and sync logic without making physical cellular calls.
          </span>
        </div>
      </div>

      {/* 1. Simulate Incoming Cellular Call */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PhoneIncoming className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white">Simulate Incoming Cellular Call</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Inbound Call Event</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Caller Name</label>
            <input
              type="text"
              value={incomingName}
              onChange={e => setIncomingName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Caller Phone</label>
            <input
              type="text"
              value={incomingNumber}
              onChange={e => setIncomingNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => { setIncomingName('David Miller (Candidate)'); setIncomingNumber('+14155552671'); }}
            className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            David Miller
          </button>
          <button
            onClick={() => { setIncomingName('Jessica Reynolds (Candidate)'); setIncomingNumber('+16505558932'); }}
            className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Jessica Reynolds
          </button>
          <button
            onClick={() => { setIncomingName(''); setIncomingNumber('+18005550199'); }}
            className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Unknown Number
          </button>
        </div>

        <button
          onClick={handleTriggerIncoming}
          className="w-full py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Trigger Inbound Call on Phone</span>
        </button>
      </div>

      {/* 2. Outgoing Call Callee Simulation Behavior */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-white">Callee Behavior (When Outgoing Call Placed)</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">
          Select what the remote subscriber does when you dial from the keypad:
        </p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'ANSWER_NORMAL', label: 'Answers Normally', desc: 'Rings 3s then connects' },
            { id: 'REJECT_BUSY', label: 'Decline / Busy', desc: 'Callee rejects after 2s' },
            { id: 'UNANSWERED_TIMEOUT', label: 'Ring Timeout', desc: 'Rings 10s without answer' },
            { id: 'NETWORK_FAIL', label: 'Radio / Network Fail', desc: 'Immediate carrier error' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleOutgoingBehaviorChange(opt.id as SimulatedOutgoingBehavior)}
              className={`p-2.5 rounded-xl border text-left transition ${
                outgoingBehavior === opt.id
                  ? 'bg-brand-950/60 border-brand-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-xs">{opt.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Mid-Call Cellular Drop Simulation */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400" />
            <span className="font-bold text-white">Cellular Interruption</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Simulate sudden radio / tower drop during call (Outcome: INTERRUPTED).
          </span>
        </div>

        <button
          onClick={handleMidCallDrop}
          disabled={!isCallActive}
          className="px-3 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white transition shrink-0"
        >
          Drop Active Call
        </button>
      </div>

      {/* 4. Network & Sync Offline Queue Simulation */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CloudLightning className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">Network & Sync Resilience Simulator</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Offline Recovery</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => onSetNetworkCondition('ONLINE')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
              networkCondition === 'ONLINE'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Online</span>
          </button>

          <button
            onClick={() => onSetNetworkCondition('OFFLINE')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
              networkCondition === 'OFFLINE'
                ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </button>

          <button
            onClick={() => onSetNetworkCondition('FLAKY')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
              networkCondition === 'FLAKY'
                ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <CloudLightning className="w-3.5 h-3.5" />
            <span>Flaky (50%)</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => syncManager.triggerSync()}
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Trigger Background Sync</span>
          </button>

          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Store</span>
          </button>
        </div>
      </div>

      {/* 5. HR Employee Switcher */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white">Active HR Employee Identity</span>
        </div>

        <div className="space-y-1.5">
          {employees.map(emp => (
            <button
              key={emp.employeeId}
              onClick={() => onSelectEmployee(emp)}
              className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition ${
                activeEmployee.employeeId === emp.employeeId
                  ? 'bg-indigo-950/60 border-indigo-500 text-white font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{emp.name} ({emp.department})</span>
              <span className="text-[10px] font-mono opacity-60">{emp.employeeId}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
