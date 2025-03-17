
import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabaseService from '@/services/supabaseService';
import { useApiKey } from '@/contexts/ApiKeyContext';

export function useSupabase() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiKey } = useApiKey();

  useEffect(() => {
    // Get the initial session
    const getInitialSession = async () => {
      try {
        const supabase = supabaseService.getClient();
        
        // Check for an existing session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, updatedSession) => {
            setSession(updatedSession);
            setUser(updatedSession?.user || null);
          }
        );
        
        setLoading(false);
        
        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up Supabase auth:', error);
        setLoading(false);
      }
    };
    
    getInitialSession();
  }, []);

  // Use our OpenAI API key through Supabase Edge Function
  const processWithOpenAI = async (
    endpoint: string, 
    payload: any
  ): Promise<any> => {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    try {
      return await supabaseService.callOpenAI(endpoint, payload, apiKey);
    } catch (error) {
      console.error('Error processing with OpenAI:', error);
      throw error;
    }
  };

  return {
    session,
    user,
    loading,
    processWithOpenAI,
    supabase: supabaseService.getClient()
  };
}
