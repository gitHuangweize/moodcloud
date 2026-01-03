
import React, { useState, useEffect, useCallback } from 'react';
import NavBar from './components/NavBar';
import ThoughtCloud from './components/ThoughtCloud';
import InputBar from './components/InputBar';
import AuthModal from './components/AuthModal';
import ProfileView from './components/ProfileView';
import StatusMessage from './components/StatusMessage';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { Thought, ThoughtType, User, Comment } from './types';
import { INITIAL_THOUGHTS, COLORS } from './constants';
import { geminiService } from './services/geminiService';
import { supabaseStorageService } from './services/supabaseStorageService';
import { supabase } from './services/supabaseService';
import { Heart, MessageCircle, X, Send, WifiOff, CloudOff, Inbox } from 'lucide-react';

const App: React.FC = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isEditingThought, setIsEditingThought] = useState(false);
  const [editingThoughtContent, setEditingThoughtContent] = useState('');
  const [likedThoughtIds, setLikedThoughtIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0); // 用于触发换一批
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Toast Helper
  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const authUserToAppUser = (u: any): User => {
    const metadataUsername = u.user_metadata?.username;
    return {
      id: u.id,
      username: metadataUsername || u.email?.split('@')?.[0] || '用户',
    };
  };

  // Persist auth on refresh
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('初始化认证状态...');
      const { data, error } = await supabase.auth.getSession();
      console.log('获取到的 session:', data);
      if (error) {
        console.error('Error loading auth session:', error);
        return;
      }
      if (!mounted) return;
      const user = data.session?.user;
      console.log('当前用户:', user);
      setCurrentUser(user ? authUserToAppUser(user) : null);
    };

    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('认证状态变化:', _event, session?.user?.id);
      const user = session?.user;
      setCurrentUser(user ? authUserToAppUser(user) : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('moodcloud_liked_thought_ids');
      const arr: unknown = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(arr) ? arr.filter(x => typeof x === 'string') as string[] : [];
      setLikedThoughtIds(new Set(ids));
    } catch {
      setLikedThoughtIds(new Set());
    }
  }, []);

  // Initialize data from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedThoughts = await supabaseStorageService.getThoughts();
      if (savedThoughts.length > 0) {
        setThoughts(savedThoughts);
      } else {
        setThoughts([]);
      }
      
      // Fetch supplementary AI thoughts only if needed or as background
      // For now, let's mix them in if we have few thoughts or just always
      // To match original logic:
      if (savedThoughts.length === 0) {
          // Fetch AI Layer
        try {
          const aiData = await geminiService.generateMockThoughts();
          const aiThoughts: Thought[] = aiData.map((item, idx) => ({
            id: `ai-${Date.now()}-${idx}`,
            content: item.content || '',
            type: item.type as ThoughtType || ThoughtType.WHISPER,
            author: 'AI Whispers',
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 50),
            echoes: Math.floor(Math.random() * 10),
            x: Math.random() * 80 + 5,
            y: Math.random() * 70 + 10,
            fontSize: Math.floor(Math.random() * 12) + 14,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
          }));
          
          setThoughts(prev => [...prev, ...aiThoughts]);
        } catch (aiErr) {
          console.warn("AI generation failed, continuing with DB thoughts only", aiErr);
          // Don't block app if AI fails
        }
      }
    } catch (err: any) {
      console.error("Data load failed:", err);
      setError(err.message || "无法连接到云端，请检查网络连接");
      addToast("数据加载失败", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load comments when a thought is selected
  useEffect(() => {
    if (selectedThought) {
      const loadComments = async () => {
        try {
          const comments = await supabaseStorageService.getComments(selectedThought.id);
          setComments(comments);
        } catch (err) {
          console.error("Failed to load comments:", err);
          addToast("评论加载失败", 'error');
        }
      };
      loadComments();
    }
  }, [selectedThought, addToast]);

  const handlePostThought = async (content: string, _isRefined?: boolean) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // AI Classification
    let thoughtType = ThoughtType.WHISPER;
    try {
      thoughtType = await geminiService.classifyThought(content);
    } catch (err) {
      console.warn("Classification failed, defaulting to WHISPER", err);
    }

    const newThought: Omit<Thought, 'id'> = {
      content,
      type: thoughtType,
      author: currentUser.username,
      authorId: currentUser.id,
      timestamp: Date.now(),
      likes: 0,
      echoes: 0,
      x: Math.random() * 80 + 5,
      y: Math.random() * 70 + 10,
      fontSize: 22,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    try {
      const savedThought = await supabaseStorageService.saveThought(newThought);
      setThoughts(prev => [savedThought, ...prev]);
      addToast("发布成功！", 'success');
    } catch (err: any) {
      console.error("Post thought failed:", err);
      addToast("发布失败：" + (err.message || "未知错误"), 'error');
    }
  };

  const handleRefine = async (content: string) => {
    if (!content.trim()) return;
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setIsRefining(true);
    try {
      const refined = await geminiService.refineThought(content);
      handlePostThought(refined);
    } catch (err) {
      addToast("AI 润色失败，请重试", 'error');
    } finally {
      setIsRefining(false);
    }
  };

  const handleLike = async (id: string) => {
    // Find the thought and increment likes
    const thought = thoughts.find(t => t.id === id);
    if (thought) {
      if (likedThoughtIds.has(id)) {
        return;
      }
      try {
        const newLikes = await supabaseStorageService.incrementThoughtLikes(id);
        
        setThoughts(prev => prev.map(t => t.id === id ? { ...t, likes: newLikes } : t));
        if (selectedThought?.id === id) {
          setSelectedThought(prev => prev ? { ...prev, likes: newLikes } : prev);
        }

        setLikedThoughtIds(prev => {
          const next = new Set(prev);
          next.add(id);
          localStorage.setItem('moodcloud_liked_thought_ids', JSON.stringify(Array.from(next)));
          return next;
        });
      } catch (err) {
        console.error("Like failed:", err);
        // Don't toast for likes usually, or maybe a subtle one? 
        // Let's add toast if it fails hard?
        // Actually, user expects instant feedback. Optimistic UI would be better but for now let's just handle error.
        addToast("点赞失败，请稍后重试", 'error');
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedThought) return;
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const newComment: Omit<Comment, 'id'> = {
      thoughtId: selectedThought.id,
      authorId: currentUser.id,
      author: currentUser.username,
      content: newCommentText,
      timestamp: Date.now()
    };

    try {
      const savedComment = await supabaseStorageService.addComment(newComment);
      setComments(prev => [...prev, savedComment]);
      setNewCommentText('');
      addToast("评论已发布", 'success');
      
      // Update thought echo count as "engagement"
      if (selectedThought.authorId && selectedThought.authorId === currentUser.id) {
        try {
          const updatedThought = await supabaseStorageService.updateThought(selectedThought.id, {
            echoes: selectedThought.echoes + 1
          });
          setSelectedThought(updatedThought);
          setThoughts(prev => prev.map(t => t.id === selectedThought.id ? updatedThought : t));
        } catch (ignore) {
          // Non-critical update
        }
      }
    } catch (err: any) {
      console.error("Add comment failed:", err);
      addToast("评论失败：" + (err.message || "未知错误"), 'error');
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    addToast(`欢迎回来，${user.username}`, 'success');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfile(false);
    addToast("已退出登录", 'info');
  };

  const handleMyClick = () => {
    if (currentUser) setShowProfile(true);
    else setShowAuthModal(true);
  };

  const canManageSelectedThought =
    !!currentUser &&
    !!selectedThought &&
    !!selectedThought.authorId &&
    selectedThought.authorId === currentUser.id;

  const startEditSelectedThought = () => {
    if (!selectedThought) return;
    setIsEditingThought(true);
    setEditingThoughtContent(selectedThought.content);
  };

  const cancelEditSelectedThought = () => {
    setIsEditingThought(false);
    setEditingThoughtContent('');
  };

  const saveEditSelectedThought = async () => {
    if (!selectedThought) return;
    if (!editingThoughtContent.trim()) return;
    if (!canManageSelectedThought) return;

    try {
      const updated = await supabaseStorageService.updateThought(selectedThought.id, {
        content: editingThoughtContent
      });

      setSelectedThought(updated);
      setThoughts(prev => prev.map(t => t.id === updated.id ? updated : t));
      cancelEditSelectedThought();
      addToast("更新成功", 'success');
    } catch (err: any) {
      console.error("Update thought failed:", err);
      addToast("更新失败：" + (err.message || "未知错误"), 'error');
    }
  };

  const deleteSelectedThought = async () => {
    if (!selectedThought) return;
    if (!canManageSelectedThought) return;

    try {
      await supabaseStorageService.deleteThought(selectedThought.id);
      setThoughts(prev => prev.filter(t => t.id !== selectedThought.id));
      setSelectedThought(null);
      addToast("已删除", 'success');
    } catch (err: any) {
      console.error("Delete thought failed:", err);
      addToast("删除失败：" + (err.message || "权限不足或网络错误"), 'error');
    }
  };

  const openThoughtFromProfile = (thought: Thought) => {
    setSelectedThought(thought);
    setShowProfile(false);
  };

  const deleteThoughtsFromProfile = async (ids: string[]) => {
    if (!ids.length) return;

    let failCount = 0;
    for (const id of ids) {
      try {
        await supabaseStorageService.deleteThought(id);
        setThoughts(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        failCount++;
      }
    }
    
    // Also clear selection if deleted
    if (selectedThought && ids.includes(selectedThought.id)) {
      setSelectedThought(null);
    }

    if (failCount > 0) {
      addToast(`删除完成，但有 ${failCount} 个失败`, 'info');
    } else {
      addToast("删除成功", 'success');
    }
  };

  const handleRefreshBatch = () => {
    // 通过更新 refreshKey 来触发 ThoughtCloud 重新抽样
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-screen">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <NavBar 
        currentUser={currentUser} 
        onMyClick={handleMyClick} 
        onRefreshClick={handleRefreshBatch}
      />
      
      <main className="pt-16 pb-32 h-full flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
             <p className="text-slate-400 animate-pulse">正在收集思绪...</p>
          </div>
        ) : error ? (
          <StatusMessage
            icon={WifiOff}
            title="无法连接到云端"
            description={error}
            actionLabel="重试"
            onAction={loadData}
          />
        ) : thoughts.length === 0 ? (
          <StatusMessage
            icon={Inbox}
            title="这里空空如也"
            description="还没有人发布思绪，也许你是第一个？"
            actionLabel="发布思绪"
            onAction={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()}
          />
        ) : (
          <ThoughtCloud 
            thoughts={thoughts} 
            onThoughtClick={setSelectedThought} 
            maxItems={100}
            refreshKey={refreshKey}
          />
        )}
      </main>

      <InputBar 
        onSubmit={handlePostThought} 
        onRefine={handleRefine}
        isRefining={isRefining}
      />

      {/* Thought Detail & Comments Modal */}
      {selectedThought && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-300 overflow-hidden">
            <button 
              onClick={() => setSelectedThought(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X size={24} />
            </button>
            
            <div className="p-8 pb-4">
              <div className="mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-500 text-xs font-bold uppercase tracking-wider">
                  {selectedThought.type}
                </span>
              </div>
              {isEditingThought ? (
                <div className="mb-6">
                  <textarea
                    value={editingThoughtContent}
                    onChange={(e) => setEditingThoughtContent(e.target.value)}
                    className="w-full min-h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-base outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end gap-3 mt-3">
                    <button
                      onClick={cancelEditSelectedThought}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={saveEditSelectedThought}
                      disabled={!editingThoughtContent.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-serif text-slate-800 leading-relaxed mb-6">
                  「 {selectedThought.content} 」
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-50 pb-4">
                <span>由 {selectedThought.author} 发布</span>
                <span>{new Date(selectedThought.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-8 py-4 bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
                <MessageCircle size={16} /> 评论 ({comments.length})
              </h4>
              {comments.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">暂时还没有人评论，快来抢沙发...</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-indigo-600">{comment.author}</span>
                        <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions & Comment Input */}
            <div className="p-8 pt-4 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-6 mb-6">
                <button 
                  onClick={() => handleLike(selectedThought.id)}
                  className="flex items-center gap-2 text-slate-400 hover:text-pink-500 transition-colors"
                >
                  <Heart size={22} className={likedThoughtIds.has(selectedThought.id) ? 'fill-pink-500 text-pink-500' : ''} />
                  <span className="text-sm font-bold">{selectedThought.likes}</span>
                </button>

                {canManageSelectedThought && !isEditingThought && (
                  <>
                    <button
                      onClick={startEditSelectedThought}
                      className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={deleteSelectedThought}
                      className="text-sm font-bold text-slate-400 hover:text-red-600 transition-colors"
                    >
                      删除
                    </button>
                  </>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-3">
                <input 
                  type="text"
                  placeholder={currentUser ? "说点什么吧..." : "请登录后参与讨论"}
                  disabled={!currentUser}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!currentUser || !newCommentText.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:bg-slate-300 disabled:shadow-none"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin}
        />
      )}

      {/* Profile Page */}
      {showProfile && currentUser && (
        <ProfileView 
          user={currentUser}
          thoughts={thoughts}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onSelectThought={openThoughtFromProfile}
          onDeleteThoughts={deleteThoughtsFromProfile}
        />
      )}

      {/* Decorative gradients */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-purple-200 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default App;
