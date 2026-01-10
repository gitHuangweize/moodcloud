
import React, { useMemo, useState, useEffect } from 'react';
import { X, Clock, MessageCircle, Heart, LogOut, Trash2, Pencil, Calendar, Award } from 'lucide-react';
import { Thought, User } from '../types';
import { supabaseStorageService } from '../services/supabaseStorageService';

interface ProfileViewProps {
  user: User;
  currentUser: User | null;
  thoughts: Thought[];
  onClose: () => void;
  onLogout: () => void;
  onSelectThought: (thought: Thought) => void;
  onDeleteThoughts: (ids: string[]) => Promise<void>;
  onFilterAuthor?: (authorId: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  currentUser,
  thoughts, 
  onClose, 
  onLogout, 
  onSelectThought, 
  onDeleteThoughts,
  onFilterAuthor
}) => {
  const isOwnProfile = currentUser?.id === user.id;
  const [activeTab, setActiveTab] = useState<'thoughts' | 'likes'>(isOwnProfile ? 'thoughts' : 'thoughts');
  const [likedThoughts, setLikedThoughts] = useState<Thought[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);

  const userThoughts = useMemo(() => {
    if (!Array.isArray(thoughts)) return [];
    return thoughts.filter(t => t.authorId === user.id);
  }, [thoughts, user.id]);
  
  const totalReceivedLikes = useMemo(() => {
    return userThoughts.reduce((sum, t) => sum + (t.likes || 0), 0);
  }, [userThoughts]);

  useEffect(() => {
    if (activeTab === 'likes') {
      const loadLikedThoughts = async () => {
        setIsLoadingLikes(true);
        try {
          const likedIds = await supabaseStorageService.getLikedThoughtIds(user.id);
          // 这里我们从全局 thoughts 中筛选，如果以后数据量大，可能需要单独请求后端
          const filtered = Array.isArray(thoughts) ? thoughts.filter(t => likedIds.includes(t.id)) : [];
          setLikedThoughts(filtered);
        } catch (err) {
          console.error("Failed to load liked thoughts:", err);
        } finally {
          setIsLoadingLikes(false);
        }
      };
      loadLikedThoughts();
    }
  }, [activeTab, user.id, thoughts]);

  const displayThoughts = activeTab === 'thoughts' ? userThoughts : likedThoughts;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = displayThoughts.length > 0 && selectedIds.size === displayThoughts.length;

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
      if (displayThoughts.length === 0) return prev;
      if (prev.size === displayThoughts.length) return new Set();
      return new Set(displayThoughts.map(t => t.id));
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
      <header className="flex flex-col bg-white border-b border-slate-100">
        <div className="h-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user.username} 的主页</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={12} /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'} 加入</span>
                <span className="flex items-center gap-1 text-pink-500 font-medium"><Award size={12} /> 获得 {totalReceivedLikes} 次赞同</span>
                {!isOwnProfile && onFilterAuthor && (
                  <button 
                    onClick={() => onFilterAuthor(user.id)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold transition-colors ml-2 px-2 py-0.5 bg-indigo-50 rounded-lg"
                  >
                    筛选 TA 的思绪
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isOwnProfile && (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-bold"
                  disabled={displayThoughts.length === 0 || activeTab !== 'thoughts'}
                  title={allSelected ? '取消全选' : '全选'}
                >
                  {allSelected ? '取消全选' : '全选'}
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={selectedIds.size === 0 || activeTab !== 'thoughts'}
                  className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-bold disabled:opacity-50"
                  title="批量删除"
                >
                  批量删除
                </button>
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="退出登录">
                  <LogOut size={22} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="flex px-8 gap-8">
          <button 
            onClick={() => { setActiveTab('thoughts'); setSelectedIds(new Set()); }}
            className={`py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'thoughts' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
          >
            {isOwnProfile ? '我的思绪' : '发布的思绪'} ({userThoughts.length})
          </button>
          <button 
            onClick={() => { setActiveTab('likes'); setSelectedIds(new Set()); }}
            className={`py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'likes' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
          >
            {isOwnProfile ? '我点赞的' : 'TA 点赞的'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        {isLoadingLikes ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayThoughts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Clock size={48} className="opacity-20" />
            <p>{activeTab === 'thoughts' ? (isOwnProfile ? '你还没有写过任何碎碎念呢...' : 'TA 还没有写过任何碎碎念呢...') : '这里还没有点赞过的内容...'}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {displayThoughts.map(thought => (
              <div 
                key={thought.id}
                onClick={() => onSelectThought(thought)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  {isOwnProfile && activeTab === 'thoughts' ? (
                    <label className="flex items-center gap-2 text-slate-400" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(thought.id)}
                        onChange={() => toggleSelected(thought.id)}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs">选择</span>
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-xs font-medium">{thought.author}</span>
                    </div>
                  )}
                  
                  {isOwnProfile && activeTab === 'thoughts' && (
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
                  )}
                </div>
                <div className="my-3">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                    {thought.type}
                  </span>
                </div>
                <p className="text-lg text-slate-700 mb-4 group-hover:text-indigo-900 transition-colors line-clamp-3">
                  {thought.content}
                </p>
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-pink-500"><Heart size={16} className="fill-pink-500" /> {thought.likes}</span>
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
