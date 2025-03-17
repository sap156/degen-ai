
-- Create tables for our application
-- Note: This migration can be applied manually in the Supabase SQL editor

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create datasets table for storing dataset information
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create query_history table for storing user query history
CREATE TABLE IF NOT EXISTS public.query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  sql TEXT NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS datasets_user_id_idx ON public.datasets(user_id);
CREATE INDEX IF NOT EXISTS query_history_user_id_idx ON public.query_history(user_id);

-- Set up Row Level Security (RLS) policies
-- Enable RLS on the tables
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;

-- Create policies that allow users to only see their own data
CREATE POLICY "Users can view their own datasets"
  ON public.datasets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets"
  ON public.datasets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own query history"
  ON public.query_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own query history"
  ON public.query_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
