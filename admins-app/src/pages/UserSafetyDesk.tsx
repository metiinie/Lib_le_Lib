import React, { useState } from 'react';
import { usersService } from '../services/users.service';
import { reportsService } from '../services/reports.service';
import { User, UserStatus } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  Search,
  UserX,
  AlertTriangle,
} from 'lucide-react';

export const UserSafetyDesk: React.FC = () => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>('suspended');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);

    try {
      const res = await usersService.getUsers(50, 0, search.trim());
      setUsers(res.data || []);
    } catch (err: any) {
      showToast('Search Failed', err?.response?.data?.error?.message || 'Failed to search users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      await reportsService.updateUserStatus(selectedUser.id, newStatus, reason);
      showToast(
        'Account Status Updated',
        `Successfully updated ${selectedUser.profile?.nickname || selectedUser.email || selectedUser.id} account status to "${newStatus}".`,
        'success'
      );
      setSelectedUser(null);
      setReason('');
      // Refresh list
      if (search.trim()) {
        const res = await usersService.getUsers(50, 0, search.trim());
        setUsers(res.data || []);
      }
    } catch (err: any) {
      showToast('Enforcement Failed', err?.response?.data?.error?.message || 'Failed to update user status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 text-amber-400" />
          Account Enforcement Desk
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Directly inspect member account standings, issue safety suspensions, or revoke account bans.
        </p>
      </div>

      {/* Search Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white">Search Account to Enforce</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter user email, phone number, or user UUID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 text-sm"
          >
            {loading ? 'Searching...' : 'Search Account'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {users.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-semibold text-slate-200">
                      {u.profile?.displayName || 'Unnamed User'}
                    </p>
                    <p className="font-mono text-xs text-slate-500">{u.id}</p>
                  </td>
                  <td className="p-4 text-xs text-slate-300">
                    {u.email && <div>{u.email}</div>}
                    {(u.phone || u.phoneNumber) && (
                      <div className="text-slate-500">{u.phone || u.phoneNumber}</div>
                    )}
                  </td>
                  <td className="p-4 text-xs font-medium text-indigo-400 capitalize">
                    {u.role.replace('_', ' ')}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setNewStatus(u.status);
                      }}
                      className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Enforce Status</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Account Status Enforcement Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <form
            onSubmit={handleUpdateStatus}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Enforce Account Status
              </h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm space-y-1">
              <p className="text-slate-400">Target User:</p>
              <p className="font-semibold text-slate-200">
                {selectedUser.profile?.displayName || selectedUser.email || selectedUser.id}
              </p>
              <p className="font-mono text-xs text-slate-500">{selectedUser.id}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Account Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 capitalize"
              >
                <option value="active">Active (Full Access)</option>
                <option value="suspended">Suspended (Temporary Freeze)</option>
                <option value="banned">Banned (Permanent Ban)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Reason / Enforcement Rationale
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Log internal reason for status change..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 h-20"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-[2] py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 text-sm font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Enforcing...' : 'Apply Status Change'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
