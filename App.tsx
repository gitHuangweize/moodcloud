
import React, { useState, useEffect, useCallback } from 'react';
import NavBar from './components/NavBar';
import ThoughtCloud from './components/ThoughtCloud';
import InputBar from './components/InputBar';
import AuthModal from './components/AuthModal';
import ProfileView from './components/ProfileView';
import StatsView from './components/StatsView';
import StatusMessage from './components/StatusMessage';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { Thought, ThoughtType, User, Comment, AppNotification } from './types';
import { INITIAL_THOUGHTS, COLORS, TYPE_COLORS } from './constants';
import { geminiService } from './services/geminiService';
import { supabaseStorageService } from './services/supabaseStorageService';
import { supabase } from './services/supabaseService';
import { Heart, MessageCircle, X, Send, WifiOff, CloudOff, Inbox, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsPage, setCommentsPage] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditingThought, setIsEditingThought] = useState(false);
  const [editingThoughtContent, setEditingThoughtContent] = useState('');
  const [likedThoughtIds, setLikedThoughtIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0); // 用于触发换一批
  
  // Search & Filter States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [filterAuthorId, setFilterAuthorId] = useState<string | null>(null);
  const [filterAuthorName, setFilterAuthorName] = useState<string | undefined>(undefined);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);

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

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await supabaseStorageService.getNotifications(currentUser.id);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();

      // Subscribe to Realtime notifications
      const channel = supabase
        .channel(`user-notifications-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `receiver_id=eq.${currentUser.id}`,
          },
          (payload) => {
            console.log('New notification received:', payload);
            loadNotifications();
            addToast('收到一条新提醒', 'info');
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser, loadNotifications, addToast]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await supabaseStorageService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await supabaseStorageService.markAllNotificationsAsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast('已全部标记为已读', 'success');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    handleMarkAsRead(notification.id);
    const thought = thoughts.find(t => t.id === notification.thoughtId);
    if (thought) {
      setSelectedThought(thought);
      setShowNotifications(false);
    } else {
      // If thought is not in current view, fetch it separately (could be implemented later)
      addToast('思绪已不在当前视野中', 'info');
    }
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
      const filters = {
        keyword: searchKeyword.trim() || undefined,
        type: selectedType !== 'ALL' ? selectedType : undefined,
        authorId: filterAuthorId || undefined,
        tag: searchKeyword.startsWith('#') ? searchKeyword.substring(1) : undefined
      };
      
      // If keyword is a tag, we might want to prioritize tag search or combine
      if (filters.tag) {
        filters.keyword = undefined; // Use precise tag search instead of ilike content
      }
      
      const savedThoughts = await supabaseStorageService.getThoughts(filters);
      if (savedThoughts.length > 0) {
        setThoughts(savedThoughts);
      } else {
        setThoughts([]);
      }
      
      // Fetch supplementary AI thoughts only if no filters are applied and no thoughts found
      const isFiltered = !!(filters.keyword || filters.type || filters.authorId);
      if (savedThoughts.length === 0 && !isFiltered) {
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
  }, [addToast, searchKeyword, selectedType, filterAuthorId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300); // Add debounce for keyword search
    return () => clearTimeout(timer);
  }, [loadData, searchKeyword, selectedType, filterAuthorId]);

  // Load comments when a thought is selected
  const loadComments = useCallback(async (thoughtId: string, page: number = 0, isLoadMore: boolean = false) => {
    setIsLoadingComments(true);
    try {
      const { data, hasMore, totalCount } = await supabaseStorageService.getComments(thoughtId, page);
      if (isLoadMore) {
        setComments(prev => [...prev, ...data]);
      } else {
        setComments(data);
        // 校准详情页显示的评论数
        setTotalComments(totalCount);
        
        // 如果数据库中的 echoes 计数与实际评论数不符，进行同步
        // 注意：此处我们需要使用最新的 totalCount 来更新 thoughts 列表
        setThoughts(prev => prev.map(t => {
          if (t.id === thoughtId && t.echoes !== totalCount) {
            // 异步在后台更新数据库
            supabaseStorageService.updateThought(thoughtId, { echoes: totalCount }).catch(e => {
              console.warn("Failed to sync echoes count to DB:", e);
            });
            return { ...t, echoes: totalCount };
          }
          return t;
        }));

        // 同时更新当前选中的 thought 对象
        setSelectedThought(prev => {
          if (prev && prev.id === thoughtId && prev.echoes !== totalCount) {
            return { ...prev, echoes: totalCount };
          }
          return prev;
        });
      }
      setHasMoreComments(hasMore);
      setCommentsPage(page);
    } catch (err) {
      console.error("Failed to load comments:", err);
      addToast("评论加载失败", 'error');
    } finally {
      setIsLoadingComments(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (selectedThought) {
      loadComments(selectedThought.id, 0, false);
    } else {
      setComments([]);
      setCommentsPage(0);
      setHasMoreComments(false);
    }
  }, [selectedThought, loadComments]);

  const handleLoadMoreComments = () => {
    if (selectedThought && !isLoadingComments && hasMoreComments) {
      loadComments(selectedThought.id, commentsPage + 1, true);
    }
  };

  const handlePostThought = async (content: string, _isRefined?: boolean) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setIsPublishing(true); // 使用局部发布状态，而不是全局 Loading
    setIsLoading(false); // 确保全局 Loading 关闭
    // AI Classification
    let thoughtType = ThoughtType.WHISPER;
    try {
      thoughtType = await geminiService.classifyThought(content);
    } catch (err) {
      console.warn("Classification failed, defaulting to WHISPER", err);
    }

    // Extract tags using regex
    const tagRegex = /#([^#\s]+)/g;
    const matches = content.match(tagRegex);
    const tags = matches ? Array.from(new Set(matches.map(m => m.substring(1)))) : [];

    const typeColors = TYPE_COLORS[thoughtType] || TYPE_COLORS[ThoughtType.WHISPER];
    const color = typeColors[Math.floor(Math.random() * typeColors.length)];

    const newThought: Omit<Thought, 'id'> = {
      content,
      type: thoughtType,
      author: currentUser.username,
      authorId: currentUser.id,
      timestamp: Date.now(),
      likes: 0,
      echoes: 0,
      x: 45 + Math.random() * 10, // 初始位置更靠近中心
      y: 45 + Math.random() * 10,
      fontSize: 26, // 新发布的稍微大一点
      color,
      tags
    };

    try {
      const savedThought = await supabaseStorageService.saveThought(newThought);
      setThoughts(prev => [savedThought, ...prev]);
      addToast("发布成功！", 'success');
    } catch (err: any) {
      console.error("Post thought failed:", err);
      addToast("发布失败：" + (err.message || "未知错误"), 'error');
    } finally {
      setIsPublishing(false); // 结束发布状态
    }
  };

  const handleRefine = async (content: string): Promise<string | null> => {
    if (!content.trim()) return null;
    if (!currentUser) {
      setShowAuthModal(true);
      return null;
    }
    setIsRefining(true);
    try {
      const refined = await geminiService.refineThought(content);
      return refined;
    } catch (err) {
      addToast("AI 润色失败，请重试", 'error');
      return null;
    } finally {
      setIsRefining(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Find the thought
    const thought = thoughts.find(t => t.id === id);
    if (thought) {
      try {
        const { isLiked, totalLikes } = await supabaseStorageService.toggleThoughtLike(id);
        
        setThoughts(prev => prev.map(t => t.id === id ? { ...t, likes: totalLikes } : t));
        if (selectedThought?.id === id) {
          setSelectedThought(prev => prev ? { ...prev, likes: totalLikes } : prev);
        }

        setLikedThoughtIds(prev => {
          const next = new Set(prev);
          if (isLiked) {
            next.add(id);
          } else {
            next.delete(id);
          }
          localStorage.setItem('moodcloud_liked_thought_ids', JSON.stringify(Array.from(next)));
          return next;
        });
      } catch (err) {
        console.error("Toggle like failed:", err);
        addToast("操作失败，请稍后重试", 'error');
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
      setComments(prev => [savedComment, ...prev]); // 将新评论添加到开头，因为是按时间倒序排列
      setTotalComments(prev => prev + 1);
      setNewCommentText('');
      addToast("评论已发布", 'success');
      
      // Update thought echo count as "engagement"
      try {
        const updatedCount = totalComments + 1;
        const updatedThought = await supabaseStorageService.updateThought(selectedThought.id, {
          echoes: updatedCount
        });
        setSelectedThought(updatedThought);
        setThoughts(prev => prev.map(t => t.id === selectedThought.id ? updatedThought : t));
      } catch (ignore) {
        // Non-critical update
      }
    } catch (err: any) {
      console.error("Add comment failed:", err);
      addToast("评论失败：" + (err.message || "未知错误"), 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedThought) return;
    try {
      await supabaseStorageService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalComments(prev => Math.max(0, prev - 1));
      addToast("评论已删除", 'success');

      // Update thought echo count
      try {
        const updatedCount = Math.max(0, totalComments - 1);
        const updatedThought = await supabaseStorageService.updateThought(selectedThought.id, {
          echoes: updatedCount
        });
        setSelectedThought(updatedThought);
        setThoughts(prev => prev.map(t => t.id === selectedThought.id ? updatedThought : t));
      } catch (ignore) {
        // Non-critical update
      }
    } catch (err: any) {
      console.error("Delete comment failed:", err);
      addToast("删除评论失败：" + (err.message || "未知错误"), 'error');
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
    if (currentUser) {
      setProfileUser(currentUser);
      setShowProfile(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthorClick = async (authorId: string) => {
    if (!authorId) return;
    
    // Find author name from existing thoughts or fetch it
    const authorThought = thoughts.find(t => t.authorId === authorId);
    if (authorThought) {
      setFilterAuthorName(authorThought.author);
    } else {
      try {
        const user = await supabaseStorageService.getUserById(authorId);
        setFilterAuthorName(user.username);
      } catch (err) {
        setFilterAuthorName('未知作者');
      }
    }

    // Set filter to this author and close detail modal
    setFilterAuthorId(authorId);
    setSelectedThought(null);
    addToast("已筛选该作者的思绪", 'info');
  };

  const handleTagClick = (tag: string) => {
    setSearchKeyword(`#${tag}`);
    setSelectedThought(null);
    addToast(`正在筛选话题: #${tag}`, 'info');
  };

  const renderContentWithTags = (content: string) => {
    const parts = content.split(/(#\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        const tagName = part.substring(1);
        return (
          <span 
            key={i} 
            onClick={(e) => {
              e.stopPropagation();
              handleTagClick(tagName);
            }}
            className="text-indigo-500 hover:text-indigo-700 cursor-pointer font-medium transition-colors"
          >
            {part}
          </span>
        );
      }
      return part;
    });
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
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        filterAuthorName={filterAuthorName}
        onClearAuthorFilter={() => {
          setFilterAuthorId(null);
          setFilterAuthorName(undefined);
        }}
        unreadNotifications={unreadCount}
        onNotificationsClick={() => setShowNotifications(!showNotifications)}
        onStatsClick={() => setShowStats(true)}
      />

      {/* Notifications Modal/Dropdown */}
      {showNotifications && (
        <div className="fixed top-20 right-8 w-80 max-h-[70vh] bg-white rounded-3xl shadow-2xl border border-slate-100 z-[110] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Bell size={18} className="text-indigo-600" />
              提醒通知
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                全部已读
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">暂无新提醒</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${n.isRead ? 'opacity-60 grayscale-[0.5] hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-600">{n.senderName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {n.type === 'LIKE' ? '点赞了你的思绪' : `评论了你：${n.content}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Publishing Overlay - Special loading state for publishing */}
      {isPublishing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <CloudOff size={24} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-bold text-slate-800">发布中...</h3>
              <p className="text-slate-500 text-sm">正在将你的思绪寄往云端</p>
            </div>
          </div>
        </div>
      )}

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
        isPublishing={isPublishing}
      />

      {/* Thought Detail & Comments Modal */}
      {selectedThought && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedThought(null);
          }}
        >
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
                  「 {renderContentWithTags(selectedThought.content)} 」
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-50 pb-4">
                <button 
                  onClick={() => selectedThought.authorId && handleAuthorClick(selectedThought.authorId)}
                  className="group flex items-center gap-1 hover:text-indigo-600 transition-all"
                  title="查看该作者的所有思绪"
                >
                  <span className="opacity-60 group-hover:opacity-100 transition-opacity">由</span>
                  <span className="font-bold underline underline-offset-4 decoration-indigo-200 group-hover:decoration-indigo-500 transition-all">
                    {selectedThought.author}
                  </span>
                  <span className="opacity-60 group-hover:opacity-100 transition-opacity">发布</span>
                </button>
                <span>{new Date(selectedThought.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-8 py-4 bg-slate-50/50">
              <h4 className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-2">
                <MessageCircle size={16} /> 评论 ({totalComments})
              </h4>
              {comments.length === 0 && !isLoadingComments ? (
                <p className="text-sm text-slate-400 italic text-center py-8">暂时还没有人评论，快来抢沙发...</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-indigo-600">{comment.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                          {currentUser && comment.authorId === currentUser.id && (
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                              title="删除评论"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                  
                  {isLoadingComments && (
                    <div className="py-4 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {hasMoreComments && !isLoadingComments && (
                    <button 
                      onClick={handleLoadMoreComments}
                      className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      查看更多评论
                    </button>
                  )}
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
      {showProfile && profileUser && (
        <ProfileView 
          user={profileUser} 
          currentUser={currentUser}
          thoughts={thoughts}
          isCurrentUser={currentUser?.id === profileUser.id}
          onClose={() => setShowProfile(false)} 
          onLogout={handleLogout}
          onSelectThought={setSelectedThought}
          onDeleteThoughts={async (ids) => {
            try {
              for (const id of ids) {
                await supabaseStorageService.deleteThought(id);
              }
              setThoughts(prev => prev.filter(t => !ids.includes(t.id)));
              addToast("删除成功", 'success');
            } catch (err) {
              addToast("删除失败", 'error');
            }
          }}
        />
      )}

      {showStats && (
        <StatsView onClose={() => setShowStats(false)} />
      )}

      {/* Decorative gradients */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-purple-200 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default App;
