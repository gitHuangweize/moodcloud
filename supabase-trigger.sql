-- 创建函数：当 auth.users 有新用户时，自动在 public.users 创建对应记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, username, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'avatar'
  );
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
