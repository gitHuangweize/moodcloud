
import React from 'react';
import { User as UserIcon, Cloud, Info, LogIn, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface NavBarProps {
  currentUser: User | null;
  onMyClick: () => void;
  onRefreshClick?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser, onMyClick, onRefreshClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 select-none">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Cloud size={24} />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          MoodCloud
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {onRefreshClick && (
          <button 
            onClick={onRefreshClick}
            className="px-3 py-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 text-sm font-semibold flex items-center gap-2 hover:shadow-md transition-all active:scale-95"
            title="换一批"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">换一批</span>
          </button>
        )}
        
        <button className="hidden md:flex text-slate-500 hover:text-indigo-600 transition-colors items-center gap-1 text-sm font-medium">
          <Info size={18} />
          <span>关于</span>
        </button>
        <button 
          onClick={onMyClick}
          className="px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 text-slate-600 text-sm font-semibold flex items-center gap-2 hover:shadow-md transition-all active:scale-95"
        >
          {currentUser ? (
            <>
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span>{currentUser.username}</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>登录/注册</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
