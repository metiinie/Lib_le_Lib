import React, { useState, useEffect } from 'react';
import { resourcesService } from '../services/resources.service';
import { SuccessStory } from '../types';
import { Heart, CheckCircle2, Check } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Heart className="w-7 h-7 text-rose-400" />
          Member Success Stories Approval
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review opt-in testimonials and community stories submitted by members (Admin Only).
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 py-12">No submitted success stories pending approval.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {stories.map((story) => (
              <div key={story.id} className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{story.title}</h3>
                  <StatusBadge status={story.published || story.isApproved ? 'approved' : 'pending'} />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {story.storyText || story.storyContent}
                </p>

                {!(story.published || story.isApproved) && (
                  <button
                    onClick={() => handleApprove(story.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Story for Publication</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
