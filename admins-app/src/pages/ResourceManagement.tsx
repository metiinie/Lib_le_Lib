import React, { useState, useEffect } from 'react';
import { resourcesService } from '../services/resources.service';
import { ResourceItem } from '../types';
import { BookOpen, Plus, Trash2, CheckCircle2, ShieldCheck, HeartHandshake, PhoneCall, Pencil, X } from 'lucide-react';

export const ResourceManagement: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'treatment_info' | 'u_equals_u' | 'hotline' | 'general'>('treatment_info');
  const [body, setBody] = useState('');

  // Editing state
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<'treatment_info' | 'u_equals_u' | 'hotline' | 'general'>('treatment_info');
  const [editBody, setEditBody] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const startEdit = (resource: ResourceItem) => {
    setEditingResource(resource);
    setEditTitle(resource.title);
    setEditCategory(resource.category as any);
    setEditBody(resource.body);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setUpdating(true);
    try {
      await resourcesService.updateResource(editingResource.id, {
        title: editTitle,
        category: editCategory,
        body: editBody,
      });
      setEditingResource(null);
      await loadResources();
    } catch (err) {
      console.error('Update resource error:', err);
    } finally {
      setUpdating(false);
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
      {/* Top Toolbar Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-base font-bold text-slate-100">Curated Educational & Support Resources</h2>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Article</span>
        </button>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-indigo-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Published Articles</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : resources.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Treatment Guides</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : resources.filter(r => r.category?.includes('treatment')).length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-cyan-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">U=U Articles</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : resources.filter(r => r.category?.includes('u_equals_u')).length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-sm">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-amber-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Emergency Hotlines</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : resources.filter(r => r.category?.includes('hotline')).length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center justify-center shadow-sm">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100">Create New Educational Article</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Article Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold capitalize"
              >
                <option value="treatment_info">Treatment Info</option>
                <option value="u_equals_u">U=U (Undetectable = Untransmittable)</option>
                <option value="hotline">Hotline</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Content Body</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 h-32 font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-xs shadow-md shadow-indigo-600/20"
          >
            Publish Article
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
            <div key={res.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 relative group shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                  {res.category.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(res)}
                    className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg transition-colors"
                    title="Edit Resource"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-100">{res.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">{res.body}</p>
            </div>
          ))
        )}
      </div>

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
          <form
            onSubmit={handleUpdate}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-400" />
                Edit Educational Article
              </h3>
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="text-slate-500 hover:text-slate-300 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold capitalize"
                >
                  <option value="treatment_info">Treatment Info</option>
                  <option value="u_equals_u">U=U (Undetectable = Untransmittable)</option>
                  <option value="hotline">Hotline</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Content Body</label>
                <textarea
                  required
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 h-36 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
