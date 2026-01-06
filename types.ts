
export enum ThoughtType {
  GRUMBLE = 'GRUMBLE',
  INSIGHT = 'INSIGHT',
  WHISPER = 'WHISPER'
}

export interface Comment {
  id: string;
  thoughtId: string;
  authorId: string;
  author: string;
  content: string;
  timestamp: number;
}

export interface Thought {
  id: string;
  content: string;
  type: ThoughtType;
  author: string;
  authorId?: string;
  timestamp: number;
  likes: number;
  echoes: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  tags?: string[];
}

export interface User {
  id: string;
  username: string;
  password?: string; // Only for local storage simulation
  avatar?: string;
  createdAt?: string;
}

export type NotificationType = 'LIKE' | 'COMMENT';

export interface AppNotification {
  id: string;
  receiverId: string;
  senderId: string;
  senderName?: string;
  type: NotificationType;
  thoughtId: string;
  content?: string;
  isRead: boolean;
  createdAt: string;
}
