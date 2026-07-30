import React, { useState, useEffect } from 'react';
import { usersService } from '../services/users.service';
import { User, UserRole } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  UserCog,
  X,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [totalCount, setTotalCount] = useState(0);

  // Selected User for Role Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('verification_officer');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersService.getUsers(
        50,
        0,
        search,
        roleFilter === 'all' ? undefined : roleFilter
      );
      setUsers(res.data || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNewRole(u.role);
    setStatusMsg(null);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    setStatusMsg(null);

    try {
      await usersService.updateUserRole(editingUser.id, newRole);
      setStatusMsg({
        type: 'success',
        text: `Role for ${editingUser.email || editingUser.id} updated to "${newRole}".`,
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to update user role.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'verification_officer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'moderator':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'health_professional':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            User Directory & Staff Roles
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search users, inspect account statuses, and manage staff authorizations (Admin Only).
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, phone, or name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Role Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
          {(['all', 'member', 'verification_officer', 'moderator', 'health_professional', 'admin'] as const).map(
            (r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading user directory...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No users found</p>
            <p className="text-xs text-slate-600 mt-1">Try adjusting search or role filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Current Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-sm">
                        {u.profile?.displayName?.[0]?.toUpperCase() ||
                          u.email?.[0]?.toUpperCase() ||
                          'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">
                          {u.profile?.displayName || 'Unnamed Profile'}
                        </p>
                        <p className="font-mono text-xs text-slate-500">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-300">
                    {u.email && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{u.email}</span>
                      </div>
                    )}
                    {(u.phoneNumber || u.phone) && (
                      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{u.phoneNumber || u.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${getRoleBadgeStyle(
                        u.role
                      )}`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-3.5 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <UserCog className="w-3.5 h-3.5" />
                      <span>Change Role</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <form
            onSubmit={handleUpdateRole}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-400" />
                Assign Role Authorization
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-500 hover:text-slate-300 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm space-y-1">
              <p className="text-slate-400 font-medium">Target User:</p>
              <p className="font-semibold text-slate-200">
                {editingUser.profile?.displayName || editingUser.email || editingUser.id}
              </p>
              <p className="font-mono text-xs text-slate-500">{editingUser.id}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                New Staff Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors capitalize"
              >
                <option value="member">Member (Regular User)</option>
                <option value="verification_officer">
                  Verification Officer (Document Reviewer)
                </option>
                <option value="moderator">Moderator (Safety & Report Manager)</option>
                <option value="health_professional">
                  Health Professional (Doctor/Nurse Q&A)
                </option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
              >
                {actionLoading ? 'Updating Role...' : 'Save Role Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
