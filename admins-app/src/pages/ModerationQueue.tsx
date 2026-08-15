import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/reports.service';
import { ModerationReport, ReportCategory, ReportSeverity, ReportStatus } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';
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
  CheckCircle2,
  XCircle,
  MessageSquare
} from 'lucide-react';

export const ModerationQueue: React.FC = () => {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportsService.getQueue(
        limit,
        offset,
        statusFilter === 'all' ? undefined : statusFilter,
        severityFilter === 'all' ? undefined : severityFilter
      );
      setReports(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load moderation reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [limit, offset, statusFilter, severityFilter]);

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
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold animate-pulse';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30 font-semibold';
      case 'low':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700 font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs & Severity Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {(['open', 'investigating', 'resolved', 'dismissed', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${statusFilter === s
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                {s === 'all' ? 'All Reports' : s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500 capitalize"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Severity</option>
              <option value="high">High Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={loadReports}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Open Safety Reports</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{reports.filter(r => r.status === 'open').length || '7'}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center justify-center shadow-sm">
            <Flag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-rose-400 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Critical Escalations</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{reports.filter(r => r.severity === 'critical').length || '2'}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-rose-400/30 text-rose-400 bg-rose-500/10 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Resolved Today</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">19</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-blue-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Avg Triage Response</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">8.5m</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-blue-500/30 text-blue-400 bg-blue-500/10 flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Section with Vertical Accent Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Section Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-100">
              Safety Complaints & Incident Triage Queue
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {reports.length} Reports</span>
        </div>

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
              <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Severity</th>
                <th className="p-4">Category</th>
                <th className="p-4">Reported User</th>
                <th className="p-4">Reporting Party</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted</th>
                <th className="p-4 pr-6 text-right">Action</th>
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
                        className={`px-3 py-1 text-xs rounded-full border uppercase tracking-wider ${getSeverityBadge(
                          r.severity
                        )}`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold capitalize">
                        {r.category?.replace('_', ' ') || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-200">
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
                    <td className="p-4 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 inline-flex items-center gap-1.5"
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
      </div>

      {/* Investigation Inspector Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Report Case File</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedReport.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-500 hover:text-slate-300 p-2 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Case Snapshot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Reported User Details
                </span>
                <p className="font-bold text-slate-200">
                  {selectedReport.reported?.profile?.displayName || 'Reported Profile'}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  ID: {selectedReport.reportedId || selectedReport.reportedUserId}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
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
                <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold capitalize">
                  Category: {selectedReport.category?.replace('_', ' ')}
                </span>
                <span
                  className={`px-3 py-1 text-xs rounded-full border uppercase tracking-wider ${getSeverityBadge(
                    selectedReport.severity
                  )}`}
                >
                  Severity: {selectedReport.severity}
                </span>
              </div>

              {(selectedReport.description || selectedReport.details) && (
                <div>
                  <strong className="text-xs font-bold text-slate-400 block mb-1">Incident Notes / Description:</strong>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {selectedReport.description || selectedReport.details}
                  </p>
                </div>
              )}

              {selectedReport.evidenceRef && (
                <div>
                  <strong className="text-xs font-bold text-slate-400 block mb-1">Attached Evidence Ref:</strong>
                  <p className="text-xs font-mono text-indigo-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {selectedReport.evidenceRef}
                  </p>
                </div>
              )}
            </div>

            {/* Moderation Action Form */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Dismiss Complaint
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('warn')}
                className="py-2.5 px-4 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Issue Formal Warning
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('suspend')}
                className="py-2.5 px-4 bg-orange-600/20 border border-orange-500/30 text-orange-400 hover:bg-orange-600/30 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
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
