import React, { useState } from 'react';
import { CallStateEvent, formatDuration, formatPhoneNumber } from '@call-agent/shared';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Hash as KeypadIcon,
  Pause,
  Play,
  PhoneOff,
  Radio,
  Layers
} from 'lucide-react';
import { soundEffects } from '../audio/soundEffects';

interface OngoingCallScreenProps {
  call: CallStateEvent;
  durationSeconds: number;
  onEndCall: () => void;
  onToggleMute: (muted: boolean) => void;
  onToggleSpeaker: (speaker: boolean) => void;
  onToggleHold: (onHold: boolean) => void;
}

export const OngoingCallScreen: React.FC<OngoingCallScreenProps> = ({
  call,
  durationSeconds,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleHold,
}) => {
  const [showKeypad, setShowKeypad] = useState(false);

  const simName = call.simSlotIndex === 1 ? 'SIM 2 (Personal)' : 'SIM 1 (PurpleDrive HR)';
  const isOnHold = call.state === 'HOLDING' || call.isOnHold;

  const handleDtmf = (digit: string) => {
    soundEffects.playDtmfTone(digit);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl z-50 flex flex-col justify-between p-6 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="text-center pt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-brand-300 mb-2 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>{simName}</span>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-2">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{isOnHold ? 'CALL ON HOLD' : 'HD CELLULAR VOICE ACTIVE'}</span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {call.contactName || formatPhoneNumber(call.phoneNumber)}
        </h2>

        {call.contactName && (
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            {formatPhoneNumber(call.phoneNumber)}
          </p>
        )}

        {/* Live Connected Duration Chronometer */}
        <div className="mt-3 font-mono font-bold text-2xl text-slate-200 tracking-wider">
          {formatDuration(durationSeconds)}
        </div>
      </div>

      {/* In-Call Keypad Overlay if opened */}
      {showKeypad ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 my-auto shadow-2xl">
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(d => (
              <button
                key={d}
                onClick={() => handleDtmf(d)}
                className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-lg active:scale-95 transition"
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowKeypad(false)}
            className="w-full mt-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            Hide Keypad
          </button>
        </div>
      ) : (
        /* Center In-Call Graphic / Avatar */
        <div className="flex items-center justify-center my-auto">
          <div className="w-24 h-24 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl font-bold text-brand-300 shadow-xl">
            {call.contactName ? call.contactName.split(' ').map(n => n[0]).join('') : 'HR'}
          </div>
        </div>
      )}

      {/* In-Call Actions Grid */}
      <div className="space-y-6 pb-4">
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {/* Mute Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onToggleMute(!call.isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                call.isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              {call.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <span className="text-[10px] text-slate-400">
              {call.isMuted ? 'Unmute' : 'Mute'}
            </span>
          </div>

          {/* Keypad Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowKeypad(!showKeypad)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                showKeypad
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <KeypadIcon className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-slate-400">Keypad</span>
          </div>

          {/* Speaker Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onToggleSpeaker(!call.isSpeaker)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                call.isSpeaker
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              {call.isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <span className="text-[10px] text-slate-400">
              {call.isSpeaker ? 'Earpiece' : 'Speaker'}
            </span>
          </div>

          {/* Hold Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onToggleHold(!isOnHold)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition border ${
                isOnHold
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <span className="text-[10px] text-slate-400">
              {isOnHold ? 'Resume' : 'Hold'}
            </span>
          </div>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center">
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition"
            title="End Ongoing Call"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
