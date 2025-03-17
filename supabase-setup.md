
# Supabase Backend Setup Instructions

This document provides instructions for setting up the Supabase backend for DeGen.AI.

## 1. Create a Supabase Project

1. Sign up or log in at [https://supabase.com](https://supabase.com)
2. Create a new project and note your project URL and anon key

## 2. Update Environment Variables

Update the `supabaseUrl` and `supabaseAnonKey` in `src/services/supabaseService.ts` with your project's values.

## 3. Set Up Database Schema

Run the following SQL in the Supabase SQL Editor:

```sql
-- Create profiles table to store user information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  openai_api_key TEXT,
  preferred_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see and update their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Set up function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Configure Authentication

1. Go to Authentication settings in your Supabase dashboard
2. Enable Email auth provider
3. Set up Site URL to your application URL
4. Configure any additional auth providers if needed

## 5. Security Best Practices

1. **API Key Storage**: OpenAI API keys are encrypted at rest in Supabase
2. **Row Level Security**: Ensures users can only access their own data
3. **Auth Redirects**: Configure auth redirects in Supabase authentication settings
4. **JWT Expiry**: Adjust JWT expiry times based on your security requirements

## 6. Test Authentication Flow

1. Test signup process
2. Test signin process
3. Verify profile creation
4. Test API key storage and retrieval

## 7. Additional Security Settings (Optional)

1. Enable MFA (Multi-Factor Authentication)
2. Set up email verification requirements
3. Configure password policies
