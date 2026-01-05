
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Thought } from '../types';

interface ThoughtCloudProps {
  thoughts: Thought[];
  onThoughtClick: (thought: Thought) => void;
  maxItems?: number;
  refreshKey?: number;
}

// 碰撞检测逻辑
const checkCollision = (rect1: any, rect2: any, padding = 1) => {
  return !(
    rect1.x + rect1.width + padding < rect2.x ||
    rect1.x > rect2.x + rect2.width + padding ||
    rect1.y + rect1.height + padding < rect2.y ||
    rect1.y > rect2.y + rect2.height + padding
  );
};

// 模拟 Canvas 测量文本宽度的辅助函数
const measureTextWidth = (text: string, fontSize: number) => {
  // 中文字符/全角符号权重 1.1，英文字符/半角符号权重 0.6
  const weight = text.split('').reduce((acc, char) => {
    return acc + (char.charCodeAt(0) > 255 ? 1.1 : 0.6);
  }, 0);
  return weight * fontSize;
};

// 单个想法组件，使用 React.memo 优化
const ThoughtItem: React.FC<{
  thought: Thought;
  onClick: (thought: Thought) => void;
  position: { x: number; y: number };
}> = React.memo(({ thought, onClick, position }) => {
  const handleClick = useCallback(() => {
    onClick(thought);
  }, [thought, onClick]);

  return (
    <div
      key={thought.id}
      className={`absolute cursor-pointer select-none transition-all duration-700 hover:scale-110 active:scale-95 animate-float ${thought.color} whitespace-nowrap`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        fontSize: `${thought.fontSize}px`,
        opacity: 0.8,
        animationDelay: `${(thought.timestamp % 5000) / 1000}s`,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))',
      }}
      onClick={handleClick}
    >
      {thought.content}
    </div>
  );
});

const ThoughtCloud: React.FC<ThoughtCloudProps> = ({ thoughts, onThoughtClick, maxItems = 100, refreshKey = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchDistance, setTouchDistance] = useState<number | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  // 监听容器大小变化
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width || 1200,
          height: entry.contentRect.height || 800
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 1. 随机抽样与位置重计算（避免重叠）
  const displayedThoughts = useMemo(() => {
    // 按照内容占据的预估面积从大到小排序，优先放置大词条
    const sampled = (thoughts.length <= maxItems ? [...thoughts] : 
      [...thoughts].sort(() => Math.random() - 0.5).slice(0, maxItems))
      .sort((a, b) => {
        const areaA = measureTextWidth(a.content, a.fontSize) * a.fontSize;
        const areaB = measureTextWidth(b.content, b.fontSize) * b.fontSize;
        return areaB - areaA;
      });

    const placedItems: any[] = [];
    const { width: containerW, height: containerH } = containerSize;

    return sampled.map((t) => {
      // 预估真实尺寸 (px)
      const widthPx = measureTextWidth(t.content, t.fontSize) * 1.1 + 40; 
      const heightPx = t.fontSize * 2.0; 

      const widthPct = (widthPx / containerW) * 100;
      const heightPct = (heightPx / containerH) * 100;

      // 采用向心分布策略：大部分思绪集中在中心，小部分散落在边缘
      // 范围缩小到 -20% 到 120%，保证不会太空
      const generatePosition = () => {
        // 使用正态分布思想，让位置更趋向中心 (50, 50)
        const bias = 0.3; // 集中度
        const xBase = 50 + (Math.random() - 0.5) * 140; // 基础范围
        const yBase = 50 + (Math.random() - 0.5) * 140;
        
        // 向中心拉拢
        const x = xBase * (1 - bias) + 50 * bias - (widthPct / 2);
        const y = yBase * (1 - bias) + 50 * bias - (heightPct / 2);
        return { x, y };
      };

      let { x, y } = generatePosition();
      let attempts = 0;
      const maxAttempts = 150;

      while (attempts < maxAttempts) {
        const currentRect = { x, y, width: widthPct, height: heightPct };
        // 适当减小 padding (2%) 增加密度
        const hasCollision = placedItems.some(item => checkCollision(currentRect, item, 2));

        if (!hasCollision) break;

        // 碰撞后重新生成，但依然保持向心倾向
        const nextPos = generatePosition();
        x = nextPos.x;
        y = nextPos.y;
        attempts++;
      }

      const finalRect = { x, y, width: widthPct, height: heightPct };
      placedItems.push(finalRect);
      return { ...t, x, y };
    });
  }, [thoughts, maxItems, refreshKey, containerSize]);

  // 2. 滚轮缩放处理
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(3, Math.max(0.5, prev * delta)));
    }
  };

  // 3. 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 仅左键拖拽
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchDistance !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance / touchDistance;
      setZoom(prev => Math.min(3, Math.max(0.5, prev * delta)));
      setTouchDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDistance(null);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[calc(100vh-120px)] overflow-hidden pointer-events-auto bg-transparent touch-none select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div 
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center'
        }}
      >
        {displayedThoughts.map((thought) => (
          <ThoughtItem 
            key={thought.id} 
            thought={thought} 
            position={{ x: thought.x, y: thought.y }}
            onClick={onThoughtClick}
          />
        ))}
      </div>
      
      {/* 缩放控制指示器（可选） */}
      <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        <div className="bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-500 font-mono">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};

export default ThoughtCloud;
