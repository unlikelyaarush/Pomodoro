-- Assignment Time Predictor Database Schema
-- Run this SQL in your Supabase SQL Editor to create the assignments table

-- Note: This assumes Supabase Auth is enabled in your project
-- Make sure to enable Email authentication in Authentication > Providers

-- Drop existing table if it exists (this will delete all data)
-- Only do this if you're okay losing existing data
-- If you have important data, you'll need to migrate it first
DROP TABLE IF EXISTS assignments CASCADE;

CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  details TEXT NOT NULL,
  page_count INTEGER,
  due_date DATE NOT NULL,
  estimated_hours_min NUMERIC(5, 2) NOT NULL,
  estimated_hours_max NUMERIC(5, 2) NOT NULL,
  breakdown JSONB DEFAULT '[]'::jsonb,
  start_date DATE NOT NULL,
  reasoning TEXT,
  tips JSONB DEFAULT '[]'::jsonb,
  actual_hours NUMERIC(5, 2),
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_user_completed ON assignments(user_id, completed) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(user_id, assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_user_type_completed ON assignments(user_id, assignment_type, completed) WHERE completed = true AND actual_hours IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignments;

-- Note: The table has been dropped and recreated above
-- This ensures user_id is always UUID type from the start

-- Create policies for authenticated users
-- Users can only see their own assignments
CREATE POLICY "Users can view their own assignments" ON assignments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own assignments
CREATE POLICY "Users can insert their own assignments" ON assignments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assignments
CREATE POLICY "Users can update their own assignments" ON assignments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own assignments
CREATE POLICY "Users can delete their own assignments" ON assignments
  FOR DELETE
  USING (auth.uid() = user_id);
