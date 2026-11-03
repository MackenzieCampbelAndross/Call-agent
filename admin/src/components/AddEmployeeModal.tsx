import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { adminApi } from '../api/client';

interface AddEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Talent Acquisition');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Employee@PurpleDrive2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminApi.createEmployee({
        name,
        email,
        department,
        registeredPhoneNumber: phone,
        password,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create employee account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-charcoal-900 border border-charcoal-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-charcoal-800 flex items-center justify-between bg-navy-950/60">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Add HR Employee</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rachel Adams"
              className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Corporate Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rachel.adams@purpledrive.internal"
              className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Talent Acquisition">Talent Acquisition</option>
                <option value="Executive Recruiting">Executive Recruiting</option>
                <option value="People Operations">People Operations</option>
                <option value="Campus Hiring">Campus Hiring</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Registered Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+14155550109"
                className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Initial Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-navy-950 border border-charcoal-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Default password provided to employee for mobile dialer login.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-charcoal-800 hover:bg-charcoal-700 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md shadow-purple-900/30 font-bold"
            >
              {loading ? 'Creating...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
