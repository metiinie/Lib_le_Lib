import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/reports.service';
import { ModerationReport, ReportCategory, ReportSeverity, ReportStatus } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Flag,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Filter,
  Eye,
  UserX,
  AlertCircle,
  Clock,
  FileText,
} from 'lucide-react';

export const ModerationQueue: React.FC = () => {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportsService.getQueue(
        50,
        0,
        statusFilter === 'all' ? undefined : statusFilter,
        severityFilter === 'all' ? undefined : severityFilter
      );
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to load moderation reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter, severityFilter]);

  const handleAction = async (
    action: 'warn' | 'suspend' | 'ban' | 'request_resubmission' | 'none'
  ) => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await reportsService.performAction(selectedReport.id, action, actionReason);
      setSelectedReport(null);
      setActionReason('');
      await loadReports();
    } catch (err) {
      console.error('Moderation action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityBadge = (s: ReportSeverity) => {
    switch (s) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold animate-pulse';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20 font-semibold';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Flag className="w-7 h-7 text-amber-400" />
            Safety & Moderation Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Triage member safety reports, investigate violations, and issue disciplinary actions.
          </p>
        </div>
        <button
          onClick={loadReports}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
            Status:
          </span>
          {(['open', 'investigating', 'resolved', 'dismissed', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
                statusFilter === s
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {s === 'all' ? 'All Statuses' : s}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 capitalize"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Severity</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading safety reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No safety reports found!</p>
            <p className="text-xs text-slate-600 mt-1">Try adjusting filter parameters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Severity</th>
                <th className="p-4">Category</th>
                <th className="p-4">Reported User</th>
                <th className="p-4">Reporter</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {reports.map((r) => {
                const reportedId = r.reportedId || r.reportedUserId;
                const reporterId = r.reporterId || r.reporterUserId;
                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full border uppercase tracking-wider ${getSeverityBadge(
                          r.severity
                        )}`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium capitalize">
                        {r.category?.replace('_', ' ') || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">
                        {r.reported?.profile?.displayName || r.reportedUser?.profile?.displayName || 'Member'}
                      </div>
                      <div className="font-mono text-xs text-slate-500">{reportedId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-400">
                        {r.reporter?.profile?.displayName || r.reporterUser?.profile?.displayName || 'Member'}
                      </div>
                      <div className="font-mono text-xs text-slate-500">{reporterId}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Investigation Inspector Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">Report Case File</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedReport.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-500 hover:text-slate-300 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Case Snapshot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Reported User Details
                </span>
                <p className="font-semibold text-slate-200">
                  {selectedReport.reported?.profile?.displayName || 'Reported Profile'}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  ID: {selectedReport.reportedId || selectedReport.reportedUserId}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Reporting Party Details
                </span>
                <p className="font-semibold text-slate-300">
                  {selectedReport.reporter?.profile?.displayName || 'Reporter Profile'}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  ID: {selectedReport.reporterId || selectedReport.reporterUserId}
                </p>
              </div>
            </div>

            {/* Incident Details & Evidence */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium capitalize">
                  Category: {selectedReport.category?.replace('_', ' ')}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs rounded-full border uppercase tracking-wider ${getSeverityBadge(
                    selectedReport.severity
                  )}`}
                >
                  Severity: {selectedReport.severity}
                </span>
              </div>

              {(selectedReport.description || selectedReport.details) && (
                <div>
                  <strong className="text-xs text-slate-400 block mb-1">Incident Notes / Description:</strong>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedReport.description || selectedReport.details}
                  </p>
                </div>
              )}

              {selectedReport.evidenceRef && (
                <div>
                  <strong className="text-xs text-slate-400 block mb-1">Attached Evidence Ref:</strong>
                  <p className="text-xs font-mono text-indigo-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    {selectedReport.evidenceRef}
                  </p>
                </div>
              )}
            </div>

            {/* Moderation Action Form */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Moderator Decision Notes / Reason
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Log internal rationale for this disciplinary action..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 h-24"
              />
            </div>

            {/* Disciplinary Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              <button
                disabled={actionLoading}
                onClick={() => handleAction('none')}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Dismiss Complaint
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('warn')}
                className="py-2.5 px-4 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Issue Formal Warning
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('suspend')}
                className="py-2.5 px-4 bg-orange-600/20 border border-orange-500/30 text-orange-400 hover:bg-orange-600/30 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Suspend Account
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('ban')}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                Permanently Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
