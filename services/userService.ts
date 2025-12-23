import { supabase } from './supabaseService';
import { User } from '../types';

// 确保用户在 public.users 表中有记录
export const ensureUserProfile = async (user: any): Promise<User | null> => {
  try {
    // 先尝试获取现有记录
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('获取用户资料失败:', fetchError);
      return null;
    }

    // 如果记录已存在，直接返回
    if (existingUser) {
      return {
        id: existingUser.id,
        username: existingUser.username,
        avatar: existingUser.avatar,
      };
    }

    // 如果不存在，创建新记录
    // 处理 username 唯一性冲突
    let baseUsername = user.user_metadata?.username || 
                      user.email?.split('@')[0] || 
                      `user_${user.id.substring(0, 8)}`;
    
    let username = baseUsername;
    let suffix = 0;
    let maxAttempts = 10;
    let success = false;
    let userData = null;

    while (!success && suffix <= maxAttempts) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            username: username,
            avatar: user.user_metadata?.avatar || null,
          })
          .select()
          .single();

        if (error) {
          // 如果是 username 冲突，尝试新的 username
          if (error.code === '23505' && error.message.includes('username')) {
            suffix++;
            username = `${baseUsername}_${suffix}`;
            continue;
          }
          throw error;
        }
        
        userData = data;
        success = true;
      } catch (error: any) {
        // 如果尝试次数过多，使用 uid 作为 username
        if (suffix > maxAttempts) {
          username = `user_${user.id}`;
          const { data, error } = await supabase
            .from('users')
            .insert({
              id: user.id,
              username: username,
              avatar: user.user_metadata?.avatar || null,
            })
            .select()
            .single();
          
          if (error) {
            console.error('创建用户资料失败:', error);
            return null;
          }
          userData = data;
          success = true;
        } else {
          throw error;
        }
      }
    }

    return {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
    };
  } catch (error) {
    console.error('确保用户资料时出错:', error);
    return null;
  }
};

// 更新用户资料
export const updateUserProfile = async (userId: string, updates: {
  username?: string;
  avatar?: string;
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('更新用户资料失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('更新用户资料时出错:', error);
    return false;
  }
};

// 获取用户资料
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('获取用户资料失败:', error);
      return null;
    }

    return {
      id: data.id,
      username: data.username,
      avatar: data.avatar,
    };
  } catch (error) {
    console.error('获取用户资料时出错:', error);
    return null;
  }
};
