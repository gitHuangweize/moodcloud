-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thoughts table
CREATE TABLE thoughts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('GRUMBLE', 'INSIGHT', 'WHISPER')),
  author TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp BIGINT NOT NULL,
  likes INTEGER DEFAULT 0,
  echoes INTEGER DEFAULT 0,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  font_size INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thought_id UUID REFERENCES thoughts(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_thoughts_timestamp ON thoughts(timestamp DESC);
CREATE INDEX idx_thoughts_author_id ON thoughts(author_id);
CREATE INDEX idx_comments_thought_id ON comments(thought_id);
CREATE INDEX idx_comments_timestamp ON comments(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all users but can only update their own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Anyone can read thoughts, only authenticated users can insert
CREATE POLICY "Anyone can view thoughts" ON thoughts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create thoughts" ON thoughts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own thoughts" ON thoughts FOR UPDATE USING (auth.uid() = author_id);

-- Anyone can read comments, only authenticated users can insert
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = id);
