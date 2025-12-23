-- ⚠️ 警告：此脚本将删除所有用户数据，请谨慎使用！
-- 建议在测试环境使用，生产环境请备份后再执行！

-- 删除 comments 表中的所有数据（因为依赖 users）
TRUNCATE TABLE comments CASCADE;

-- 删除 thoughts 表中的所有数据（因为依赖 users）
TRUNCATE TABLE thoughts CASCADE;

-- 删除 public.users 表中的所有数据
TRUNCATE TABLE users CASCADE;

-- 删除 auth.users 表中的所有数据
-- 注意：这需要服务端权限，请在 Supabase Dashboard 的 SQL Editor 中执行
DELETE FROM auth.users;

-- 验证删除结果
SELECT 'public.users count: ' || COUNT(*) FROM public.users;
SELECT 'auth.users count: ' || COUNT(*) FROM auth.users;

-- 重置序列（如果有自增ID的话）
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
