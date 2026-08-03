import React, { useState, useEffect } from 'react';
import { resourcesService } from '../services/resources.service';
import { ResourceItem } from '../types';
import { BookOpen, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const ResourceManagement: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'treatment_info' | 'u_equals_u' | 'hotline' | 'general'>('treatment_info');
  const [body, setBody] = useState('');

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await resourcesService.getResources();
      setResources(data || []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resourcesService.createResource({
        title,
        category,
        body,
        published: true,
      });
      setTitle('');
      setBody('');
      setShowCreate(false);
      await loadResources();
    } catch (err) {
      console.error('Create resource error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourcesService.deleteResource(id);
      await loadResources();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-purple-400" />
            Curated Resource Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Publish vetted medical, mental health, legal, and lifestyle articles for members.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Article</span>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white">Create New Resource Article</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="treatment_info">Treatment Info</option>
                <option value="u_equals_u">U=U (Undetectable = Untransmittable)</option>
                <option value="hotline">Hotline</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Article Body</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 h-32"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
          >
            Publish Resource Article
          </button>
        </form>
      )}

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center text-slate-500 py-12">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="col-span-2 text-center text-slate-500 py-12">No resource articles published yet.</div>
        ) : (
          resources.map((res) => (
            <div key={res.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 relative group">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
                  {res.category.replace('_', ' ')}
                </span>
                <button
                  onClick={() => handleDelete(res.id)}
                  className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white">{res.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{res.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
