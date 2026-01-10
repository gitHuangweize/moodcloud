
import React from 'react';
import { User as UserIcon, Cloud, Info, LogIn, RefreshCw, Search, X, Filter, Bell, BarChart3 } from 'lucide-react';
import { User, ThoughtType } from '../types';

interface NavBarProps {
  currentUser: User | null;
  onMyClick: () => void;
  onRefreshClick?: () => void;
  searchKeyword: string;
  onSearchChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  filterAuthorName?: string;
  onClearAuthorFilter: () => void;
  unreadNotifications?: number;
  onNotificationsClick?: () => void;
  onStatsClick?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ 
  currentUser, 
  onMyClick, 
  onRefreshClick,
  searchKeyword,
  onSearchChange,
  selectedType,
  onTypeChange,
  filterAuthorName,
  onClearAuthorFilter,
  unreadNotifications = 0,
  onNotificationsClick,
  onStatsClick
}) => {
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

      <div className="flex-1 max-w-md mx-4 hidden sm:flex items-center gap-2">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索思绪内容..."
            className="w-full pl-10 pr-10 py-2 bg-slate-100/50 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          {searchKeyword && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
          <select 
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-600 outline-none px-2 cursor-pointer"
          >
            <option value="ALL">全部类型</option>
            {Object.values(ThoughtType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {filterAuthorName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100 animate-in fade-in slide-in-from-left-2 whitespace-nowrap">
            <UserIcon size={14} />
            <span>作者: {filterAuthorName}</span>
            <button 
              onClick={onClearAuthorFilter} 
              className="hover:text-indigo-800 p-0.5 hover:bg-indigo-100 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
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
        
        <button 
          onClick={onStatsClick}
          className="hidden md:flex text-slate-500 hover:text-indigo-600 transition-colors items-center gap-1 text-sm font-medium"
        >
          <BarChart3 size={18} />
          <span>统计</span>
        </button>

        <button className="hidden md:flex text-slate-500 hover:text-indigo-600 transition-colors items-center gap-1 text-sm font-medium">
          <Info size={18} />
          <span>关于</span>
        </button>

        {currentUser && (
          <button 
            onClick={onNotificationsClick}
            className="relative p-2 text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Bell size={22} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full animate-pulse">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
        )}
        
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
