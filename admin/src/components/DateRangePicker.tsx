import React from 'react';
import { Calendar } from 'lucide-react';

export type DateFilterType = 'TODAY' | '7D' | '30D' | 'ALL';

interface DateRangePickerProps {
  selected: DateFilterType;
  onSelect: (type: DateFilterType) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ selected, onSelect }) => {
  const OPTIONS: Array<{ id: DateFilterType; label: string }> = [
    { id: 'TODAY', label: 'Today' },
    { id: '7D', label: 'Past 7 Days' },
    { id: '30D', label: 'Past 30 Days' },
    { id: 'ALL', label: 'All Time' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-charcoal-800/80 rounded-xl border border-charcoal-800 text-xs font-semibold">
      <div className="pl-2 pr-1 text-slate-400">
        <Calendar className="w-3.5 h-3.5" />
      </div>
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`px-3 py-1.5 rounded-lg transition ${
            selected === opt.id
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-charcoal-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
