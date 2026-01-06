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
  async getThoughts(filters?: { keyword?: string; type?: string; authorId?: string; tag?: string }): Promise<Thought[]> {
    let query = supabase
      .from('thoughts')
      .select('*');
    
    if (filters?.keyword) {
      query = query.ilike('content', `%${filters.keyword}%`);
    }
    
    if (filters?.type && filters.type !== 'ALL') {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.authorId) {
      query = query.eq('author_id', filters.authorId);
    }

    if (filters?.tag) {
      query = query.contains('tags', [filters.tag]);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching thoughts:', error);
      throw error;
    }
    
    return toCamelCase(data) || [];
  },

  async saveThought(thought: Omit<Thought, 'id'>): Promise<Thought> {
    const { data, error } = await supabase
      .from('thoughts')
      .insert([toSnakeCase(thought)])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving thought:', error);
      throw error;
    }
    
    return toCamelCase(data);
  },

  async updateThought(id: string, updates: Partial<Thought>): Promise<Thought> {
    const { data, error } = await supabase
      .from('thoughts')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating thought:', error);
      throw error;
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
      throw error;
    }
    
    return true;
  },

  async toggleThoughtLike(id: string): Promise<{ isLiked: boolean; totalLikes: number }> {
    const { data, error } = await supabase
      .rpc('toggle_thought_like', { p_thought_id: id });

    if (error) {
      console.error('Error toggling thought like:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from toggle_thought_like');
    }

    const result = data[0];
    return {
      isLiked: result.is_liked,
      totalLikes: result.total_likes
    };
  },

  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return toCamelCase(data) || [];
  },

  async saveUser(user: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([toSnakeCase(user)])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving user:', error);
      throw error;
    }
    
    return toCamelCase(data);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    
    return toCamelCase(data);
  },

  async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user by id:', error);
      throw error;
    }
    
    return toCamelCase(data);
  },

  async getLikedThoughtIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('likes')
      .select('thought_id')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching liked thought ids:', error);
      throw error;
    }
    
    return data.map((item: any) => item.thought_id);
  },

  // Comments
  async getComments(thoughtId: string, page: number = 0, pageSize: number = 10): Promise<{ data: Comment[], hasMore: boolean, totalCount: number }> {
    const from = page * pageSize;
    const to = from + pageSize;

    const { data, error, count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('thought_id', thoughtId)
      .order('timestamp', { ascending: false })
      .range(from, to - 1);
    
    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
    
    const comments = toCamelCase(data) || [];
    const totalCount = count || 0;
    const hasMore = from + comments.length < totalCount;

    return { data: comments, hasMore, totalCount };
  },

  async addComment(comment: Omit<Comment, 'id'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        thought_id: comment.thoughtId,
        author: comment.author,
        author_id: comment.authorId,
        content: comment.content,
        timestamp: comment.timestamp
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    return {
      id: data.id,
      thoughtId: data.thought_id,
      authorId: data.author_id,
      author: data.author,
      content: data.content,
      timestamp: data.timestamp
    };
  },

  async deleteComment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }

    return true;
  }
};
