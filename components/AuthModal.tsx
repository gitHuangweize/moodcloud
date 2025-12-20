
import React, { useState } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { supabaseStorageService } from '../services/supabaseStorageService';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // For now, we'll simulate login since Supabase Auth is not fully implemented
      const users = await supabaseStorageService.getUsers();
      const user = users.find(u => u.username === username);
      if (user) {
        onLogin(user);
        onClose();
      } else {
        setError('用户名不存在');
      }
    } else {
      const users = await supabaseStorageService.getUsers();
      if (users.some(u => u.username === username)) {
        setError('用户名已存在');
        return;
      }
      const newUser: Omit<User, 'id'> = {
        username,
      };
      const savedUser = await supabaseStorageService.saveUser(newUser);
      if (savedUser) {
        onLogin(savedUser);
        onClose();
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
            <label className="block text-sm font-medium text-slate-600 mb-1">用户名</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
