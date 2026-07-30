import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = (s: string) => {
    switch (s.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'resolved':
      case 'answered':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'submitted':
      case 'in_review':
      case 'pending':
      case 'open':
      case 'investigating':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'rejected':
      case 'banned':
      case 'suspended':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'dismissed':
      case 'closed':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${getBadgeStyle(
        status
      )}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};
