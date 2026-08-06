import React, { useState, useEffect } from 'react';
import { qaService } from '../services/qa.service';
import { StatusBadge } from '../components/ui/StatusBadge';
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
  const [threads, setThreads] = useState<QAThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'open' | 'answered' | 'closed' | 'all'>('open');
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyText.trim()) return;
    setSubmitting(true);
    try {
      await qaService.replyToThread(selectedThread.id, replyText.trim());
      setSelectedThread(null);
      setReplyText('');
      await loadThreads();
    } catch (err) {
      console.error('Failed to reply to thread:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'answered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'closed': return 'bg-slate-800 text-slate-500 border-slate-700';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Stethoscope className="w-7 h-7 text-emerald-400" />
            Medical & Health Q&A Desk
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review and respond to anonymous HIV health questions submitted by members.
          </p>
        </div>
        <button
          onClick={loadThreads}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-2 overflow-x-auto shadow-lg">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
          Status:
        </span>
        {(['open', 'answered', 'closed', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
              statusFilter === s
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {s === 'open' ? 'Open Questions' : s === 'all' ? 'All Threads' : `${s} Threads`}
          </button>
        ))}
      </div>

      {/* Threads List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading medical Q&A threads...</div>
        ) : threads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Inbox className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No threads found!</p>
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
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${getStatusStyle(
                            thread.status
                          )}`}
                        >
                          {thread.status}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                        {thread.healthProfessionalId && (
                          <span className="px-2.5 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Assigned to:{' '}
                            {thread.healthProfessional?.profile?.displayName || 'HP'}
                          </span>
                        )}
                      </div>

                      <p className="text-base font-semibold text-slate-200 leading-snug line-clamp-2">
                        {question}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {thread.member?.profile?.displayName || thread.member?.email || 'Anonymous Member'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {messages.length} message{messages.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {thread.status === 'open' && (
                        <button
                          onClick={() => {
                            setSelectedThread(thread);
                            setReplyText('');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                          <MessageSquare className="w-4 h-4" />
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
                                className={`font-semibold ${
                                  isHP ? 'text-emerald-400' : 'text-slate-300'
                                }`}
                              >
                                {isHP ? '🩺 Health Professional' : '👤 Member'}
                              </span>
                              <span className="text-slate-600">
                                {new Date(msg.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div
                              className={`p-3 rounded-xl text-xs leading-relaxed ${
                                isHP
                                  ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-200'
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
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
                className="text-slate-500 hover:text-slate-300 p-2"
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
                    <span className={`font-semibold ${isHP ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isHP ? '🩺 Health Professional' : '👤 Member'}
                    </span>
                    <div
                      className={`p-3 rounded-xl leading-relaxed ${
                        isHP
                          ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-200'
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Medical Response
              </label>
              <textarea
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Provide accurate, empathetic, evidence-based medical guidance..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 h-32"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
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
