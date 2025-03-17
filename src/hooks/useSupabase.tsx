
import { useEffect, useState, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabaseService from '@/services/supabaseService';
import { useApiKey } from '@/contexts/ApiKeyContext';

// Create a context for Supabase
type SupabaseContextType = ReturnType<typeof useSupabaseValue>;

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Hook to use inside the provider
function useSupabaseValue() {
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

// Provider component
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabaseValue();
  
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Hook to use the context
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

// Export a wrapper that doesn't require the provider for simpler cases
export function useSupabaseClient() {
  return supabaseService.getClient();
}
