import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const VerificationQueue: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<VerificationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'submitted' | 'approved' | 'rejected' | 'all'>('submitted');
  const [selectedItem, setSelectedItem] = useState<VerificationSubmission | null>(null);

  // Pagination state
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  // Inspector state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  const setPresetReason = (reason: string) => {
    setRejectionReason(reason);
  };

  const getDocImages = (item: VerificationSubmission) => {
    const images: { label: string; url: string }[] = [];
    if (item.documents && item.documents.length > 0) {
      item.documents.forEach((d) => {
        if (d.url) {
          images.push({
            label: d.documentType ? d.documentType.replace('_', ' ').toUpperCase() : 'DOCUMENT',
            url: d.url,
          });
        }
      });
    }
    if (images.length === 0) {
      if (item.idDocumentUrl) images.push({ label: 'GOVERNMENT ID', url: item.idDocumentUrl });
      if (item.selfieUrl) images.push({ label: 'LIVENESS SELFIE', url: item.selfieUrl });
    }
    return images;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
            Identity Verification Desk
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review identity documents & liveness selfies submitted by pending members.
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

      {/* Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-2 overflow-x-auto shadow-lg">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
          Filter:
        </span>
        {(['submitted', 'approved', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
              statusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {s === 'submitted' ? 'Pending Queue' : s === 'all' ? 'All Submissions' : `${s} History`}
          </button>
        ))}
      </div>

      {/* Main Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No submissions found!</p>
            <p className="text-xs text-slate-600 mt-1">Try switching status filter tabs.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Applicant</th>
                  <th className="p-4">Submission ID</th>
                  <th className="p-4">Documents</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {items.slice(offset, offset + limit).map((item) => {
                  const docImages = getDocImages(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-semibold text-sm">
                            {(item.user?.profile?.nickname || item.user?.profile?.displayName || item.user?.email || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">
                              {item.user?.profile?.nickname || item.user?.profile?.displayName || 'Applicant'}
                            </p>
                            <p className="font-mono text-xs text-slate-500">{item.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-indigo-400">{item.id}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs font-semibold text-slate-300">
                          {docImages.length} Document(s)
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
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
                          onClick={() => {
                            setSelectedItem(item);
                            setZoomLevel(1);
                            setActiveImageIndex(0);
                            setRejectionReason(item.rejectionReason || '');
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Documents</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Pagination
              total={items.length}
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
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Government Document & Liveness Inspector
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Submission ID: {selectedItem.id}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-500 hover:text-slate-300 p-2"
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
              const images = getDocImages(selectedItem);
              const activeImage = images[activeImageIndex];

              return (
                <div className="space-y-3">
                  {/* Image Selector Tabs & Zoom Toolbar */}
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveImageIndex(idx);
                            setZoomLevel(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            activeImageIndex === idx
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                        className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-800"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono text-slate-400 w-12 text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                        className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-800"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="p-1.5 bg-slate-900 text-slate-300 hover:text-white rounded-lg border border-slate-800"
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Rejection Notes (Select preset or write custom reason)
                </label>
              </div>

              {/* Presets */}
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
                    className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Log rationale for rejection or officer feedback..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-20"
              />
            </div>

            {/* Decision Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-800">
              <button
                disabled={actionLoading}
                onClick={() => handleDecision('rejected')}
                className="flex-1 py-3 px-4 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/20 text-rose-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <X className="w-5 h-5" />
                <span>Reject Application</span>
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleDecision('approved')}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-sm"
              >
                <Check className="w-5 h-5" />
                <span>Approve Verification</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
