
import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import ThoughtCloud from './components/ThoughtCloud';
import InputBar from './components/InputBar';
import AuthModal from './components/AuthModal';
import ProfileView from './components/ProfileView';
import { Thought, ThoughtType, User, Comment } from './types';
import { INITIAL_THOUGHTS, COLORS } from './constants';
import { geminiService } from './services/geminiService';
import { supabaseStorageService } from './services/supabaseStorageService';
import { Heart, MessageCircle, X, Send } from 'lucide-react';

const App: React.FC = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Initialize data from Supabase
  useEffect(() => {
    const loadData = async () => {
      const savedThoughts = await supabaseStorageService.getThoughts();
      if (savedThoughts.length > 0) {
        setThoughts(savedThoughts);
      } else {
        setThoughts(INITIAL_THOUGHTS);
        // Save initial thoughts to Supabase
        for (const thought of INITIAL_THOUGHTS) {
          await supabaseStorageService.saveThought(thought);
        }
      }
    };
    loadData();

    // Fetch supplementary AI thoughts
    const fetchAILayer = async () => {
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
      setThoughts(prev => {
        const combined = [...prev, ...aiThoughts];
        // Save AI thoughts to Supabase
        aiThoughts.forEach(async (thought) => {
          await supabaseStorageService.saveThought(thought);
        });
        return combined;
      });
    };

    fetchAILayer();
  }, []);

  // Sync thoughts to storage on change (removed for Supabase as we save on each operation)

  // Load comments when a thought is selected
  useEffect(() => {
    if (selectedThought) {
      const loadComments = async () => {
        const comments = await supabaseStorageService.getComments(selectedThought.id);
        setComments(comments);
      };
      loadComments();
    }
  }, [selectedThought]);

  const handlePostThought = async (content: string) => {
    const newThought: Omit<Thought, 'id'> = {
      content,
      type: ThoughtType.WHISPER,
      author: currentUser ? currentUser.username : '匿名访客',
      authorId: currentUser?.id,
      timestamp: Date.now(),
      likes: 0,
      echoes: 0,
      x: Math.random() * 80 + 5,
      y: Math.random() * 70 + 10,
      fontSize: 22,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    const savedThought = await supabaseStorageService.saveThought(newThought);
    if (savedThought) {
      setThoughts(prev => [savedThought, ...prev]);
    }
  };

  const handleRefine = async (content: string) => {
    if (!content.trim()) return;
    setIsRefining(true);
    try {
      const refined = await geminiService.refineThought(content);
      handlePostThought(refined);
    } finally {
      setIsRefining(false);
    }
  };

  const handleLike = async (id: string) => {
    // Find the thought and increment likes
    const thought = thoughts.find(t => t.id === id);
    if (thought) {
      const updatedThought = await supabaseStorageService.updateThought(id, {
        likes: thought.likes + 1
      });
      if (updatedThought) {
        setThoughts(prev => prev.map(t => t.id === id ? updatedThought : t));
        if (selectedThought?.id === id) {
          setSelectedThought(updatedThought);
        }
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedThought) return;

    const newComment: Omit<Comment, 'id'> = {
      thoughtId: selectedThought.id,
      author: currentUser ? currentUser.username : '匿名访客',
      content: newCommentText,
      timestamp: Date.now()
    };

    const savedComment = await supabaseStorageService.addComment(newComment);
    if (savedComment) {
      setComments(prev => [...prev, savedComment]);
      setNewCommentText('');
      
      // Update thought echo count as "engagement"
      const updatedThought = await supabaseStorageService.updateThought(selectedThought.id, {
        echoes: selectedThought.echoes + 1
      });
      if (updatedThought) {
        setSelectedThought(updatedThought);
        setThoughts(prev => prev.map(t => t.id === selectedThought.id ? updatedThought : t));
      }
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // TODO: Implement proper auth with Supabase Auth
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // TODO: Implement proper logout with Supabase Auth
    setShowProfile(false);
  };

  const handleMyClick = () => {
    if (currentUser) setShowProfile(true);
    else setShowAuthModal(true);
  };

  return (
    <div className="relative w-full h-screen">
      <NavBar currentUser={currentUser} onMyClick={handleMyClick} />
      
      <main className="pt-16 pb-32">
        <ThoughtCloud 
          thoughts={thoughts} 
          onThoughtClick={setSelectedThought} 
        />
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
              <p className="text-2xl font-serif text-slate-800 leading-relaxed mb-6">
                「 {selectedThought.content} 」
              </p>
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
                  <Heart size={22} className={selectedThought.likes > 0 ? 'fill-pink-500 text-pink-500' : ''} />
                  <span className="text-sm font-bold">{selectedThought.likes}</span>
                </button>
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
          onSelectThought={setSelectedThought}
        />
      )}

      {/* Decorative gradients */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-purple-200 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default App;
