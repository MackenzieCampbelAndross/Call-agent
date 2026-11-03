import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { DashboardStats, formatDuration } from '@call-agent/shared';
import { StatCard } from '../components/StatCard';
import { DateRangePicker, DateFilterType } from '../components/DateRangePicker';
import {
  PhoneCall,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  RefreshCw,
  Trophy
} from 'lucide-react';

interface DashboardPageProps {
  onSelectCallRecord: (call: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectCallRecord }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30D');

  const fetchStats = async () => {
    setLoading(true);
    try {
      let startMs: number | undefined;
      const now = Date.now();

      if (dateFilter === 'TODAY') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startMs = today.getTime();
      } else if (dateFilter === '7D') {
        startMs = now - 7 * 24 * 60 * 60 * 1000;
      } else if (dateFilter === '30D') {
        startMs = now - 30 * 24 * 60 * 60 * 1000;
      }

      const res = await adminApi.getStats(startMs, now);
      setStats(res);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateFilter]);

  const formatHoursMins = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs === 0) return `${mins}m ${seconds % 60}s`;
    return `${hrs}h ${mins}m`;
  };

  const answeredRate = stats && stats.totalCalls > 0
    ? Math.round((stats.answeredCalls / stats.totalCalls) * 100)
    : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Executive Telephony Overview</h2>
          <p className="text-xs text-slate-400">Live metrics computed from persistent database records</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker selected={dateFilter} onSelect={setDateFilter} />

          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 hover:text-white transition border border-charcoal-800"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cellular Calls"
          value={stats?.totalCalls ?? 0}
          subValue={`${stats?.outgoingCalls ?? 0} Outgoing • ${stats?.incomingCalls ?? 0} Incoming`}
          icon={<PhoneCall className="w-5 h-5" />}
          trend={`${stats?.totalCalls ?? 0} logged`}
          trendType="neutral"
        />

        <StatCard
          label="Total Connected Talk Time"
          value={stats ? formatHoursMins(stats.totalDurationSeconds) : '0m'}
          subValue={`Avg Duration: ${stats ? formatDuration(stats.averageDurationSeconds) : '00:00'}`}
          icon={<Clock className="w-5 h-5" />}
          trend={`${stats?.totalDurationSeconds ?? 0} seconds talk time`}
          trendType="positive"
        />

        <StatCard
          label="Call Answer Rate"
          value={`${answeredRate}%`}
          subValue={`${stats?.answeredCalls ?? 0} answered • ${stats?.missedCalls ?? 0} missed/unanswered`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={answeredRate >= 70 ? 'Optimal' : 'Needs Attention'}
          trendType={answeredRate >= 70 ? 'positive' : 'negative'}
        />

        <StatCard
          label="Active HR Employees"
          value={stats?.uniqueActiveEmployees ?? 0}
          subValue={stats?.syncFailuresCount ? `${stats.syncFailuresCount} sync failures require attention` : 'All records synchronized'}
          icon={<Users className="w-5 h-5" />}
          trend={stats?.syncFailuresCount ? 'Sync alerts pending' : 'Healthy'}
          trendType={stats?.syncFailuresCount ? 'negative' : 'positive'}
        />
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Callers & Breakdown (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top HR Callers Leaderboard */}
          <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Top Active HR Employees by Call Volume</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Ranked by calls</span>
            </div>

            {!stats?.topEmployees || stats.topEmployees.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No calling activity recorded for this period.
              </div>
            ) : (
              <div className="divide-y divide-charcoal-800">
                {stats.topEmployees.map((emp, index) => (
                  <div key={emp.employeeId} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-charcoal-800 border border-charcoal-800 flex items-center justify-center font-bold text-xs text-purple-300">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{emp.employeeName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal-800 text-slate-400">
                            {emp.employeeId}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{emp.department} • {emp.registeredPhoneNumber}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">{emp.callCount} calls</span>
                      <span className="text-[10px] text-purple-300 font-mono block">
                        {formatHoursMins(emp.durationSeconds)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call Volume Breakdown */}
          <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Direction & Connection Distribution</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-navy-950/70 border border-charcoal-800 rounded-2xl">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Outgoing Calls</span>
                  </div>
                  <span className="font-bold text-white">{stats?.outgoingCalls ?? 0}</span>
                </div>
                <div className="w-full h-2 bg-charcoal-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats && stats.totalCalls > 0 ? (stats.outgoingCalls / stats.totalCalls) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-navy-950/70 border border-charcoal-800 rounded-2xl">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Incoming Calls</span>
                  </div>
                  <span className="font-bold text-white">{stats?.incomingCalls ?? 0}</span>
                </div>
                <div className="w-full h-2 bg-charcoal-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats && stats.totalCalls > 0 ? (stats.incomingCalls / stats.totalCalls) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Recent Activity Feed (1/3 width) */}
        <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Call Activity</h3>
            <span className="text-[10px] text-purple-400 font-semibold">Latest 10</span>
          </div>

          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 my-auto">
              No recent calls logged.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {stats.recentActivity.map((r) => (
                <div
                  key={r.callId}
                  onClick={() => onSelectCallRecord(r)}
                  className="p-3 bg-navy-950/60 hover:bg-navy-950 border border-charcoal-800 rounded-2xl cursor-pointer transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">
                      {r.employeeName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(r.startedAt).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono truncate max-w-[140px]">{r.phoneNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      r.outcome === 'COMPLETED' ? 'bg-emerald-950/80 text-emerald-300' :
                      r.outcome === 'MISSED' ? 'bg-rose-950/80 text-rose-300' :
                      'bg-charcoal-800 text-slate-300'
                    }`}>
                      {r.outcome} • {r.connectedDurationSeconds}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
