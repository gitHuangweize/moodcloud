
import React, { useMemo, useState } from 'react';
import { X, Clock, MessageCircle, Heart, LogOut, Trash2, Pencil } from 'lucide-react';
import { Thought, User } from '../types';

interface ProfileViewProps {
  user: User;
  thoughts: Thought[];
  onClose: () => void;
  onLogout: () => void;
  onSelectThought: (thought: Thought) => void;
  onDeleteThoughts: (ids: string[]) => Promise<void>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, thoughts, onClose, onLogout, onSelectThought, onDeleteThoughts }) => {
  const userThoughts = useMemo(() => thoughts.filter(t => t.authorId === user.id), [thoughts, user.id]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = userThoughts.length > 0 && selectedIds.size === userThoughts.length;

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (userThoughts.length === 0) return prev;
      if (prev.size === userThoughts.length) return new Set();
      return new Set(userThoughts.map(t => t.id));
    });
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await onDeleteThoughts(ids);
    setSelectedIds(new Set());
  };

  const deleteOne = async (id: string) => {
    await onDeleteThoughts([id]);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
      <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user.username} 的主页</h2>
            <p className="text-xs text-slate-400">共发布了 {userThoughts.length} 条心得</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold"
            disabled={userThoughts.length === 0}
            title={allSelected ? '取消全选' : '全选'}
          >
            {allSelected ? '取消全选' : '全选'}
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedIds.size === 0}
            className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-bold disabled:opacity-50"
            title="批量删除"
          >
            批量删除
          </button>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="退出登录">
            <LogOut size={22} />
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        {userThoughts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Clock size={48} className="opacity-20" />
            <p>你还没有写过任何碎碎念呢...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {userThoughts.map(thought => (
              <div 
                key={thought.id}
                onClick={() => onSelectThought(thought)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <label className="flex items-center gap-2 text-slate-400" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(thought.id)}
                      onChange={() => toggleSelected(thought.id)}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs">选择</span>
                  </label>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectThought(thought)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="编辑"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => deleteOne(thought.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-2 py-1 rounded-md">
                    {thought.type}
                  </span>
                </div>
                <p className="text-lg text-slate-700 mb-4 group-hover:text-indigo-900 transition-colors">
                  {thought.content}
                </p>
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1"><Heart size={16} /> {thought.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={16} /> {thought.echoes}</span>
                  </div>
                  <span className="text-xs">{new Date(thought.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfileView;
