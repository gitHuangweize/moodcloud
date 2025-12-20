
import { Thought, User, Comment } from '../types';

const KEYS = {
  THOUGHTS: 'moodcloud_thoughts',
  USERS: 'moodcloud_users',
  COMMENTS: 'moodcloud_comments',
  CURRENT_USER: 'moodcloud_current_user'
};

export const storageService = {
  // Thoughts
  getThoughts: (): Thought[] => {
    const data = localStorage.getItem(KEYS.THOUGHTS);
    return data ? JSON.parse(data) : [];
  },
  saveThoughts: (thoughts: Thought[]) => {
    localStorage.setItem(KEYS.THOUGHTS, JSON.stringify(thoughts));
  },

  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  saveUser: (user: User) => {
    const users = storageService.getUsers();
    localStorage.setItem(KEYS.USERS, JSON.stringify([...users, user]));
  },

  // Auth session
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.CURRENT_USER);
  },

  // Comments
  getComments: (thoughtId: string): Comment[] => {
    const data = localStorage.getItem(KEYS.COMMENTS);
    const allComments: Comment[] = data ? JSON.parse(data) : [];
    return allComments.filter(c => c.thoughtId === thoughtId);
  },
  addComment: (comment: Comment) => {
    const data = localStorage.getItem(KEYS.COMMENTS);
    const allComments: Comment[] = data ? JSON.parse(data) : [];
    localStorage.setItem(KEYS.COMMENTS, JSON.stringify([...allComments, comment]));
  }
};
