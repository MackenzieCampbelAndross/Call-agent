import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  trendType = 'positive',
}) => {
  return (
    <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <div className="p-2 rounded-xl bg-charcoal-800 text-purple-400 border border-charcoal-800">
          {icon}
        </div>
      </div>

      <div>
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        {subValue && <div className="text-[11px] text-slate-400 mt-0.5">{subValue}</div>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-charcoal-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">vs Previous Period</span>
          <span className={`font-semibold ${
            trendType === 'positive' ? 'text-emerald-400' : trendType === 'negative' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
