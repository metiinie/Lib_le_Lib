import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  ShieldCheck,
  Flag,
  UserX,
  Stethoscope,
  Users,
  CreditCard,
  Activity,
  BookOpen,
  Heart,
  ShieldAlert,
  X,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
  description: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'dashboard',
    title: 'Overview Dashboard',
    category: 'Workspaces',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'verification_officer', 'moderator', 'health_professional'],
    description: 'System metrics and primary workspace access',
  },
  {
    id: 'verification',
    title: 'ID Verification Queue',
    category: 'Workspaces',
    path: '/verification',
    icon: ShieldCheck,
    roles: ['verification_officer', 'admin'],
    description: 'Review pending identity documents & selfie checks',
  },
  {
    id: 'moderation',
    title: 'Safety Reports & Flags',
    category: 'Workspaces',
    path: '/moderation',
    icon: Flag,
    roles: ['moderator', 'admin'],
    description: 'Investigate member safety reports and policy violations',
  },
  {
    id: 'user-safety',
    title: 'Account Enforcement Desk',
    category: 'Workspaces',
    path: '/user-safety',
    icon: UserX,
    roles: ['moderator', 'admin'],
    description: 'Issue warnings, temporary suspensions, or permanent bans',
  },
  {
    id: 'health-qa',
    title: 'Medical Q&A Desk',
    category: 'Workspaces',
    path: '/health-qa',
    icon: Stethoscope,
    roles: ['health_professional', 'admin'],
    description: 'Answer confidential member health questions',
  },
  {
    id: 'users',
    title: 'User Directory & Roles',
    category: 'Administration',
    path: '/users',
    icon: Users,
    roles: ['admin'],
    description: 'Manage registered users and assign staff authorizations',
  },
  {
    id: 'subscriptions',
    title: 'Subscription & Billing Desk',
    category: 'Administration',
    path: '/subscriptions',
    icon: CreditCard,
    roles: ['admin'],
    description: 'Monitor member subscription tiers and financial transactions',
  },
  {
    id: 'telemetry',
    title: 'Performance Telemetry',
    category: 'Administration',
    path: '/telemetry',
    icon: Activity,
    roles: ['admin'],
    description: 'Monitor API p95 latency budgets and endpoint health',
  },
  {
    id: 'resources',
    title: 'Curated Wellness Resources',
    category: 'Content',
    path: '/resources',
    icon: BookOpen,
    roles: ['admin'],
    description: 'Publish and edit official health & guidance articles',
  },
  {
    id: 'stories',
    title: 'Success Stories Review',
    category: 'Content',
    path: '/stories',
    icon: Heart,
    roles: ['admin'],
    description: 'Moderate member success stories and testimonials',
  },
  {
    id: 'audit-logs',
    title: 'System Audit Trail',
    category: 'Security',
    path: '/audit-logs',
    icon: ShieldAlert,
    roles: ['admin'],
    description: 'Inspect security event logs and staff action history',
  },
];

export const CommandBar: React.FC<CommandBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { role = 'member' } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered from shortcut
          const triggerBtn = document.getElementById('cmd-bar-trigger');
          if (triggerBtn) triggerBtn.click();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const accessibleItems = COMMAND_ITEMS.filter((item) =>
    item.roles.includes(role as UserRole)
  );

  const filteredItems = accessibleItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 px-4">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces, user management, or admin tools... (Esc to close)"
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No matching workspaces found for "{query}".
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 text-left transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.category}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Role Filter active:</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold capitalize">
              {role.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">ESC</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
