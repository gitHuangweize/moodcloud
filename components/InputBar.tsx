
import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface InputBarProps {
  onSubmit: (content: string, isRefined: boolean) => void;
  onRefine: (content: string) => Promise<void>;
  isRefining: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, onRefine, isRefining }) => {
  const [text, setText] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if ((e.nativeEvent as any)?.isComposing || isComposing) {
        return;
      }
      e.preventDefault();
      if (text.trim()) {
        onSubmit(text, false);
        setText('');
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2rem] px-6 py-4 shadow-2xl overflow-hidden">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={handleKeyDown}
              placeholder="今天想说点什么..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 text-lg placeholder-slate-400"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => onRefine(text)}
                disabled={!text.trim() || isRefining}
                className={`p-2 rounded-full transition-all ${
                  text.trim() ? 'text-indigo-500 hover:bg-indigo-50' : 'text-slate-300'
                } ${isRefining ? 'animate-pulse' : ''}`}
                title="AI 润色"
              >
                <Sparkles size={24} />
              </button>
              <button
                onClick={() => {
                  if (text.trim()) {
                    onSubmit(text, false);
                    setText('');
                  }
                }}
                disabled={!text.trim()}
                className={`p-3 rounded-2xl transition-all shadow-lg ${
                  text.trim() 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs mt-3 select-none">
          按下 Enter 发送你的心情。AI 润色可以帮你把牢骚变成诗。
        </p>
      </div>
    </div>
  );
};

export default InputBar;
