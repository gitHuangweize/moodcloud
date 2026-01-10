
import React, { useState, useEffect } from 'react';
import { Send, Sparkles, X, Check, RotateCcw, Loader2 } from 'lucide-react';

interface InputBarProps {
  onSubmit: (content: string, isRefined: boolean) => void;
  onRefine: (content: string) => Promise<string | null>;
  isRefining: boolean;
  isPublishing?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, onRefine, isRefining, isPublishing = false }) => {
  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isRefined, setIsRefined] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if ((e.nativeEvent as any)?.isComposing || isComposing) {
        return;
      }
      e.preventDefault();
      if (text.trim()) {
        handleFinalSubmit();
      }
    }
  };

  const handleRefineClick = async () => {
    if (!text.trim() || isRefining) return;
    
    // 如果已经是润色后的状态，且想再次润色，先记录当前为原文
    if (!isRefined) {
      setOriginalText(text);
    }
    
    const refined = await onRefine(text);
    if (refined) {
      setText(refined);
      setIsRefined(true);
    }
  };

  const handleUndo = () => {
    setText(originalText);
    setIsRefined(false);
  };

  const handleFinalSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text, isRefined);
    setText('');
    setOriginalText('');
    setIsRefined(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="relative group">
          <div className={`absolute -inset-1 bg-gradient-to-r ${isRefined ? 'from-amber-400 to-orange-400' : 'from-purple-400 to-indigo-400'} rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
          <div className={`relative flex items-center ${isRefined ? 'bg-orange-50/90' : 'bg-white/80'} backdrop-blur-xl border ${isRefined ? 'border-orange-200' : 'border-white/20'} rounded-[2rem] px-6 py-4 shadow-2xl overflow-hidden transition-colors duration-500`}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={handleKeyDown}
              placeholder={isRefined ? "修改 AI 润色的内容..." : "今天想说点什么..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 text-lg placeholder-slate-400"
            />
            <div className="flex items-center gap-2">
              {isRefined && (
                <button
                  onClick={handleUndo}
                  className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-all"
                  title="撤销润色"
                >
                  <RotateCcw size={20} />
                </button>
              )}
              
              {!isRefined ? (
                <button
                  onClick={handleRefineClick}
                  disabled={!text.trim() || isRefining}
                  className={`p-2 rounded-full transition-all ${
                    text.trim() ? 'text-indigo-500 hover:bg-indigo-50' : 'text-slate-300'
                  }`}
                  title="AI 润色"
                >
                  {isRefining ? (
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                  ) : (
                    <Sparkles size={24} />
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full animate-in fade-in zoom-in duration-300">
                  <Sparkles size={14} className="text-orange-500" />
                  <span className="text-[10px] font-bold text-orange-600 uppercase">AI 已润色</span>
                </div>
              )}

              <button
                onClick={handleFinalSubmit}
                disabled={!text.trim() || isPublishing}
                className={`p-3 rounded-2xl transition-all shadow-lg flex items-center justify-center ${
                  text.trim() 
                    ? isRefined 
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-400'
                }`}
                title={isRefined ? "确认发布" : "直接发布"}
              >
                {isPublishing ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  isRefined ? <Check size={20} /> : <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 text-xs mt-3 select-none">
          {isRefined ? "你可以直接修改润色结果，或点击左侧撤销。确认后发布。" : "按下 Enter 发送你的心情。AI 润色可以帮你把碎碎念变成诗。"}
        </p>
      </div>
    </div>
  );
};

export default InputBar;
