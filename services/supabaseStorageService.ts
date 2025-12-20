import { Thought, User, Comment } from '../types';
import { supabase } from './supabaseService';

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
    
    return data || [];
  },

  async saveThought(thought: Omit<Thought, 'id'>): Promise<Thought | null> {
    const { data, error } = await supabase
      .from('thoughts')
      .insert([thought])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving thought:', error);
      return null;
    }
    
    return data;
  },

  async updateThought(id: string, updates: Partial<Thought>): Promise<Thought | null> {
    const { data, error } = await supabase
      .from('thoughts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating thought:', error);
      return null;
    }
    
    return data;
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

  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data || [];
  },

  async saveUser(user: Omit<User, 'id'>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving user:', error);
      return null;
    }
    
    return data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    
    return data;
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
    
    return data || [];
  },

  async addComment(comment: Omit<Comment, 'id'>): Promise<Comment | null> {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding comment:', error);
      return null;
    }
    
    return data;
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
