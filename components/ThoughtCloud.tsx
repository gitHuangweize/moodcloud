
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Thought } from '../types';
import { Sparkles } from 'lucide-react';

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
let measureContext: CanvasRenderingContext2D | null = null;
const measureTextWidth = (text: string, fontSize: number) => {
  if (!measureContext) {
    const canvas = document.createElement('canvas');
    measureContext = canvas.getContext('2d');
  }
  if (measureContext) {
    measureContext.font = `${fontSize}px sans-serif`;
    return measureContext.measureText(text).width;
  }
  // 回退逻辑
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
  isNew?: boolean;
  onNewAnimationEnd?: () => void;
}> = React.memo(({ thought, onClick, position, isNew, onNewAnimationEnd }) => {
  const handleClick = useCallback(() => {
    onClick(thought);
  }, [thought, onClick]);

  return (
    <div
      key={thought.id}
      className={`absolute cursor-pointer select-none transition-all duration-700 hover:scale-110 active:scale-95 ${
        isNew ? 'animate-new-thought z-20' : 'animate-float z-0'
      } ${thought.color} whitespace-nowrap`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        fontSize: isNew ? `${(thought.displayFontSize || thought.fontSize) + 8}px` : `${thought.displayFontSize || thought.fontSize}px`,
        opacity: isNew ? 1 : 0.8,
        animationDelay: isNew ? '0s' : `${(thought.timestamp % 5000) / 1000}s`,
        filter: isNew 
          ? 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))' 
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))',
        fontWeight: isNew ? 'bold' : 'normal',
        padding: isNew ? '8px 16px' : '0px',
        background: isNew ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        borderRadius: '1rem',
        backdropFilter: isNew ? 'blur(4px)' : 'none',
        border: isNew ? '2px dashed rgba(251, 191, 36, 0.4)' : 'none',
      }}
      onClick={handleClick}
      onAnimationEnd={isNew ? onNewAnimationEnd : undefined}
    >
      <div className="flex items-center gap-1">
        {isNew && <Sparkles size={18} className="text-amber-400 animate-pulse" />}
        {thought.content}
        {isNew && (
          <span className="absolute -top-3 -right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full scale-90 font-black shadow-lg animate-bounce">
            NEW
          </span>
        )}
      </div>
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
  const [cachedPositions, setCachedPositions] = useState<Map<string, {x: number, y: number}>>(new Map());

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

  // 1. 布局计算
  const displayedThoughts = useMemo(() => {
    // 识别新发布的思绪（30秒内）
    const now = Date.now();
    
    // 对思绪进行分类排序：新发布的排在最前面，确保优先占位
    const sortedThoughts = [...thoughts].sort((a, b) => {
      const isANew = now - a.timestamp < 30000;
      const isBNew = now - b.timestamp < 30000;
      
      if (isANew && !isBNew) return -1;
      if (!isANew && isBNew) return 1;
      
      // 其次按面积排序，大词条优先占位
      const areaA = measureTextWidth(a.content, a.fontSize) * a.fontSize;
      const areaB = measureTextWidth(b.content, b.fontSize) * b.fontSize;
      return areaB - areaA;
    }).slice(0, maxItems);

    const placedItems: any[] = [];
    const { width: containerW, height: containerH } = containerSize;
    const newCachedPositions = new Map(cachedPositions);
    let hasNewPositions = false;

    const result = sortedThoughts.map((t) => {
      const isRecentlyPublished = now - t.timestamp < 30000;
      
      // 根据内容长度动态调整字号
      let currentFontSize = t.fontSize;
      if (t.content.length > 20) {
        currentFontSize = Math.max(12, t.fontSize * 0.7); // 长内容字号缩小
      } else if (t.content.length > 10) {
        currentFontSize = Math.max(14, t.fontSize * 0.85);
      }

      // 1. 如果已有缓存位置，且不是新发布的，优先使用
      if (newCachedPositions.has(t.id) && !isRecentlyPublished) {
        const pos = newCachedPositions.get(t.id)!;
        const widthPx = measureTextWidth(t.content, currentFontSize) * 1.8 + 120; 
        const heightPx = currentFontSize * 5.5; 
        const widthPct = (widthPx / containerW) * 100;
        const heightPct = (heightPx / containerH) * 100;
        placedItems.push({ x: pos.x, y: pos.y, width: widthPct, height: heightPct });
        return { ...t, x: pos.x, y: pos.y, displayFontSize: currentFontSize };
      }

      // 2. 计算新位置
      const widthPx = measureTextWidth(t.content, currentFontSize) * 1.8 + 120; 
      const heightPx = currentFontSize * 5.5; 
      const widthPct = (widthPx / containerW) * 100;
      const heightPct = (heightPx / containerH) * 100;

      const generatePosition = () => {
        if (isRecentlyPublished) {
          // 新发布的思绪强制在中心小范围内
          return {
            x: 50 + (Math.random() - 0.5) * 5 - (widthPct / 2),
            y: 45 + (Math.random() - 0.5) * 5 - (heightPct / 2)
          };
        }
        
        // 螺旋搜索：从中心向外扩散寻找第一个不碰撞的位置
        const maxRings = 100;
        const pointsPerRing = 16;
        const spiralStep = 5; // 步长

        for (let ring = 0; ring < maxRings; ring++) {
          const radius = ring * spiralStep;
          const startAngle = (ring * 0.5); // 增加旋转偏移，使分布更自然
          
          for (let p = 0; p < pointsPerRing; p++) {
            const angle = startAngle + (p / pointsPerRing) * Math.PI * 2;
            const xBase = 50 + Math.cos(angle) * radius;
            const yBase = 45 + Math.sin(angle) * radius;
            
            const x = xBase - (widthPct / 2);
            const y = yBase - (heightPct / 2);

            if (x < -25 || x > 125 || y < -25 || y > 125) continue;

            const currentRect = { x, y, width: widthPct, height: heightPct };
            // 增加碰撞检测间距 padding 到 12.0%
            const hasCollision = placedItems.some(item => checkCollision(currentRect, item, 12.0));

            if (!hasCollision) return { x, y };
          }
        }
        
        // 保底逻辑
        return {
          x: 50 + (Math.random() - 0.5) * 120 - (widthPct / 2),
          y: 45 + (Math.random() - 0.5) * 120 - (heightPct / 2)
        };
      };

      const { x, y } = generatePosition();
      placedItems.push({ x, y, width: widthPct, height: heightPct });
      
      if (!newCachedPositions.has(t.id) || isRecentlyPublished) {
        newCachedPositions.set(t.id, { x, y });
        hasNewPositions = true;
      }
      
      return { ...t, x, y, displayFontSize: currentFontSize };
    });

    if (hasNewPositions) {
      setTimeout(() => setCachedPositions(newCachedPositions), 0);
    }

    return result;
  }, [thoughts.map(t => t.id).join(','), maxItems, refreshKey, containerSize, cachedPositions]);

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

  useEffect(() => {
    setCachedPositions(new Map());
  }, [refreshKey]);

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
            isNew={Date.now() - thought.timestamp < 30000} // 30秒内发布的视为新发布
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
