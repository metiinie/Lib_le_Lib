import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/ui/StatCard';
import {
  ShieldCheck,
  Flag,
  Users,
  Stethoscope,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  UserCheck,
  UserX,
  Activity,
  CreditCard,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { usersService, AdminStats } from '../services/users.service';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  user?: User | null;
  onNavigate?: (tab: string) => void;
}

interface TileConfig {
  tab: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  roles: UserRole[];
}

const WORKSPACE_TILES: TileConfig[] = [
  {
    tab: 'verification',
    title: 'Identity Verification',
    description: 'Inspect government ID photos & liveness selfie checks.',
    icon: ShieldCheck,
    color: 'blue',
    roles: ['verification_officer', 'admin'],
  },
  {
    tab: 'moderation',
    title: 'Safety Reports',
    description: 'Review safety complaints & issue warnings or bans.',
    icon: Flag,
    color: 'amber',
    roles: ['moderator', 'admin'],
  },
  {
    tab: 'user-safety',
    title: 'Account Enforcement',
    description: 'Suspend or ban users directly from their profile.',
    icon: UserX,
    color: 'orange',
    roles: ['moderator', 'admin'],
  },
  {
    tab: 'health-qa',
    title: 'Medical Q&A Desk',
    description: 'Answer member health questions with evidence-based replies.',
    icon: Stethoscope,
    color: 'emerald',
    roles: ['health_professional', 'admin'],
  },
  {
    tab: 'users',
    title: 'User Directory & Roles',
    description: 'Search users and assign staff role authorizations.',
    icon: Users,
    color: 'rose',
    roles: ['admin'],
  },
  {
    tab: 'subscriptions',
    title: 'Subscription & Billing',
    description: 'View, filter, and manage active user subscriptions.',
    icon: CreditCard,
    color: 'indigo',
    roles: ['admin'],
  },
  {
    tab: 'telemetry',
    title: 'Performance Telemetry',
    description: 'Monitor p95 latency budgets for critical API endpoints.',
    icon: Activity,
    color: 'cyan',
    roles: ['admin'],
  },
  {
    tab: 'resources',
    title: 'Curated Resources',
    description: 'Publish and manage HIV wellness articles.',
    icon: BookOpen,
    color: 'purple',
    roles: ['admin'],
  },
  {
    tab: 'stories',
    title: 'Success Stories',
    description: 'Review and approve member-submitted testimonials.',
    icon: Heart,
    color: 'pink',
    roles: ['admin'],
  },
  {
    tab: 'audit-logs',
    title: 'System Audit Trail',
    description: 'Inspect system activity log events & staff actions.',
    icon: ShieldAlert,
    color: 'slate',
    roles: ['admin'],
  },
];

const TILE_ACCENT_CLASSES: Record<string, { border: string; icon: string; arrow: string }> = {
  blue: {
    border: 'hover:border-blue-500/40',
    icon: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    arrow: 'group-hover:text-blue-400',
  },
  amber: {
    border: 'hover:border-amber-500/40',
    icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    arrow: 'group-hover:text-amber-400',
  },
  orange: {
    border: 'hover:border-orange-500/40',
    icon: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    arrow: 'group-hover:text-orange-400',
  },
  emerald: {
    border: 'hover:border-emerald-500/40',
    icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    arrow: 'group-hover:text-emerald-400',
  },
  rose: {
    border: 'hover:border-rose-500/40',
    icon: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    arrow: 'group-hover:text-rose-400',
  },
  purple: {
    border: 'hover:border-purple-500/40',
    icon: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    arrow: 'group-hover:text-purple-400',
  },
  slate: {
    border: 'hover:border-slate-600',
    icon: 'bg-slate-800 text-slate-400 border-slate-700',
    arrow: 'group-hover:text-slate-300',
  },
  indigo: {
    border: 'hover:border-indigo-500/40',
    icon: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    arrow: 'group-hover:text-indigo-400',
  },
  cyan: {
    border: 'hover:border-cyan-500/40',
    icon: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    arrow: 'group-hover:text-cyan-400',
  },
  pink: {
    border: 'hover:border-pink-500/40',
    icon: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    arrow: 'group-hover:text-pink-400',
  },
};

export const Dashboard: React.FC<DashboardProps> = ({ user: propUser, onNavigate }) => {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      usersService
        .getAdminStats()
        .then((data) => setStats(data))
        .catch(() => setStats(null));
    }
  }, [user]);

  const visibleTiles = WORKSPACE_TILES.filter(
    (tile) => user?.role && tile.roles.includes(user.role as UserRole)
  );

  const handleTileClick = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      navigate(`/${tab}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-8 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Lib le Lib Staff Console
          </span>
          <h1 className="text-3xl font-bold text-slate-100 mt-3">
            Welcome back, {user?.profile?.nickname || user?.profile?.displayName || user?.email || 'Staff Member'} 👋
          </h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Your role is assigned as{' '}
            <strong className="text-indigo-400 capitalize">{user?.role?.replace(/_/g, ' ')}</strong>.
            Select a workspace below to begin your session.
          </p>
        </div>
      </div>

      {/* Metrics Grid — Admin Only */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats ? stats.totalUsers : '—'}
            description="Registered accounts"
            icon={Users}
            color="indigo"
          />
          <StatCard
            title="Staff Members"
            value={
              stats
                ? stats.roles.admin +
                  stats.roles.verification_officer +
                  stats.roles.moderator +
                  stats.roles.health_professional
                : '—'
            }
            description="Assigned staff roles"
            icon={ShieldAlert}
            color="rose"
          />
          <StatCard
            title="Active Members"
            value={stats ? stats.roles.member : '—'}
            description="Client users"
            icon={UserCheck}
            color="emerald"
          />
          <StatCard
            title="Platform Activity"
            value="Live"
            description="Real-time monitoring"
            icon={Activity}
            color="purple"
          />
        </div>
      )}

      {/* Quick Workspace Tiles — role-filtered */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-4">Quick Workspaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleTiles.map((tile) => {
            const Icon = tile.icon;
            const accent = TILE_ACCENT_CLASSES[tile.color] || TILE_ACCENT_CLASSES.slate;
            return (
              <button
                key={tile.tab}
                onClick={() => handleTileClick(tile.tab)}
                className={`p-6 bg-slate-900 border border-slate-800 rounded-xl text-left ${accent.border} transition-all group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl border ${accent.icon}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowUpRight
                    className={`w-5 h-5 text-slate-600 ${accent.arrow} transition-colors`}
                  />
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-slate-100 transition-colors">
                  {tile.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{tile.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
