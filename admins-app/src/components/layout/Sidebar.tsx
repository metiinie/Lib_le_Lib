import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Flag,
  Users,
  BookOpen,
  Stethoscope,
  Heart,
  LogOut,
  ShieldAlert,
  UserX,
  X,
  CreditCard,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { role = 'member', logout } = useAuth();

  const isAdmin = role === 'admin';
  const isVerification = role === 'verification_officer' || isAdmin;
  const isModerator = role === 'moderator' || isAdmin;
  const isHealth = role === 'health_professional' || isAdmin;

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, visible: true },
    {
      path: '/verification',
      label: 'ID Verifications',
      icon: ShieldCheck,
      visible: isVerification,
    },
    { path: '/moderation', label: 'Safety Reports', icon: Flag, visible: isModerator },
    { path: '/user-safety', label: 'Account Enforcement', icon: UserX, visible: isModerator },
    { path: '/health-qa', label: 'Medical Q&A Desk', icon: Stethoscope, visible: isHealth },
    { path: '/users', label: 'User Directory & Roles', icon: Users, visible: isAdmin },
    { path: '/subscriptions', label: 'Subscription & Billing', icon: CreditCard, visible: isAdmin },
    { path: '/telemetry', label: 'Performance Telemetry', icon: Activity, visible: isAdmin },
    { path: '/resources', label: 'Curated Resources', icon: BookOpen, visible: isAdmin },
    { path: '/stories', label: 'Success Stories', icon: Heart, visible: isAdmin },
    { path: '/audit-logs', label: 'System Audit Trail', icon: ShieldAlert, visible: isAdmin },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed lg:sticky top-0 z-50 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide text-lg">Lib le Lib</h1>
              <p className="text-xs text-slate-400 font-medium">Staff Workspace</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Main Menu
          </p>
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
