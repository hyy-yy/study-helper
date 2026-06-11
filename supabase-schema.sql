-- 期末复习助手数据库表结构
-- 请在 Supabase SQL Editor 中执行此脚本

-- 创建提纲表
CREATE TABLE IF NOT EXISTS outlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  course TEXT DEFAULT '未分类',
  content JSONB NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建题库表
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  source TEXT DEFAULT 'user_uploaded',
  questions JSONB NOT NULL,
  chapters TEXT[] DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  outline_id UUID REFERENCES outlines(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建分享表
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target_id UUID NOT NULL,
  expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建错题表
CREATE TABLE IF NOT EXISTS wrong_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  quiz_id TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  explanation TEXT,
  chapter TEXT,
  wrong_count INTEGER DEFAULT 1,
  last_wrong_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS idx_outlines_user_id ON outlines(user_id);
CREATE INDEX IF NOT EXISTS idx_outlines_created_at ON outlines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user_id ON wrong_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_target_id ON shares(target_id);

-- 启用 Row Level Security (RLS)
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_answers ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许公开访问，后续可改为用户级别）
CREATE POLICY "Allow public access to outlines" ON outlines FOR ALL USING (true);
CREATE POLICY "Allow public access to quizzes" ON quizzes FOR ALL USING (true);
CREATE POLICY "Allow public access to shares" ON shares FOR ALL USING (true);
CREATE POLICY "Allow public access to wrong_answers" ON wrong_answers FOR ALL USING (true);
