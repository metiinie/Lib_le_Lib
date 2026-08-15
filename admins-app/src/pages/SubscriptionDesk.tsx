import React, { useState, useEffect } from 'react';
import { subscriptionService } from '../services/subscription.service';
import { Subscription } from '../types';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useToast } from '../context/ToastContext';
import {
  CreditCard,
  RefreshCw,
  X,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const SubscriptionDesk: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<'active' | 'canceled' | 'expired' | 'past_due' | 'all'>('all');
  const [planFilter, setPlanFilter] = useState<'premium' | 'free' | 'all'>('all');

  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [cancelModalItem, setCancelModalItem] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const { data, total: totalCount } = await subscriptionService.getAdminQueue(
        limit,
        offset,
        statusFilter,
        planFilter
      );
      setItems(data || []);
      setTotal(totalCount || 0);
    } catch (err: any) {
      showToast('Failed to load queue', err?.message || 'Error fetching subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, planFilter, limit, offset]);

  const handleCancelSubscription = async () => {
    if (!cancelModalItem) return;
    if (!cancelReason.trim()) {
      showToast('Reason Required', 'Please provide a reason for cancelling this subscription.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await subscriptionService.cancelSubscription(cancelModalItem.id, cancelReason);
      showToast(
        'Subscription Cancelled',
        `Subscription for ${cancelModalItem.user?.profile?.nickname || 'User'} has been cancelled.`,
        'success'
      );
      setCancelModalItem(null);
      setCancelReason('');
      await loadQueue();
    } catch (err: any) {
      showToast('Action Failed', err?.response?.data?.error?.message || 'Failed to cancel subscription.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold';
      case 'canceled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold';
      case 'expired':
      case 'past_due':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20 font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {(['all', 'active', 'canceled', 'expired', 'past_due'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setOffset(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Plan Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'premium', 'free'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlanFilter(p);
                  setOffset(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${planFilter === p
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadQueue}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Billing</span>
        </button>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Active Subscriptions</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : items.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-indigo-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Est. Monthly Revenue</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : `$${(items.filter(s => s.status === 'active').length * 29).toLocaleString()}`}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 flex items-center justify-center shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-rose-400 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Cancellation Rate</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : (items.length > 0 ? `${((items.filter(s => s.status === 'canceled').length / items.length) * 100).toFixed(1)}%` : '0%')}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-rose-400/30 text-rose-400 bg-rose-500/10 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Past Due Payments</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : items.filter(s => s.status === 'past_due' || s.status === 'expired').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center justify-center shadow-sm">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-100">Member Subscription Ledger</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total {total} Records</span>
        </div>

        {loading ? (
          <TableSkeleton rows={10} columns={6} />
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No subscriptions found!</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Subscriber</th>
                  <th className="p-4">Plan & Provider</th>
                  <th className="p-4">Billing Status</th>
                  <th className="p-4">Started At</th>
                  <th className="p-4">Current Period End</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {(item.user?.profile?.nickname || item.user?.profile?.displayName || item.user?.email || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">
                            {item.user?.profile?.nickname || item.user?.profile?.displayName || 'Unknown User'}
                          </p>
                          <p className="font-mono text-xs text-slate-500">{item.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold w-max ${item.plan === 'premium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                          {item.plan.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {item.paymentProvider || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs border uppercase tracking-wider ${getStatusBadgeColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.startedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-medium">
                      {item.currentPeriodEnd ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(item.currentPeriodEnd).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">No expiry</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {item.status === 'active' && (
                        <button
                          onClick={() => {
                            setCancelModalItem(item);
                            setCancelReason('');
                          }}
                          className="px-4 py-2 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-400 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel Plan</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              total={total}
              limit={limit}
              offset={offset}
              onPageChange={setOffset}
              onLimitChange={setLimit}
            />
          </>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Cancel Member Subscription
              </h3>
              <button
                onClick={() => setCancelModalItem(null)}
                className="text-slate-500 hover:text-slate-300 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                You are about to revoke the <strong>{cancelModalItem.plan.toUpperCase()}</strong> subscription for <strong>{cancelModalItem.user?.profile?.nickname || 'this user'}</strong>.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Cancellation Reason (Required)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. User requested cancellation, Fraudulent activity, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-24 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setCancelModalItem(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors disabled:opacity-50 text-xs"
              >
                Go Back
              </button>
              <button
                disabled={actionLoading || !cancelReason.trim()}
                onClick={handleCancelSubscription}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50 text-xs"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
