import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { qaService } from '../services/qa.service';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  Stethoscope,
  CheckCircle,
  MessageSquare,
  Send,
  X,
  Clock,
  RefreshCw,
  MessageCircle,
  User,
  ChevronDown,
  ChevronUp,
  Inbox,
  CheckCircle2,
  UserCheck,
  HelpCircle,
  UserPlus
} from 'lucide-react';

interface QAMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface QAThread {
  id: string;
  memberId: string;
  healthProfessionalId?: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  messages?: QAMessage[];
  member?: { id: string; email?: string; profile?: { displayName?: string } };
  healthProfessional?: { id: string; profile?: { displayName?: string } };
}

export const HealthQA: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = (searchParams.get('status') as 'open' | 'answered' | 'closed' | 'all') || 'open';

  const setStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'open') params.delete('status');
    else params.set('status', status);
    setSearchParams(params);
  };

  const [threads, setThreads] = useState<QAThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<QAThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const loadThreads = async () => {
    setLoading(true);
    try {
      const res = await qaService.getThreads(statusFilter);
      setThreads((res as unknown as QAThread[]) || []);
    } catch (err) {
      console.error('Failed to load QA threads:', err);
      showToast('Error', 'Failed to load Q&A threads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [statusFilter]);

  const toggleExpand = (threadId: string) => {
    const next = new Set(expandedThreads);
    if (next.has(threadId)) next.delete(threadId);
    else next.add(threadId);
    setExpandedThreads(next);
  };

  const handleAssign = async (threadId: string) => {
    try {
      await qaService.assignThread(threadId);
      showToast('Assigned', 'Q&A thread successfully assigned to you.', 'success');
      await loadThreads();
    } catch (err) {
      console.error('Failed to assign thread:', err);
      showToast('Assignment Failed', 'Failed to assign thread.', 'error');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await qaService.replyToThread(selectedThread.id, replyText.trim());
      showToast('Response Published', 'Medical response published successfully.', 'success');
      setSelectedThread(null);
      setReplyText('');
      await loadThreads();
    } catch (err) {
      console.error('Failed to reply to thread:', err);
      showToast('Reply Failed', 'Failed to publish response.', 'error');
    } finally {
      setSubmitting(false);
    }
  };
} catch (err) {
  console.error('Failed to reply to thread:', err);
} finally {
  setSubmitting(false);
}
  };

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'open': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold';
    case 'answered': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold';
    case 'closed': return 'bg-slate-800 text-slate-500 border-slate-700 font-medium';
    default: return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};

return (
  <div className="space-y-6">
    {/* Top Filter & Toolbar Bar */}
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full md:w-auto">
        {(['open', 'answered', 'closed', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all ${statusFilter === s
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
          >
            {s === 'open' ? 'Open Questions' : s === 'all' ? 'All Threads' : `${s} Threads`}
          </button>
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={loadThreads}
        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all self-end md:self-auto"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>Refresh Desk</span>
      </button>
    </div>

    {/* KPI Metric Cards with Bottom Accent Borders */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 tracking-wide">Open Pending Questions</p>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : threads.filter(t => t.status === 'open').length}</p>
        </div>
        <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
          <HelpCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-cyan-500 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 tracking-wide">Answered / Resolved</p>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : threads.filter(t => t.status === 'answered' || t.status === 'closed').length}</p>
        </div>
        <div className="w-11 h-11 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-amber-500 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 tracking-wide">Assigned to Professional</p>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : threads.filter(t => !!t.healthProfessionalId).length}</p>
        </div>
        <div className="w-11 h-11 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center justify-center shadow-sm">
          <Stethoscope className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-blue-500 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 tracking-wide">Medical SLA Target</p>
          <p className="text-3xl font-extrabold text-slate-100 tracking-tight">&lt; 1h</p>
        </div>
        <div className="w-11 h-11 rounded-xl border border-blue-500/30 text-blue-400 bg-blue-500/10 flex items-center justify-center shadow-sm">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>

    {/* Main Section Header with Vertical Accent Bar */}
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-base font-bold text-slate-100">
            Anonymous Health Q&A Inquiry Threads
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">Showing {threads.length} Threads</span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading medical Q&A threads...</div>
      ) : threads.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <Inbox className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-400">No medical threads found!</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting the status filter tabs.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {threads.map((thread) => {
            const isExpanded = expandedThreads.has(thread.id);
            const messages = thread.messages || [];
            const firstMsg = messages[0];
            const question = firstMsg?.content || '(No question content)';

            return (
              <div key={thread.id} className="p-6 hover:bg-slate-800/20 transition-colors">
                {/* Thread Header Row */}
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 text-xs rounded-full border capitalize ${getStatusStyle(
                          thread.status
                        )}`}
                      >
                        {thread.status}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </span>
                      {thread.healthProfessionalId && (
                        <span className="px-3 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                          Officer:{' '}
                          {thread.healthProfessional?.profile?.displayName || 'Medical Professional'}
                        </span>
                      )}
                    </div>

                    <p className="text-base font-bold text-slate-200 leading-snug line-clamp-2">
                      {question}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {thread.member?.profile?.displayName || thread.member?.email || 'Anonymous Member'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {thread.status === 'open' && !thread.healthProfessionalId && (
                      <button
                        onClick={() => handleAssign(thread.id)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                        title="Assign this medical thread to yourself"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Assign to Me</span>
                      </button>
                    )}
                    {thread.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedThread(thread);
                          setReplyText('');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(thread.id)}
                      className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                      title={isExpanded ? 'Collapse' : 'View Thread'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Message Thread */}
                {isExpanded && messages.length > 0 && (
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-800">
                    {messages.map((msg, idx) => {
                      const isHP = msg.senderId === thread.healthProfessionalId;
                      return (
                        <div key={msg.id || idx} className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`font-bold ${isHP ? 'text-emerald-400' : 'text-slate-300'
                                }`}
                            >
                              {isHP ? '🩺 Health Professional' : '👤 Member'}
                            </span>
                            <span className="text-slate-600">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`p-3.5 rounded-xl text-xs leading-relaxed font-medium ${isHP
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                              : 'bg-slate-950 border border-slate-800 text-slate-300'
                              }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Reply Modal */}
    {selectedThread && (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
        <form
          onSubmit={handleReply}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-8 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              Publish Medical Reply
            </h3>
            <button
              type="button"
              onClick={() => setSelectedThread(null)}
              className="text-slate-500 hover:text-slate-300 p-2 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Thread Messages Preview */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(selectedThread.messages || []).map((msg, idx) => {
              const isHP = msg.senderId === selectedThread.healthProfessionalId;
              return (
                <div key={msg.id || idx} className="text-xs space-y-1">
                  <span className={`font-bold ${isHP ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {isHP ? '🩺 Health Professional' : '👤 Member'}
                  </span>
                  <div
                    className={`p-3 rounded-xl leading-relaxed font-medium ${isHP
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
                      : 'bg-slate-950 border border-slate-800 text-slate-300'
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Your Official Medical Response
            </label>
            <textarea
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Provide accurate, empathetic, evidence-based medical guidance..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 h-32 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 text-sm"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Publishing Reply...' : 'Publish Official Medical Reply'}</span>
          </button>
        </form>
      </div>
    )}
  </div>
);
};
