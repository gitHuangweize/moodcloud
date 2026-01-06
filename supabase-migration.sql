-- Migration SQL (scenario B: tables already exist)
-- Goal: align schema & RLS to Plan A (public.users.id = auth.uid()) and anonymous read-only.

-- 1) Schema adjustments

-- Ensure users.id can be set to auth.uid() (do not auto-generate)
ALTER TABLE public.users
  ALTER COLUMN id DROP DEFAULT;

-- Add comments.author_id if missing
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS author_id uuid;

-- Add FK to users (safe even if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comments_author_id_fkey'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- If you want strict NOT NULL, this will only succeed after you backfill author_id for existing rows.
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.comments ALTER COLUMN author_id SET NOT NULL;
  EXCEPTION
    WHEN others THEN
      -- Keep nullable for now (existing rows may not have author_id).
      NULL;
  END;
END $$;

-- 2) Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3) Drop old policies (idempotent)
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can create own profile" ON public.users;

DROP POLICY IF EXISTS "Anyone can view thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Authenticated users can create thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Users can update own thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Users can delete own thoughts" ON public.thoughts;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- 4) Re-create policies

-- users
CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- thoughts (anonymous read; authenticated write; owner update/delete)
CREATE POLICY "Anyone can view thoughts"
  ON public.thoughts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create thoughts"
  ON public.thoughts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

CREATE POLICY "Users can update own thoughts"
  ON public.thoughts
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own thoughts"
  ON public.thoughts
  FOR DELETE
  USING (auth.uid() = author_id);

-- comments (anonymous read; authenticated write; owner update/delete)
CREATE POLICY "Anyone can view comments"
  ON public.comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid() = author_id);

-- 5) RPC: allow anyone to increment likes without opening UPDATE on thoughts
CREATE OR REPLACE FUNCTION public.increment_thought_likes(p_thought_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.thoughts
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = p_thought_id
  RETURNING likes;
$$;

GRANT EXECUTE ON FUNCTION public.increment_thought_likes(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_thought_likes(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thought_id uuid NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'likes_thought_id_user_id_key'
  ) THEN
    ALTER TABLE public.likes
      ADD CONSTRAINT likes_thought_id_user_id_key UNIQUE (thought_id, user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_likes_thought_id ON public.likes(thought_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can create own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

CREATE POLICY "Users can view own likes"
  ON public.likes
  FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can create own likes"
  ON public.likes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes
  FOR DELETE
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.toggle_thought_like(uuid);

CREATE OR REPLACE FUNCTION public.toggle_thought_like(p_thought_id uuid)
RETURNS TABLE(is_liked boolean, total_likes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_liked boolean;
  v_count integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.likes WHERE thought_id = p_thought_id AND user_id = v_user_id
  ) THEN
    DELETE FROM public.likes WHERE thought_id = p_thought_id AND user_id = v_user_id;
    UPDATE public.thoughts
      SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
      WHERE id = p_thought_id
      RETURNING likes INTO v_count;
    v_liked := false;
    RETURN QUERY SELECT v_liked, v_count;
    RETURN;
  ELSE
    INSERT INTO public.likes (thought_id, user_id)
      VALUES (p_thought_id, v_user_id)
      ON CONFLICT (thought_id, user_id) DO NOTHING;
    UPDATE public.thoughts
      SET likes = COALESCE(likes, 0) + 1
      WHERE id = p_thought_id
      RETURNING likes INTO v_count;
    v_liked := true;
    RETURN QUERY SELECT v_liked, v_count;
    RETURN;
  END IF;
END;
$$;


-- 6) Automatically sync echoes (comment count) using triggers
CREATE OR REPLACE FUNCTION public.sync_thought_echoes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.thoughts
        SET echoes = (SELECT count(*) FROM public.comments WHERE thought_id = NEW.thought_id)
        WHERE id = NEW.thought_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.thoughts
        SET echoes = (SELECT count(*) FROM public.comments WHERE thought_id = OLD.thought_id)
        WHERE id = OLD.thought_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_thought_echoes ON public.comments;
CREATE TRIGGER trigger_sync_thought_echoes
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.sync_thought_echoes();

-- Initial sync for existing data
UPDATE public.thoughts t
SET echoes = (SELECT count(*) FROM public.comments c WHERE c.thought_id = t.id);

-- Add tags column to thoughts table
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create an index for tags column to improve performance
CREATE INDEX IF NOT EXISTS idx_thoughts_tags ON thoughts USING GIN (tags);
