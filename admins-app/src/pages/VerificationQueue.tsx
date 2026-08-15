import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verificationService } from '../services/verification.service';
import { VerificationSubmission } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SecureDocumentViewer } from '../components/ui/SecureDocumentViewer';
import { Pagination } from '../components/ui/Pagination';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  FileText,
  UserCheck,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar,
  FileQuestion,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown
} from 'lucide-react';

export const VerificationQueue: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = (searchParams.get('status') as 'submitted' | 'approved' | 'rejected' | 'expired' | 'all') || 'submitted';
  const searchQuery = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const [items, setItems] = useState<VerificationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<VerificationSubmission | null>(null);
  const [limit, setLimit] = useState(10);

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'submitted') params.delete('status');
    else params.set('status', status);
    params.set('offset', '0');
    setSearchParams(params);
  };

  const setSearchQuery = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (!query) params.delete('q');
    else params.set('q', query);
    params.set('offset', '0');
    setSearchParams(params);
  };

  const setOffset = (newOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (newOffset === 0) params.delete('offset');
    else params.set('offset', newOffset.toString());
    setSearchParams(params);
  };

  // Inspector state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [docUrls, setDocUrls] = useState<any[]>([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const queue = await verificationService.getQueue(statusFilter);
      setItems(queue || []);
    } catch (err: any) {
      showToast('Failed to load queue', err?.message || 'Error fetching verification data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    loadQueue();
  }, [statusFilter]);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedItem) return;
    if (decision === 'rejected' && !rejectionReason.trim()) {
      showToast('Rejection Note Required', 'Please specify a rejection reason before rejecting.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await verificationService.decide(selectedItem.id, decision, rejectionReason);
      showToast(
        `Verification ${decision.toUpperCase()}`,
        `Application ${selectedItem.id} marked as ${decision}.`,
        decision === 'approved' ? 'success' : 'info'
      );
      setSelectedItem(null);
      setRejectionReason('');
      setZoomLevel(1);
      await loadQueue();
    } catch (err: any) {
      showToast('Decision Failed', err?.response?.data?.error?.message || 'Failed to submit decision.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedItem) return;
    if (!rejectionReason.trim()) {
      showToast('Revocation Reason Required', 'Please provide a reason for revoking the verification.', 'warning');
      return;
    }
    setActionLoading(true);
    try {
      await verificationService.revoke(selectedItem.id, rejectionReason);
      showToast(
        'Verification Revoked',
        `Verification for user ${selectedItem.userId} has been successfully revoked.`,
        'info'
      );
      setSelectedItem(null);
      setRejectionReason('');
      setZoomLevel(1);
      await loadQueue();
    } catch (err: any) {
      showToast('Revocation Failed', err?.response?.data?.error?.message || 'Failed to revoke verification.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const setPresetReason = (reason: string) => {
    setRejectionReason(reason);
  };

  const getDocImages = (item: VerificationSubmission) => {
    const images: { label: string; url: string }[] = [];
    const sourceDocs = docUrls.length > 0 ? docUrls : (item.documents || []);

    if (sourceDocs && sourceDocs.length > 0) {
      sourceDocs.forEach((d: any) => {
        if (d.url) {
          images.push({
            label: d.documentType ? d.documentType.replace('_', ' ').toUpperCase() : 'DOCUMENT',
            url: d.url,
          });
        }
      });
    }
    if (images.length === 0 && docUrls.length === 0) {
      if (item.idDocumentUrl) images.push({ label: 'GOVERNMENT ID', url: item.idDocumentUrl });
      if (item.selfieUrl) images.push({ label: 'LIVENESS SELFIE', url: item.selfieUrl });
    }
    return images;
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const name = (item.user?.profile?.nickname || item.user?.profile?.displayName || '').toLowerCase();
    const email = (item.user?.email || '').toLowerCase();
    const id = item.id.toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || id.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search & Status Tabs */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applicant or submission ID..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {(['submitted', 'approved', 'rejected', 'expired', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                {s === 'submitted' ? 'Pending Queue' : s === 'all' ? 'All Submissions' : `${s}`}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={loadQueue}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all self-end md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-cyan-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Pending Verification Queue</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : items.filter(i => ['submitted', 'in_review'].includes(i.status)).length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Approved ID Submissions</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : items.filter(i => i.status === 'approved').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-rose-400 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Rejected Submissions</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : items.filter(i => i.status === 'rejected').length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-rose-400/30 text-rose-400 bg-rose-500/10 flex items-center justify-center shadow-sm">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-blue-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Review SLA Target</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">&lt; 15m</p>
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
              Government Identity Verification Queue
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredItems.length} Submissions</span>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No verification submissions found!</p>
            <p className="text-xs text-slate-600 mt-1">Try switching status filter tabs or adjusting search query.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Applicant Profile</th>
                  <th className="p-4">Submission ID</th>
                  <th className="p-4">Documents</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredItems.slice(offset, offset + limit).map((item) => {
                  const docImages = getDocImages(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {(item.user?.profile?.nickname || item.user?.profile?.displayName || item.user?.email || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">
                              {item.user?.profile?.nickname || item.user?.profile?.displayName || 'Applicant'}
                            </p>
                            <p className="font-mono text-xs text-slate-500">{item.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-indigo-400">{item.id}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-300">
                          {docImages.length} Document(s)
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(item.submittedAt || item.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={async () => {
                            setSelectedItem(item);
                            setZoomLevel(1);
                            setActiveImageIndex(0);
                            setRejectionReason(item.rejectionReason || '');
                            setDocUrls([]);
                            if (['submitted', 'in_review'].includes(item.status)) {
                              setFetchingDocs(true);
                              try {
                                const docs = await verificationService.getDocuments(item.id);
                                setDocUrls(docs);
                              } catch (err: any) {
                                showToast('Error', err?.response?.data?.error?.message || 'Failed to fetch secure documents', 'error');
                              } finally {
                                setFetchingDocs(false);
                              }
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination
              total={filteredItems.length}
              limit={limit}
              offset={offset}
              onPageChange={setOffset}
              onLimitChange={setLimit}
            />
          </>
        )}
      </div>

      {/* Document Inspector Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Government Document & Liveness Inspector
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Submission ID: {selectedItem.id}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-500 hover:text-slate-300 p-2 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Applicant Profile Snapshot */}
            {selectedItem.user && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 uppercase font-semibold block">Applicant Name</span>
                  <span className="font-semibold text-slate-200 text-sm">
                    {selectedItem.user.profile?.displayName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-semibold block">Contact Email / Phone</span>
                  <span className="text-slate-300">{selectedItem.user.email || selectedItem.user.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-semibold block">Account Created</span>
                  <span className="text-slate-300">{new Date(selectedItem.user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {/* Document Viewer Section */}
            {(() => {
              if (fetchingDocs) {
                return (
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-12 text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Decrypting and loading documents securely...</p>
                  </div>
                );
              }

              const images = getDocImages(selectedItem);
              const activeImage = images[activeImageIndex];

              if (images.length === 0 && ['approved', 'rejected', 'expired'].includes(selectedItem.status)) {
                return (
                  <div className="bg-emerald-950/30 border border-emerald-900 rounded-xl p-6 text-center space-y-3">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                    <div>
                      <h4 className="text-emerald-400 font-bold text-sm">Privacy Compliance Enforced</h4>
                      <p className="text-emerald-200/70 text-xs mt-1 max-w-lg mx-auto">
                        For strict privacy compliance, all identity documents were permanently purged from the system the moment this verification decision was made.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {/* Image Selector Tabs & Zoom Toolbar */}
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      {images.length > 0 ? images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveImageIndex(idx);
                            setZoomLevel(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeImageIndex === idx
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                        >
                          {img.label}
                        </button>
                      )) : (
                        <span className="text-xs text-slate-500 italic px-2">No documents found</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                        className="p-1.5 bg-slate-900 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-800"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono text-slate-400 w-12 text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                        className="p-1.5 bg-slate-900 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-800"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="p-1.5 bg-slate-900 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-800"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* High Resolution Image Box */}
                  <div className="h-96 w-full">
                    <SecureDocumentViewer
                      url={activeImage?.url || null}
                      alt={activeImage?.label || 'DOCUMENT'}
                      staffUser={null}
                      zoomLevel={zoomLevel}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Quick Rejection Presets & Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {selectedItem.status === 'approved' ? 'Revocation Reason (Required)' : 'Rejection Notes (Select preset or write custom reason)'}
                </label>
              </div>

              {/* Presets */}
              {selectedItem.status !== 'approved' && (
                <div className="flex flex-wrap gap-2">
                  {[
                    'Blurry / Unreadable Document Image',
                    'Name or DOB Mismatch with Account',
                    'Document Expired or Invalid',
                    'Liveness Selfie Verification Failed',
                    'Underage Document Detected',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPresetReason(preset)}
                      className="px-3 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-colors font-medium"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={selectedItem.status === 'approved' ? "Explain why this approved verification is being revoked..." : "Log rationale for rejection or officer feedback..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-20"
              />
            </div>

            {/* Decision Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              {['submitted', 'in_review'].includes(selectedItem.status) ? (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleDecision('rejected')}
                    className="flex-1 py-3 px-4 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    <X className="w-5 h-5" />
                    <span>Reject Application</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleDecision('approved')}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-sm"
                  >
                    <Check className="w-5 h-5" />
                    <span>Approve Verification</span>
                  </button>
                </>
              ) : selectedItem.status === 'approved' ? (
                <button
                  disabled={actionLoading}
                  onClick={handleRevoke}
                  className="flex-1 py-3 px-4 bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <FileQuestion className="w-5 h-5" />
                  <span>Revoke Verification & Suspend Account</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
