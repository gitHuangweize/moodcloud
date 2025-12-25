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
