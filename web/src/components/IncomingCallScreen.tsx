import React from 'react';
import { CallStateEvent, formatPhoneNumber } from '@call-agent/shared';
import { Phone, PhoneOff, Layers } from 'lucide-react';

interface IncomingCallScreenProps {
  call: CallStateEvent;
  onAnswer: () => void;
  onReject: () => void;
}

export const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({
  call,
  onAnswer,
  onReject,
}) => {
  const simName = call.simSlotIndex === 1 ? 'SIM 2 (Personal)' : 'SIM 1 (PurpleDrive HR)';

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex flex-col justify-between p-6 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="text-center pt-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-brand-300 mb-4 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>{simName}</span>
        </div>

        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold animate-pulse">
          Incoming Cellular Call
        </p>

        <h2 className="text-3xl font-bold text-white tracking-tight mt-2">
          {call.contactName || formatPhoneNumber(call.phoneNumber)}
        </h2>

        {call.contactName && (
          <p className="text-sm font-mono text-slate-400 mt-1">
            {formatPhoneNumber(call.phoneNumber)}
          </p>
        )}
      </div>

      {/* Center Avatar with Pulsing Effect */}
      <div className="flex items-center justify-center my-auto">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-emerald-500/10 animate-ping absolute inset-0" />
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-emerald-500/50 flex items-center justify-center text-4xl font-bold text-emerald-300 shadow-2xl relative z-10">
            {call.contactName ? call.contactName.split(' ').map(n => n[0]).join('') : '?'}
          </div>
        </div>
      </div>

      {/* Answer / Decline Action Controls */}
      <div className="pb-8">
        <div className="flex items-center justify-around max-w-[280px] mx-auto">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition"
              title="Decline Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs font-medium text-slate-300">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onAnswer}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce transition"
              title="Accept Call"
            >
              <Phone className="w-7 h-7 fill-white" />
            </button>
            <span className="text-xs font-medium text-slate-300">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
