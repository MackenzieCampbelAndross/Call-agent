import React, { useState, useRef } from 'react';
import { Delete, Phone, Layers } from 'lucide-react';
import { soundEffects } from '../audio/soundEffects';
import { formatPhoneNumber } from '@call-agent/shared';

interface DialpadProps {
  onInitiateCall: (phoneNumber: string, simSlotIndex: number) => void;
  selectedSim: number;
  onToggleSim: () => void;
}

const KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export const Dialpad: React.FC<DialpadProps> = ({
  onInitiateCall,
  selectedSim,
  onToggleSim
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const zeroPressTimer = useRef<number | null>(null);

  const handleKeyPress = (digit: string) => {
    soundEffects.playDtmfTone(digit);
    setPhoneNumber(prev => prev + digit);
  };

  const handleZeroTouchStart = () => {
    zeroPressTimer.current = window.setTimeout(() => {
      soundEffects.playDtmfTone('0');
      setPhoneNumber(prev => prev.slice(0, -1) + '+');
    }, 600);
  };

  const handleZeroTouchEnd = () => {
    if (zeroPressTimer.current) {
      clearTimeout(zeroPressTimer.current);
      zeroPressTimer.current = null;
    }
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhoneNumber('');
  };

  const handleCall = () => {
    if (!phoneNumber.trim()) return;
    onInitiateCall(phoneNumber, selectedSim);
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 pb-4 pt-2">
      {/* SIM Selector Header Pill */}
      <div className="flex items-center justify-center">
        <button
          onClick={onToggleSim}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-brand-300 border border-slate-700 transition"
        >
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>{selectedSim === 0 ? 'SIM 1: PurpleDrive HR' : 'SIM 2: Personal BYOD'}</span>
        </button>
      </div>

      {/* Number Display */}
      <div className="min-h-[64px] flex items-center justify-center px-4 relative">
        <div className="text-center font-mono font-bold tracking-wider text-white text-3xl select-all">
          {phoneNumber ? formatPhoneNumber(phoneNumber) : (
            <span className="text-slate-600 text-2xl font-sans font-normal">Enter number...</span>
          )}
        </div>
        {phoneNumber && (
          <button
            onClick={handleDelete}
            onContextMenu={(e) => { e.preventDefault(); handleClear(); }}
            className="absolute right-0 p-2 text-slate-400 hover:text-rose-400 transition"
            title="Backspace (Right-click to clear)"
          >
            <Delete className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto w-full">
        {KEYS.map((k) => (
          <button
            key={k.digit}
            onClick={() => handleKeyPress(k.digit)}
            onMouseDown={k.digit === '0' ? handleZeroTouchStart : undefined}
            onMouseUp={k.digit === '0' ? handleZeroTouchEnd : undefined}
            onTouchStart={k.digit === '0' ? handleZeroTouchStart : undefined}
            onTouchEnd={k.digit === '0' ? handleZeroTouchEnd : undefined}
            className="w-[72px] h-[72px] rounded-full bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-600 active:scale-95 transition flex flex-col items-center justify-center shadow-md border border-slate-700/50"
          >
            <span className="text-2xl font-semibold text-white leading-none">{k.digit}</span>
            {k.letters && (
              <span className="text-[9px] font-bold tracking-widest text-slate-400 mt-0.5 leading-none">
                {k.letters}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Call Button Action Row */}
      <div className="flex items-center justify-center pt-2">
        <button
          onClick={handleCall}
          disabled={!phoneNumber.trim()}
          className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition"
          title="Place Cellular Call"
        >
          <Phone className="w-7 h-7 fill-white" />
        </button>
      </div>
    </div>
  );
};
