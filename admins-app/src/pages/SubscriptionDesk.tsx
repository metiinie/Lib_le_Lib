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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'canceled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'expired':
      case 'past_due':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            Subscription & Billing Desk
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage user subscriptions, view billing history, and cancel active plans.
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center gap-1 overflow-x-auto shadow-lg">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mx-2">
            Status:
          </span>
          {(['all', 'active', 'canceled', 'expired', 'past_due'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/60'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Plan Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center gap-1 overflow-x-auto shadow-lg">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mx-2">
            Plan:
          </span>
          {(['all', 'premium', 'free'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPlanFilter(p);
                setOffset(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
                planFilter === p
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Subscriber</th>
                  <th className="p-4">Plan & Provider</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Started At</th>
                  <th className="p-4">Expires At</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-sm">
                          {(item.user?.profile?.nickname || item.user?.profile?.displayName || item.user?.email || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {item.user?.profile?.nickname || item.user?.profile?.displayName || 'Unknown User'}
                          </p>
                          <p className="font-mono text-xs text-slate-500">{item.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold w-max ${
                          item.plan === 'premium' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.plan.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {item.paymentProvider || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusBadgeColor(item.status)}`}>
                        {item.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.startedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
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
                          className="px-3.5 py-1.5 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-400 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
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
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Cancel Subscription
              </h3>
              <button
                onClick={() => setCancelModalItem(null)}
                className="text-slate-500 hover:text-slate-300 p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                You are about to cancel the <strong>{cancelModalItem.plan.toUpperCase()}</strong> subscription for <strong>{cancelModalItem.user?.profile?.nickname || 'this user'}</strong>.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cancellation Reason (Required)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. User requested cancellation, Fraudulent activity, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-24"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setCancelModalItem(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                Go Back
              </button>
              <button
                disabled={actionLoading || !cancelReason.trim()}
                onClick={handleCancelSubscription}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50 text-sm"
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
