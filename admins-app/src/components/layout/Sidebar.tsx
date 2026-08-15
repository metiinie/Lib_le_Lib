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
  Moon,
  Sun,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { role = 'member', logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isAdmin = role === 'admin';
  const isVerification = role === 'verification_officer' || isAdmin;
  const isModerator = role === 'moderator' || isAdmin;
  const isHealth = role === 'health_professional' || isAdmin;

  const navCategories = [
    {
      title: 'Main Navigation',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
      ]
    },
    {
      title: 'Verification & Safety',
      items: [
        { path: '/verification', label: 'ID Verifications', icon: ShieldCheck, visible: isVerification },
        { path: '/moderation', label: 'Safety Reports', icon: Flag, visible: isModerator },
        { path: '/user-safety', label: 'Account Enforcement', icon: UserX, visible: isModerator },
        { path: '/health-qa', label: 'Medical Q&A Desk', icon: Stethoscope, visible: isHealth },
      ]
    },
    {
      title: 'Platform Management',
      items: [
        { path: '/users', label: 'System Users', icon: Users, visible: isAdmin },
        { path: '/subscriptions', label: 'Subscriptions & Billing', icon: CreditCard, visible: isAdmin },
        { path: '/telemetry', label: 'Performance Telemetry', icon: Activity, visible: isAdmin },
        { path: '/resources', label: 'Curated Resources', icon: BookOpen, visible: isAdmin },
        { path: '/stories', label: 'Success Stories', icon: Heart, visible: isAdmin },
        { path: '/audit-logs', label: 'System Audit Logs', icon: ShieldAlert, visible: isAdmin },
      ]
    }
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
        className={`w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col h-screen fixed lg:sticky top-0 z-50 transition-transform duration-200 shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-wide text-base">Lib-le Lib</h1>
              <p className="text-[11px] text-slate-400 font-medium">Control Workspace</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Categorized Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {navCategories.map((category) => {
            const visibleItems = category.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={category.title} className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {category.title}
                </p>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border group ${isActive
                          ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/30 shadow-sm border-l-4 border-l-indigo-500'
                          : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-indigo-400 rotate-90' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 bg-slate-950/30">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors border border-slate-800/60"
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">{theme}</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/15"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Workspace</span>
          </button>
        </div>
      </aside>
    </>
  );
};
