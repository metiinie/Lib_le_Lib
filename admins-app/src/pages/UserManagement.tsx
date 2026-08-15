import React, { useState, useEffect } from 'react';
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
  Sparkles
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
  const [activeTab, setActiveTab] = useState<'directory' | 'matrix'>('directory');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            User Directory & Staff Authorization
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage user accounts, assign staff role authorizations, and inspect role permissions (Admin Only).
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Shield className="w-4 h-4" />
            <span>Role Permissions Matrix</span>
          </button>
        </div>
      </div>

      {/* Directory Tab View */}
      {activeTab === 'directory' && (
        <>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${roleFilter === r
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
                              {(u.profile?.nickname || u.profile?.displayName || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-200">
                                {u.profile?.nickname || u.profile?.displayName || 'Unnamed Profile'}
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
                            {u.role.replace(/_/g, ' ')}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Role Authorization Matrix</h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive permission map enforced by NestJS JwtAuthGuard & RolesGuard
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Guards Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
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
                        <p className="font-semibold text-slate-200">{item.workspace}</p>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
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
