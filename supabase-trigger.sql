-- 创建函数：当 auth.users 有新用户时，自动在 public.users 创建对应记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- 生成基础 username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    -- 提取 email 的 @ 前部分
    CASE 
      WHEN NEW.email IS NOT NULL AND POSITION('@' IN NEW.email) > 0 
      THEN SUBSTRING(NEW.email FROM 1 FOR POSITION('@' IN NEW.email) - 1)
      ELSE NULL
    END,
    'user_' || SUBSTRING(NEW.id::text FROM 1 FOR 8)
  );
  
  -- 尝试插入，如果 username 冲突则添加数字后缀
  final_username := base_username;
  LOOP
    BEGIN
      INSERT INTO public.users (id, username, avatar)
      VALUES (
        NEW.id,
        final_username,
        NEW.raw_user_meta_data->>'avatar'
      );
      EXIT; -- 成功插入，退出循环
    EXCEPTION 
      WHEN unique_violation THEN
        suffix := suffix + 1;
        IF suffix > max_attempts THEN
          -- 如果尝试次数过多，使用 uid 作为 username
          final_username := 'user_' || NEW.id::text;
          INSERT INTO public.users (id, username, avatar)
          VALUES (
            NEW.id,
            final_username,
            NEW.raw_user_meta_data->>'avatar'
          );
          EXIT;
        END IF;
        final_username := base_username || '_' || suffix;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 创建触发器：auth.users INSERT 后执行
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 为现有用户手动创建记录（如果你已有注册用户）
-- 运行前请替换 'your-auth-uid' 为实际的用户 ID
-- INSERT INTO public.users (id, username) 
-- VALUES ('your-auth-uid', '用户名');

-- 给予必要权限
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;
