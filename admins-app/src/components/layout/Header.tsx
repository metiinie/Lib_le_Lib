import React from 'react';
import { User } from '../../types';
import { Activity, Menu } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'verification_officer':
        return { label: 'Verification Officer', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'moderator':
        return { label: 'Moderator', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'health_professional':
        return { label: 'Health Professional', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      default:
        return { label: 'Staff Member', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
            title="Open Mobile Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Backend Connected</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border ${badge.bg}`}
        >
          {badge.label}
        </span>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-sm">
            {(user?.profile?.nickname || user?.profile?.displayName || user?.email || 'S')[0].toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-slate-200">
              {user?.profile?.nickname || user?.profile?.displayName || user?.email || 'Staff Member'}
            </p>
            <p className="text-xs text-slate-400">{user?.email || 'Authenticated'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
