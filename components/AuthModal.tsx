
import React, { useState } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { User } from '../types';
import { ensureUserProfile } from '../services/userService';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const authUserToAppUser = (u: any): User => ({
    id: u.id,
    username: u.user_metadata?.username || u.email?.split('@')?.[0] || '用户',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.user) {
          // 确保用户在 public.users 表中有记录
          const userProfile = await ensureUserProfile(data.user);
          if (userProfile) {
            onLogin(userProfile);
            onClose();
          } else {
            setError('登录成功，但获取用户资料失败');
          }
          return;
        }
      } catch (err: any) {
        setError(err?.message || '登录失败，请稍后重试');
      }
    } else {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.user) {
          // 确保用户在 public.users 表中有记录
          const userProfile = await ensureUserProfile(data.user);
          if (userProfile) {
            onLogin(userProfile);
            onClose();
            return;
          }
        }
        setError('注册成功，但需要验证邮箱后才能登录');
      } catch (err: any) {
        setError(err?.message || '注册失败，请稍后重试');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          {isLogin ? <LogIn /> : <UserPlus />}
          {isLogin ? '欢迎回来' : '加入我们'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">邮箱</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="your@email.com"
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">用户名</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="起个昵称吧"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="至少6位"
              minLength={6}
            />
          </div>
          {error && <p className="text-red-500 text-xs italic">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            {isLogin ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            {isLogin ? '还没有账号？立即注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
