-- 测试用户资料自动落库功能
-- 1. 首先运行 supabase-trigger.sql 创建触发器
-- 2. 然后运行以下测试

-- 查看当前 auth.users 和 public.users 的记录数
SELECT 'auth.users count: ' || COUNT(*) FROM auth.users;
SELECT 'public.users count: ' || COUNT(*) FROM public.users;

-- 测试触发器：手动插入一个测试用户到 auth.users（需要服务端权限）
-- 注意：这个操作需要在 Supabase Dashboard 的 SQL Editor 中以服务端角色执行

-- 检查触发器是否存在
SELECT 
    schemaname,
    tablename,
    triggername,
    triggerdef
FROM pg_trigger 
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE triggername = 'on_auth_user_created';

-- 检查函数是否存在
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 测试步骤：
-- 1. 在前端注册一个新用户（使用新邮箱）
-- 2. 注册成功后，运行以下查询验证数据：
-- SELECT * FROM public.users WHERE username LIKE 'test%@%' ORDER BY created_at DESC LIMIT 5;

-- 预期结果：
-- - 新用户注册后，public.users 表应该自动创建对应记录
-- - id 应该与 auth.users 的 uid 一致
-- - username 应该是 email 的 @ 前部分，如果冲突则添加后缀
