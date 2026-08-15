import React, { useState } from 'react';
import { User } from '../../types';
import {
  Activity,
  Menu,
  Search,
  Command,
  Shield,
  Bell,
  Settings,
  Globe,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { CommandBar } from '../ui/CommandBar';

interface HeaderProps {
  user: User | null;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
  const [isCmdBarOpen, setIsCmdBarOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Super Admin', bg: 'bg-rose-500/20 text-rose-300 border-rose-400/30' };
      case 'verification_officer':
        return { label: 'Verification Officer', bg: 'bg-blue-500/20 text-blue-300 border-blue-400/30' };
      case 'moderator':
        return { label: 'Safety Moderator', bg: 'bg-amber-500/20 text-amber-300 border-amber-400/30' };
      case 'health_professional':
        return { label: 'Health Professional', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' };
      default:
        return { label: 'Staff Member', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <>
      <header className="h-16 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-slate-100 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
        {/* Left Side: App Title / Brand & Mobile Menu */}
        <div className="flex items-center gap-4">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight tracking-wide">
                Admin Panel
              </h1>
              <p className="text-[11px] text-indigo-300/80 font-medium">Lib-le Lib Operations</p>
            </div>
          </div>

          {/* Quick Search Input Trigger */}
          <button
            id="cmd-bar-trigger"
            onClick={() => setIsCmdBarOpen(true)}
            className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all text-xs font-medium group ml-4 w-52 md:w-64"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">Searching workspaces...</span>
            <kbd className="ml-auto hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right Side: Quick Action Utilities & User Identity Pill */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Live System</span>
          </div>

          {/* Icon Actions */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-400 pr-2 border-r border-slate-800">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else if (document.exitFullscreen) {
                  document.exitFullscreen();
                }
              }}
              className="p-2 rounded-lg hover:bg-slate-800/80 hover:text-slate-200 transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-slate-800/80 hover:text-slate-200 transition-colors"
              title="Language Settings"
            >
              <Globe className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-slate-800/80 hover:text-slate-200 transition-colors"
              title="System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                className="p-2 rounded-lg hover:bg-slate-800/80 hover:text-slate-200 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center border border-slate-900">
                3
              </span>
            </div>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 border border-indigo-400/40 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {(user?.profile?.nickname || user?.profile?.displayName || user?.email || 'S')[0].toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-white leading-tight">
                {user?.profile?.nickname || user?.profile?.displayName || user?.email || 'Super Admin'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                {badge.label}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Bar Modal */}
      <CommandBar isOpen={isCmdBarOpen} onClose={() => setIsCmdBarOpen(false)} />
    </>
  );
};
