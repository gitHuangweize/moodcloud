-- 统计相关的表定义
-- 用于记录每日统计数据
CREATE TABLE IF NOT EXISTS daily_stats (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    dau INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    ai_calls_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用于追踪用户每日活跃情况 (DAU 统计基础)
CREATE TABLE IF NOT EXISTS user_activity (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (user_id, activity_date)
);

-- 启用 RLS
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- 策略：仅管理员可读，或者在此项目中暂定所有认证用户可读统计（取决于需求，通常管理员可见）
CREATE POLICY "Anyone can view daily_stats" ON daily_stats FOR SELECT USING (true);
CREATE POLICY "System can insert/update daily_stats" ON daily_stats FOR ALL USING (true);

-- user_activity RLS 策略修复
-- 允许认证用户插入自己的活跃记录
CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 允许认证用户查看自己的活跃记录
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
-- 允许触发器/系统更新统计（在 Supabase 中，触发器通常以 superuser 权限运行，但如果是在普通策略下，可能需要更宽松的策略）
-- 这里为了解决发布失败，先给 user_activity 增加基础策略

-- 函数：更新每日发帖数
CREATE OR REPLACE FUNCTION increment_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_stats (date, posts_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date)
    DO UPDATE SET posts_count = daily_stats.posts_count + 1, updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器：发帖时增加计数
DROP TRIGGER IF EXISTS tr_increment_posts_count ON thoughts;
CREATE TRIGGER tr_increment_posts_count
AFTER INSERT ON thoughts
FOR EACH ROW
EXECUTE FUNCTION increment_posts_count();

-- 函数：更新每日评论数
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_stats (date, comments_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date)
    DO UPDATE SET comments_count = daily_stats.comments_count + 1, updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器：评论时增加计数
DROP TRIGGER IF EXISTS tr_increment_comments_count ON comments;
CREATE TRIGGER tr_increment_comments_count
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION increment_comments_count();

-- 函数：记录用户活跃并更新 DAU
CREATE OR REPLACE FUNCTION track_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- 尝试插入用户今日活跃记录
    INSERT INTO user_activity (user_id, activity_date)
    VALUES (NEW.author_id, CURRENT_DATE)
    ON CONFLICT (user_id, activity_date) DO NOTHING;
    
    -- 如果插入成功（即该用户今日首次活跃），更新 daily_stats 中的 dau
    IF FOUND THEN
        INSERT INTO daily_stats (date, dau)
        VALUES (CURRENT_DATE, 1)
        ON CONFLICT (date)
        DO UPDATE SET dau = daily_stats.dau + 1, updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器：发帖时记录活跃
DROP TRIGGER IF EXISTS tr_track_activity_on_thought ON thoughts;
CREATE TRIGGER tr_track_activity_on_thought
AFTER INSERT ON thoughts
FOR EACH ROW
EXECUTE FUNCTION track_user_activity();

-- 触发器：评论时记录活跃
DROP TRIGGER IF EXISTS tr_track_activity_on_comment ON comments;
CREATE TRIGGER tr_track_activity_on_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION track_user_activity();

-- 函数：手动增加 AI 调用次数 (由后端/前端调用 RPC)
CREATE OR REPLACE FUNCTION increment_ai_calls_count()
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_stats (date, ai_calls_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date)
    DO UPDATE SET ai_calls_count = daily_stats.ai_calls_count + 1, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
