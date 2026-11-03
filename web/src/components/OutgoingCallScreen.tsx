import React, { useState } from 'react';
import { CallStateEvent, formatPhoneNumber } from '@call-agent/shared';
import { Mic, MicOff, Volume2, VolumeX, Hash as KeypadIcon, PhoneOff, Layers } from 'lucide-react';
import { soundEffects } from '../audio/soundEffects';

interface OutgoingCallScreenProps {
  call: CallStateEvent;
  onEndCall: () => void;
  onToggleMute: (muted: boolean) => void;
  onToggleSpeaker: (speaker: boolean) => void;
}

export const OutgoingCallScreen: React.FC<OutgoingCallScreenProps> = ({
  call,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
}) => {
  const [showKeypad, setShowKeypad] = useState(false);

  const statusText = call.state === 'RINGING' ? 'Ringing cellular line...' : 'Establishing cellular connection...';
  const simName = call.simSlotIndex === 1 ? 'SIM 2 (Personal)' : 'SIM 1 (PurpleDrive HR)';

  const handleDtmf = (digit: string) => {
    soundEffects.playDtmfTone(digit);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col justify-between p-6 select-none animate-in fade-in duration-200">
      {/* Top Header & SIM Label */}
      <div className="text-center pt-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-brand-300 mb-4 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>{simName}</span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {call.contactName || formatPhoneNumber(call.phoneNumber)}
        </h2>
        {call.contactName && (
          <p className="text-sm font-mono text-slate-400 mt-0.5">
            {formatPhoneNumber(call.phoneNumber)}
          </p>
        )}
        <p className="text-xs text-brand-400 animate-pulse font-medium mt-3">
          {statusText}
        </p>
      </div>

      {/* Center Pulsing Avatar Halo */}
      <div className="flex items-center justify-center my-auto">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-brand-500/10 animate-ping absolute inset-0" />
          <div className="w-28 h-28 rounded-full bg-slate-900 border-2 border-brand-500/40 flex items-center justify-center text-3xl font-bold text-brand-300 shadow-2xl relative z-10">
            {call.contactName ? call.contactName.split(' ').map(n => n[0]).join('') : 'HR'}
          </div>
        </div>
      </div>

      {/* In-Call In-Screen Keypad Popover */}
      {showKeypad && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 mb-4 shadow-xl">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(d => (
              <button
                key={d}
                onClick={() => handleDtmf(d)}
                className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold active:scale-95"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls Grid */}
      <div className="space-y-6 pb-4">
        <div className="grid grid-cols-3 gap-4 max-w-[260px] mx-auto">
          <button
            onClick={() => onToggleMute(!call.isMuted)}
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition border ${
              call.isMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
            }`}
          >
            {call.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowKeypad(!showKeypad)}
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition border ${
              showKeypad
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <KeypadIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => onToggleSpeaker(!call.isSpeaker)}
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center transition border ${
              call.isSpeaker
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
            }`}
          >
            {call.isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center">
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
