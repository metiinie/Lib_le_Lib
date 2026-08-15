import React, { useState, useEffect } from 'react';
import { resourcesService } from '../services/resources.service';
import { SuccessStory } from '../types';
import { Heart, CheckCircle2, Check, Sparkles, Clock, Users, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export const SuccessStories: React.FC = () => {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await resourcesService.getSuccessStories();
      setStories(data || []);
    } catch (err) {
      console.error('Failed to fetch success stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await resourcesService.approveSuccessStory(id);
      await loadStories();
    } catch (err) {
      console.error('Failed to approve story:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to reject and delete this testimonial submission?')) return;
    try {
      await resourcesService.deleteSuccessStory(id);
      await loadStories();
    } catch (err) {
      console.error('Failed to delete story:', err);
    }
  };

  const pendingCount = stories.filter(s => !(s.published || s.isApproved)).length;
  const approvedCount = stories.filter(s => (s.published || s.isApproved)).length;

  return (
    <div className="space-y-6">
      {/* Top Toolbar Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-base font-bold text-slate-100">Member Testimonials & Success Stories Approval</h2>
        </div>

        <button
          onClick={loadStories}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-rose-400 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Total Submissions</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : stories.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-rose-400/30 text-rose-400 bg-rose-500/10 flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Approved Stories</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : approvedCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Pending Moderation</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : pendingCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-indigo-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Member Opt-In Rate</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">100%</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-100">Submitted Community Testimonials</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Pending Review</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No submitted success stories pending approval.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {stories.map((story) => (
              <div key={story.id} className="p-6 space-y-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100">{story.title}</h3>
                  <StatusBadge status={story.published || story.isApproved ? 'approved' : 'pending'} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 font-medium">
                  "{story.storyText || story.storyContent}"
                </p>

                <div className="flex items-center gap-3">
                  {!(story.published || story.isApproved) && (
                    <button
                      onClick={() => handleApprove(story.id)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Story</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="px-4 py-2.5 bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Reject & Delete Story</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
