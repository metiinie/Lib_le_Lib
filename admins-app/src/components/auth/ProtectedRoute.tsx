import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  userRole?: UserRole;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  userRole,
  children,
}) => {
  const hasPermission = userRole && allowedRoles.includes(userRole);

  if (!hasPermission) {
    return (
      <div className="min-h-[450px] bg-slate-900 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-bold text-white">Access Restricted Desk</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your current staff authorization role (
            <span className="font-semibold text-rose-400 capitalize">
              {userRole?.replace(/_/g, ' ') || 'unassigned'}
            </span>
            ) does not possess privileges to view or manage this workspace.
          </p>
        </div>
        <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Lock className="w-4 h-4 text-slate-600" />
          <span>Role Authorization Enforced</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
