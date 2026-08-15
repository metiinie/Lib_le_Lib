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
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Ban
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

  const [userContent, setUserContent] = useState<{ bio: string; nickname: string; photos: any[] } | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const openEnforcementModal = async (u: User) => {
    setSelectedUser(u);
    setNewStatus(u.status);
    setUserContent(null);
    setContentLoading(true);
    try {
      const content = await reportsService.getUserContent(u.id);
      setUserContent(content);
    } catch (err: any) {
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  };

  const handleResetBio = async () => {
    if (!selectedUser) return;
    const promptReason = window.prompt('Reason for resetting bio:');
    if (!promptReason) return;

    try {
      await reportsService.resetBio(selectedUser.id, promptReason);
      showToast('Bio Reset', 'The user bio has been successfully reset.', 'success');
      if (userContent) {
        setUserContent({ ...userContent, bio: '[Removed by Moderator]' });
      }
    } catch (err: any) {
      showToast('Failed to Reset Bio', err?.response?.data?.error?.message || 'Error', 'error');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedUser) return;
    const promptReason = window.prompt('Reason for deleting this photo:');
    if (!promptReason) return;

    try {
      await reportsService.deletePhoto(selectedUser.id, photoId, promptReason);
      showToast('Photo Deleted', 'The photo has been permanently deleted.', 'success');
      if (userContent) {
        setUserContent({
          ...userContent,
          photos: userContent.photos.filter((p) => p.id !== photoId),
        });
      }
    } catch (err: any) {
      showToast('Failed to Delete Photo', err?.response?.data?.error?.message || 'Error', 'error');
    }
  };

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
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member by email, phone, or UUID for enforcement..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 text-xs"
          >
            {loading ? 'Searching...' : 'Search Account'}
          </button>
        </form>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Searched Accounts</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : users.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center justify-center shadow-sm">
            <Search className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-rose-400 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Suspended Accounts</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : users.filter(u => u.status === 'suspended').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-rose-400/30 text-rose-400 bg-rose-500/10 flex items-center justify-center shadow-sm">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-cyan-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Permanently Banned</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : users.filter(u => u.status === 'banned').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-sm">
            <Ban className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Active Good Standing</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : users.filter(u => u.status === 'active' || u.status === 'verified').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Section with Vertical Accent Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Section Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-100">
              Account Standing & Disciplinary Records
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Found {users.length} Account(s)</span>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">Search for a member account to manage enforcement standing</p>
            <p className="text-xs text-slate-600 mt-1">Enter user email, phone number, or UUID above.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Member Profile</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Role</th>
                <th className="p-4">Standing Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="font-bold text-slate-200">
                      {u.profile?.nickname || 'Unnamed User'}
                    </div>
                    <div className="font-mono text-xs text-slate-500">{u.id}</div>
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-300">
                    {u.email && <div>{u.email}</div>}
                    {(u.phone || u.phoneNumber) && (
                      <div className="text-slate-500">{u.phone || u.phoneNumber}</div>
                    )}
                  </td>
                  <td className="p-4 text-xs font-bold text-indigo-400 capitalize">
                    {u.role.replace('_', ' ')}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => openEnforcementModal(u)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 inline-flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Enforce Standing</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Account Status Enforcement Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <form
              onSubmit={handleUpdateStatus}
              className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Enforce Account Status
                </h3>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="text-slate-400">Target User:</p>
                <p className="font-bold text-slate-200">
                  {selectedUser.profile?.nickname || selectedUser.email || selectedUser.id}
                </p>
                <p className="font-mono text-xs text-slate-500">{selectedUser.id}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Account Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500 capitalize"
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="suspended">Suspended (Temporary Freeze)</option>
                  <option value="banned">Banned (Permanent Ban)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Reason / Rationale
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Log internal reason for status change..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 h-20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Enforcing...' : 'Apply Status Change'}
                </button>
              </div>
            </form>

            {/* Granular Content Moderation Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 p-6 shadow-2xl space-y-5">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                Granular Profile Content
              </h3>

              {contentLoading ? (
                <div className="text-slate-400 text-xs animate-pulse">Loading user content...</div>
              ) : userContent ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Bio Description
                      </label>
                      <button
                        onClick={handleResetBio}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset Bio
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-200 min-h-[3.5rem] font-medium">
                      {userContent.bio || <span className="text-slate-600 italic">No bio provided.</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      User Photos ({userContent.photos.length})
                    </label>
                    {userContent.photos.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No photos uploaded.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {userContent.photos.map((photo) => (
                          <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-[3/4] bg-slate-950">
                            <img
                              src={photo.url}
                              alt="User upload"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Photo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs">Failed to load content or no profile exists.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
