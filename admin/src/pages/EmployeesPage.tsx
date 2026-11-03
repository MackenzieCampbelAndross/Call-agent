import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { EmployeeAccount, formatDuration } from '@call-agent/shared';
import { UserPlus, Search, PhoneCall, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { AddEmployeeModal } from '../components/AddEmployeeModal';

interface EmployeesPageProps {
  onViewEmployeeCalls: (employeeId: string) => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ onViewEmployeeCalls }) => {
  const [employees, setEmployees] = useState<EmployeeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleToggleStatus = async (employee: EmployeeAccount) => {
    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    if (confirm(`Are you sure you want to ${actionLabel} account for ${employee.name}?`)) {
      try {
        await adminApi.setEmployeeStatus(employee.employeeId, newStatus);
        await fetchEmployees();
      } catch (err: any) {
        alert(err.message || 'Failed to update employee status');
      }
    }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.registeredPhoneNumber.includes(search)
  );

  return (
    <div className="p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">HR Employee Directory</h2>
          <p className="text-xs text-slate-400">
            Registered corporate employees, phone assignments, and calling activity
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Employee</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, phone, department..."
          className="w-full bg-navy-950 border border-charcoal-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Employee Table */}
      <div className="bg-charcoal-900/90 border border-charcoal-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-charcoal-800 bg-navy-950/70 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Employee Details</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Registered Cellular Phone</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Total Calls</th>
                <th className="py-3.5 px-4">Total Talk Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Loading verified employees...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No employees found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-navy-950/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeId} • {emp.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {emp.department}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                      {emp.registeredPhoneNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      {emp.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/40">
                          <XCircle className="w-3 h-3" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {emp.stats?.totalCalls ?? 0}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {formatDuration(emp.stats?.totalDurationSeconds ?? 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewEmployeeCalls(emp.employeeId)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-charcoal-800 hover:bg-charcoal-700 text-purple-300 transition"
                        >
                          View Logs
                        </button>

                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                            emp.status === 'ACTIVE'
                              ? 'bg-rose-950/40 hover:bg-rose-950 text-rose-400 border border-rose-800/40'
                              : 'bg-emerald-950/40 hover:bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          }`}
                        >
                          {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
};
