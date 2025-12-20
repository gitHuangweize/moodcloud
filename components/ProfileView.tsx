
import React from 'react';
import { X, Clock, MessageCircle, Heart, LogOut } from 'lucide-react';
import { Thought, User } from '../types';

interface ProfileViewProps {
  user: User;
  thoughts: Thought[];
  onClose: () => void;
  onLogout: () => void;
  onSelectThought: (thought: Thought) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, thoughts, onClose, onLogout, onSelectThought }) => {
  const userThoughts = thoughts.filter(t => t.authorId === user.id);

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
