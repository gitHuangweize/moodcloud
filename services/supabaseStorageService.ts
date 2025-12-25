import { Thought, User, Comment } from '../types';
import { supabase } from './supabaseService';

// Helper to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return result;
};

// Helper to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
};

export const supabaseStorageService = {
  // Thoughts
  async getThoughts(): Promise<Thought[]> {
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching thoughts:', error);
      return [];
    }
    
    return toCamelCase(data) || [];
  },

  async saveThought(thought: Omit<Thought, 'id'>): Promise<Thought | null> {
    const { data, error } = await supabase
      .from('thoughts')
      .insert([toSnakeCase(thought)])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving thought:', error);
      return null;
    }
    
    return toCamelCase(data);
  },

  async updateThought(id: string, updates: Partial<Thought>): Promise<Thought | null> {
    const { data, error } = await supabase
      .from('thoughts')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating thought:', error);
      return null;
    }
    
    return toCamelCase(data);
  },

  async deleteThought(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting thought:', error);
      return false;
    }
    
    return true;
  },

  async incrementThoughtLikes(id: string): Promise<number | null> {
    const { data, error } = await supabase
      .rpc('increment_thought_likes', { p_thought_id: id });

    if (error) {
      console.error('Error incrementing thought likes:', error);
      return null;
    }

    return typeof data === 'number' ? data : null;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return toCamelCase(data) || [];
  },

  async saveUser(user: Omit<User, 'id'>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([toSnakeCase(user)])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving user:', error);
      return null;
    }
    
    return toCamelCase(data);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    
    return toCamelCase(data);
  },

  // Comments
  async getComments(thoughtId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('thought_id', thoughtId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
    
    return toCamelCase(data) || [];
  },

  async addComment(comment: Omit<Comment, 'id'>): Promise<Comment | null> {
    const { data, error } = await supabase
      .from('comments')
      .insert([toSnakeCase(comment)])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }
    
    return toCamelCase(data);
  },

  async deleteComment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
    
    return true;
  }
};
