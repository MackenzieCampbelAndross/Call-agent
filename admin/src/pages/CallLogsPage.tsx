import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { CallRecord, EmployeeAccount, formatDuration } from '@call-agent/shared';
import {
  Download,
  Search,
  Filter,
  Eye,
  EyeOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface CallLogsPageProps {
  onSelectCallRecord: (call: CallRecord) => void;
}

export const CallLogsPage: React.FC<CallLogsPageProps> = ({ onSelectCallRecord }) => {
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('ALL');
  const [selectedDirection, setSelectedDirection] = useState('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [maskPhones, setMaskPhones] = useState(false);

  const fetchEmployees = async () => {
    try {
      const emps = await adminApi.getEmployees();
      setEmployees(emps);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCalls({
        employeeId: selectedEmployee !== 'ALL' ? selectedEmployee : undefined,
        direction: selectedDirection !== 'ALL' ? selectedDirection : undefined,
        outcome: selectedOutcome !== 'ALL' ? selectedOutcome : undefined,
        phoneSearch: searchQuery.trim() || undefined,
        page,
        limit: 20,
      });
      setRecords(res.records);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [page, selectedEmployee, selectedDirection, selectedOutcome, searchQuery]);

  const handleExportCsv = () => {
    const url = adminApi.getCsvExportUrl({
      employeeId: selectedEmployee !== 'ALL' ? selectedEmployee : undefined,
      direction: selectedDirection !== 'ALL' ? selectedDirection : undefined,
      outcome: selectedOutcome !== 'ALL' ? selectedOutcome : undefined,
    });
    window.open(url, '_blank');
  };

  const formatIST = (epochMs: number) => {
    return new Date(epochMs).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const displayPhone = (phone?: string) => {
    if (!phone) return '—';
    if (!maskPhones) return phone;
    if (phone.length <= 4) return '****';
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
  };

  const getDirectionIcon = (r: CallRecord) => {
    if (r.outcome === 'MISSED' || r.outcome === 'UNANSWERED' || r.outcome === 'REJECTED') {
      return <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />;
    }
    if (r.direction === 'INCOMING') {
      return <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Organization Call Records</h2>
          <p className="text-xs text-slate-400">
            Audit logs for all employee cellular calls • Timestamps displayed in Indian Standard Time (IST)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMaskPhones(!maskPhones)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 border border-charcoal-800 transition"
          >
            {maskPhones ? <Eye className="w-3.5 h-3.5 text-purple-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{maskPhones ? 'Reveal Numbers' : 'Mask Phone Numbers'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search phone or contact..."
            className="w-full bg-navy-950 border border-charcoal-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Employee Filter */}
        <div>
          <select
            value={selectedEmployee}
            onChange={(e) => { setSelectedEmployee(e.target.value); setPage(1); }}
            className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Employees</option>
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name} ({e.employeeId})
              </option>
            ))}
          </select>
        </div>

        {/* Direction Filter */}
        <div>
          <select
            value={selectedDirection}
            onChange={(e) => { setSelectedDirection(e.target.value); setPage(1); }}
            className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Directions</option>
            <option value="OUTGOING">Outgoing Calls</option>
            <option value="INCOMING">Incoming Calls</option>
          </select>
        </div>

        {/* Outcome Filter */}
        <div>
          <select
            value={selectedOutcome}
            onChange={(e) => { setSelectedOutcome(e.target.value); setPage(1); }}
            className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Call Outcomes</option>
            <option value="COMPLETED">Completed (Connected)</option>
            <option value="MISSED">Missed</option>
            <option value="REJECTED">Rejected</option>
            <option value="UNANSWERED">Unanswered</option>
            <option value="BUSY">Busy</option>
            <option value="FAILED">Failed</option>
            <option value="INTERRUPTED">Interrupted</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-charcoal-800 bg-navy-950/70 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Registered Number</th>
                <th className="py-3.5 px-4">Contact (Other Party)</th>
                <th className="py-3.5 px-4">Direction</th>
                <th className="py-3.5 px-4">Start Time (IST)</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">SIM Account</th>
                <th className="py-3.5 px-4">Sync Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Loading verified database records...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No call records found matching criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.callId}
                    onClick={() => onSelectCallRecord(r)}
                    className="hover:bg-navy-950/40 cursor-pointer transition"
                  >
                    {/* Employee */}
                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{r.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.employeeId}</div>
                    </td>

                    {/* Registered Number */}
                    <td className="py-3 px-4 font-mono text-purple-300">
                      {displayPhone(r.registeredPhoneNumber || '+14155550100')}
                    </td>

                    {/* Contact Number */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{r.contactName || 'Unknown Contact'}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{displayPhone(r.phoneNumber)}</div>
                    </td>

                    {/* Direction */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        {getDirectionIcon(r)}
                        <span>{r.direction}</span>
                      </div>
                    </td>

                    {/* Start Time (IST) */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatIST(r.startedAt)}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatDuration(r.connectedDurationSeconds)}
                      <span className="text-[10px] text-slate-400 font-normal block font-sans">
                        {r.connectedDurationSeconds}s
                      </span>
                    </td>

                    {/* Outcome */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.outcome === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                        r.outcome === 'MISSED' ? 'bg-rose-950 text-rose-300 border border-rose-800/40' :
                        'bg-charcoal-800 text-slate-300 border border-charcoal-800'
                      }`}>
                        {r.outcome}
                      </span>
                    </td>

                    {/* SIM */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {r.simDisplayName}
                    </td>

                    {/* Sync Status */}
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Synced</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCallRecord(r);
                        }}
                        className="text-purple-400 hover:text-purple-300 text-[11px] font-semibold underline underline-offset-2"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-charcoal-800 flex items-center justify-between text-xs text-slate-400 bg-navy-950/40">
          <span>Showing {records.length} of {total} total call records</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-40 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white px-2">Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-40 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
