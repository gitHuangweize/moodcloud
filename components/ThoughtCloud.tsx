
import React, { useMemo, useCallback } from 'react';
import { Thought } from '../types';

interface ThoughtCloudProps {
  thoughts: Thought[];
  onThoughtClick: (thought: Thought) => void;
  maxItems?: number;
  refreshKey?: number;
}

// 单个想法组件，使用 React.memo 优化
const ThoughtItem: React.FC<{
  thought: Thought;
  onClick: (thought: Thought) => void;
}> = React.memo(({ thought, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(thought);
  }, [thought, onClick]);

  return (
    <div
      key={thought.id}
      className={`absolute cursor-pointer select-none transition-all duration-700 hover:scale-110 active:scale-95 animate-float ${thought.color} whitespace-nowrap`}
      style={{
        left: `${thought.x}%`,
        top: `${thought.y}%`,
        fontSize: `${thought.fontSize}px`,
        opacity: 0.8,
        animationDelay: `${Math.random() * 5}s`,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))',
      }}
      onClick={handleClick}
    >
      {thought.content}
    </div>
  );
});

const ThoughtCloud: React.FC<ThoughtCloudProps> = ({ thoughts, onThoughtClick, maxItems = 100, refreshKey = 0 }) => {
  const displayedThoughts = useMemo(() => {
    if (thoughts.length <= maxItems) {
      return thoughts;
    }
    
    // 使用 Fisher-Yates 洗牌算法进行随机抽样，性能更好
    const shuffled = [...thoughts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, maxItems);
  }, [thoughts, maxItems, refreshKey]);

  // 使用 useCallback 稳定 onThoughtClick 引用
  const handleThoughtClick = useCallback((thought: Thought) => {
    onThoughtClick(thought);
  }, [onThoughtClick]);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] overflow-hidden pointer-events-auto">
      {displayedThoughts.map((thought) => (
        <ThoughtItem 
          key={thought.id} 
          thought={thought} 
          onClick={handleThoughtClick}
        />
      ))}
    </div>
  );
};

export default ThoughtCloud;
