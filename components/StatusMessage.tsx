import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusMessageProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 ${className}`}>
      <div className="bg-slate-50 p-4 rounded-full mb-4">
        <Icon size={32} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-serif font-medium text-slate-700 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default StatusMessage;
