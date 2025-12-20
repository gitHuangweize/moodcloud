
import React, { useMemo } from 'react';
import { Thought } from '../types';

interface ThoughtCloudProps {
  thoughts: Thought[];
  onThoughtClick: (thought: Thought) => void;
}

const ThoughtCloud: React.FC<ThoughtCloudProps> = ({ thoughts, onThoughtClick }) => {
  return (
    <div className="relative w-full h-[calc(100vh-120px)] overflow-hidden pointer-events-auto">
      {thoughts.map((thought) => (
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
          onClick={() => onThoughtClick(thought)}
        >
          {thought.content}
        </div>
      ))}
    </div>
  );
};

export default ThoughtCloud;
