-- 验证触发器和函数是否正确创建

-- 1. 检查触发器是否存在
SELECT 
    n.nspname AS schema_name,
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- 2. 检查函数是否存在
SELECT 
    proname AS function_name,
    prosrc AS source_code
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. 查看当前用户数量
SELECT 'auth.users count: ' || COUNT(*) FROM auth.users;
SELECT 'public.users count: ' || COUNT(*) FROM public.users;

-- 4. 查看最近的用户记录（如果有）
SELECT 
    id,
    username,
    avatar,
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
