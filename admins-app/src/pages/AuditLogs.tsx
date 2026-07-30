import React, { useState, useEffect } from 'react';
import { usersService } from '../services/users.service';
import { AuditLog } from '../types';
import { ShieldAlert, RefreshCw, Eye, Calendar, User, Code, X } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await usersService.getAuditLogs(50, 0);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('approved') || action.includes('updated')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('rejected') || action.includes('ban') || action.includes('invalid')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-indigo-400" />
            System Audit Trail
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Immutable system activity log recording staff actions, identity decisions, and moderation events.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Main Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading audit log events...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No audit log entries recorded yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Action</th>
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
                      className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-full border ${getActionBadgeStyle(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-300">
                    {log.actorRole ? (
                      <span className="capitalize font-semibold text-indigo-400">
                        {log.actorRole.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-500">System</span>
                    )}
                    {log.actorId && <p className="text-[10px] text-slate-500 mt-0.5">{log.actorId}</p>}
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-300 capitalize">
                    {log.targetType}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-400">
                    {log.targetId || '—'}
                  </td>
                  <td className="p-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Inspect JSON</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
                <Code className="w-5 h-5 text-indigo-400" />
                Audit Event Payload
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-500 hover:text-slate-300 p-2"
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
