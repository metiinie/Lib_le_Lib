import React, { useState, useEffect } from 'react';
import { usersService } from '../services/users.service';
import { AuditLog } from '../types';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { ShieldAlert, RefreshCw, Calendar, Code, X, ShieldCheck, UserCheck, Activity } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Pagination state
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await usersService.getAuditLogs(limit, offset);
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('approved') || action.includes('updated')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold';
    }
    if (action.includes('rejected') || action.includes('ban') || action.includes('invalid')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-base font-bold text-slate-100">Immutable System Audit & Access Trail Log</h2>
        </div>

        <button
          onClick={loadLogs}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-indigo-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Total Audit Events</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : (total || logs.length)}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Staff Action Events</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : logs.filter(l => l.actorRole && l.actorRole !== 'member').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-rose-400 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Enforcement Decisions</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : logs.filter(l => ['USER_STATUS_CHANGE', 'VERIFICATION_DECISION', 'REPORT_ACTION'].includes(l.action)).length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-rose-400/30 text-rose-400 bg-rose-500/10 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-cyan-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">System Auto-Triggers</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : logs.filter(l => !l.actorRole || l.actorRole === 'system').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-100">Audit Trail Activity Ledger</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {logs.length} Records</span>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No audit log entries recorded yet.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Action Event</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Target ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 pr-6 text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      <span
                        className={`px-3 py-1 text-xs font-mono font-bold rounded-full border ${getActionBadgeStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-300">
                      {log.actorRole ? (
                        <span className="capitalize font-bold text-indigo-400">
                          {log.actorRole.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">System</span>
                      )}
                      {log.actorId && <p className="text-[10px] text-slate-500 mt-0.5">{log.actorId}</p>}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-300 capitalize">
                      {log.targetType}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400 font-medium">
                      {log.targetId || '—'}
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Inspect Payload</span>
                      </button>
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
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setOffset(0);
              }}
            />
          </>
        )}
      </div>

      {/* JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Code className="w-5 h-5 text-indigo-400" />
                Audit Event Payload Inspector
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-500 hover:text-slate-300 p-2 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
