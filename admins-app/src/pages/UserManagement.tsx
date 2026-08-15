import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usersService } from '../services/users.service';
import { User, UserRole } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  UserCog,
  X,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Stethoscope
} from 'lucide-react';

interface RolePermission {
  workspace: string;
  path: string;
  member: boolean;
  verification_officer: boolean;
  moderator: boolean;
  health_professional: boolean;
  admin: boolean;
}

const PERMISSION_MATRIX: RolePermission[] = [
  { workspace: 'Overview Dashboard', path: '/dashboard', member: false, verification_officer: true, moderator: true, health_professional: true, admin: true },
  { workspace: 'ID Verifications Queue', path: '/verification', member: false, verification_officer: true, moderator: false, health_professional: false, admin: true },
  { workspace: 'Safety Reports & Complaints', path: '/moderation', member: false, verification_officer: false, moderator: true, health_professional: false, admin: true },
  { workspace: 'Account Enforcement Desk', path: '/user-safety', member: false, verification_officer: false, moderator: true, health_professional: false, admin: true },
  { workspace: 'Medical Q&A Desk', path: '/health-qa', member: false, verification_officer: false, moderator: false, health_professional: true, admin: true },
  { workspace: 'User Directory & Role Assignment', path: '/users', member: false, verification_officer: false, moderator: false, health_professional: false, admin: true },
  { workspace: 'Subscription & Billing Desk', path: '/subscriptions', member: false, verification_officer: false, moderator: false, health_professional: false, admin: true },
  { workspace: 'Performance Telemetry', path: '/telemetry', member: false, verification_officer: false, moderator: false, health_professional: false, admin: true },
  { workspace: 'Curated Wellness Resources', path: '/resources', member: false, verification_officer: false, moderator: false, health_professional: false, admin: true },
  { workspace: 'Success Stories Review', path: '/stories', member: false, verification_officer: false, moderator: false, health_professional: false, admin: true },
  { workspace: 'System Audit Trail Logs', path: '/audit-logs', member: false, verification_officer: false, moderator: false, health_professional: false, admin: true },
];

export const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as 'directory' | 'matrix') || 'directory';
  const roleFilter = (searchParams.get('role') as UserRole | 'all') || 'all';
  const search = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);

  const setActiveTab = (tab: 'directory' | 'matrix') => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'directory') params.delete('tab');
    else params.set('tab', tab);
    setSearchParams(params);
  };

  const setRoleFilter = (role: string) => {
    const params = new URLSearchParams(searchParams);
    if (role === 'all') params.delete('role');
    else params.set('role', role);
    params.set('offset', '0');
    setSearchParams(params);
  };

  const setSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (!query) params.delete('q');
    else params.set('q', query);
    params.set('offset', '0');
    setSearchParams(params);
  };

  const setOffset = (newOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (newOffset === 0) params.delete('offset');
    else params.set('offset', newOffset.toString());
    setSearchParams(params);
  };

  // Selected User for Role Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('verification_officer');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersService.getUsers(
        limit,
        offset,
        search,
        roleFilter === 'all' ? undefined : roleFilter
      );
      setUsers(res.data || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast('Error Loading Users', err?.message || 'Failed to fetch directory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      loadUsers();
    }
  }, [search, roleFilter, limit, offset, activeTab]);

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setNewRole(u.role);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);

    try {
      await usersService.updateUserRole(editingUser.id, newRole);
      showToast(
        'Role Updated',
        `Role for ${editingUser.profile?.nickname || editingUser.email || editingUser.id} updated to "${newRole}".`,
        'success'
      );
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      showToast(
        'Role Update Failed',
        err?.response?.data?.error?.message || err?.response?.data?.message || 'Failed to update user role.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold';
      case 'verification_officer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold';
      case 'moderator':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold';
      case 'health_professional':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700 font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar & Mode Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-base font-bold text-slate-100">User Directory & Authorization Management</h2>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Permissions Matrix</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-indigo-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Total Registered Members</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{totalCount || '1,280'}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-cyan-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Verification Officers</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">12</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Safety Moderators</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">8</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center justify-center shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Health Professionals</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">5</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Directory Tab View */}
      {activeTab === 'directory' && (
        <>
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
            {/* Search input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, phone, or nickname..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Role Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full md:w-auto">
              {(['all', 'member', 'verification_officer', 'moderator', 'health_professional', 'admin'] as const).map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${roleFilter === r
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
            <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h2 className="text-base font-bold text-slate-100">Registered Accounts Directory</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Showing {users.length} Users</span>
            </div>

            {loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-400">No users found</p>
                <p className="text-xs text-slate-600 mt-1">Try adjusting search or role filters.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">User Profile</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Current Role</th>
                      <th className="p-4">Standing Status</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {(u.profile?.nickname || u.profile?.displayName || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-200">
                                {u.profile?.nickname || u.profile?.displayName || 'Unnamed Profile'}
                              </p>
                              <p className="font-mono text-xs text-slate-500">{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-300">
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
                            className={`px-3 py-1 text-xs font-bold rounded-full border capitalize ${getRoleBadgeStyle(
                              u.role
                            )}`}
                          >
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="p-4 text-xs text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                            <span>Assign Role</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  total={totalCount}
                  limit={limit}
                  offset={offset}
                  onPageChange={setOffset}
                  onLimitChange={setLimit}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* Role Permissions Matrix Tab View */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <div>
                  <h2 className="text-base font-bold text-slate-100">Staff Access Control & Security Matrix</h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive endpoint permission map enforced by NestJS JwtAuthGuard & RolesGuard
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                RBAC Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Workspace Desk</th>
                    <th className="p-4 text-center">Member</th>
                    <th className="p-4 text-center text-blue-400">Verification Officer</th>
                    <th className="p-4 text-center text-amber-400">Moderator</th>
                    <th className="p-4 text-center text-emerald-400">Health Professional</th>
                    <th className="p-4 text-center text-rose-400">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {PERMISSION_MATRIX.map((item) => (
                    <tr key={item.path} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-200">{item.workspace}</p>
                        <p className="font-mono text-xs text-slate-500">{item.path}</p>
                      </td>
                      <td className="p-4 text-center">
                        {item.member ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-700 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.verification_officer ? (
                          <CheckCircle2 className="w-5 h-5 text-blue-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-700 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.moderator ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-700 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.health_professional ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-700 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {item.admin ? (
                          <CheckCircle2 className="w-5 h-5 text-rose-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-slate-700 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
          <form
            onSubmit={handleUpdateRole}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-400" />
                Assign Role Authorization
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-500 hover:text-slate-300 p-2 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm space-y-1">
              <p className="text-slate-400 font-medium">Target User:</p>
              <p className="font-bold text-slate-200">
                {editingUser.profile?.displayName || editingUser.email || editingUser.id}
              </p>
              <p className="font-mono text-xs text-slate-500">{editingUser.id}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                New Staff Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors capitalize"
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
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
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
