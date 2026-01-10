
import { Thought, ThoughtType } from './types';

export const TYPE_COLORS: Record<ThoughtType, string[]> = {
  [ThoughtType.GRUMBLE]: ['text-slate-500', 'text-blue-500', 'text-cyan-600'],
  [ThoughtType.INSIGHT]: ['text-amber-500', 'text-orange-500', 'text-yellow-600'],
  [ThoughtType.WHISPER]: ['text-indigo-400', 'text-purple-400', 'text-rose-400', 'text-pink-400']
};

export const COLORS = [
  ...TYPE_COLORS[ThoughtType.GRUMBLE],
  ...TYPE_COLORS[ThoughtType.INSIGHT],
  ...TYPE_COLORS[ThoughtType.WHISPER]
];


export const INITIAL_THOUGHTS: Thought[] = [
  {
    id: '1',
    content: '进步最快的方法是重构。',
    type: ThoughtType.INSIGHT,
    author: 'Anonymous',
    timestamp: Date.now(),
    likes: 12,
    echoes: 3,
    x: 10,
    y: 15,
    fontSize: 20,
    color: 'text-purple-400'
  },
  {
    id: '2',
    content: '今天的咖啡太苦了，像我的心情。',
    type: ThoughtType.GRUMBLE,
    author: 'MoodBot',
    timestamp: Date.now(),
    likes: 5,
    echoes: 1,
    x: 70,
    y: 10,
    fontSize: 16,
    color: 'text-slate-500'
  },
  {
    id: '3',
    content: '大道理都懂，可还是想赖床。',
    type: ThoughtType.WHISPER,
    author: 'Dreamer',
    timestamp: Date.now(),
    likes: 45,
    echoes: 8,
    x: 40,
    y: 25,
    fontSize: 24,
    color: 'text-indigo-400'
  },
  {
    id: '4',
    content: '重构不仅是代码，还有生活。',
    type: ThoughtType.INSIGHT,
    author: 'DevLife',
    timestamp: Date.now(),
    likes: 22,
    echoes: 5,
    x: 80,
    y: 40,
    fontSize: 18,
    color: 'text-violet-500'
  },
  {
    id: '5',
    content: '代码没写完，可是夕阳好美。',
    type: ThoughtType.WHISPER,
    author: 'Coder',
    timestamp: Date.now(),
    likes: 88,
    echoes: 12,
    x: 15,
    y: 60,
    fontSize: 22,
    color: 'text-rose-400'
  },
  {
    id: '6',
    content: '为什么周一总是来得这么快？',
    type: ThoughtType.GRUMBLE,
    author: 'Worker',
    timestamp: Date.now(),
    likes: 150,
    echoes: 30,
    x: 60,
    y: 70,
    fontSize: 14,
    color: 'text-blue-400'
  }
];
