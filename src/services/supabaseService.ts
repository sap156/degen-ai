
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Supabase client setup
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User types
export interface UserProfile {
  id: string;
  email: string;
  openai_api_key?: string;
  preferred_model?: string;
  created_at?: string;
}

// Auth functions
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    toast.error(error.message || 'Failed to sign up');
    return { success: false, error };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    toast.error(error.message || 'Failed to sign in');
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    toast.error(error.message || 'Failed to sign out');
    return { success: false, error };
  }
};

// Profile functions
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    return data as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No user logged in');
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    toast.success('Profile updated successfully');
    return { success: true };
  } catch (error: any) {
    toast.error(error.message || 'Failed to update profile');
    return { success: false, error };
  }
};

// OpenAI API key management
export const saveApiKey = async (apiKey: string) => {
  return updateUserProfile({ openai_api_key: apiKey });
};

export const savePreferredModel = async (model: string) => {
  return updateUserProfile({ preferred_model: model });
};

export const getOpenAISettings = async () => {
  const profile = await getUserProfile();
  return {
    apiKey: profile?.openai_api_key || null,
    preferredModel: profile?.preferred_model || 'gpt-4o',
  };
};

// Session management
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Auth state listener helper
export const setupAuthStateListener = (callback: (session: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session);
  });
};
