
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentSession, getUserProfile, saveApiKey, savePreferredModel, setupAuthStateListener } from '@/services/supabaseService';

type OpenAIModel = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';

interface ApiKeyContextType {
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  selectedModel: OpenAIModel;
  setSelectedModel: (model: OpenAIModel) => void;
  isAuthenticated: boolean;
  userEmail: string | null;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>('gpt-4o');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize - check if user is logged in and get their settings
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await getCurrentSession();
        
        if (session) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email);
          
          // Get user's saved API key and preferred model from their profile
          const profile = await getUserProfile();
          if (profile) {
            if (profile.openai_api_key) {
              setApiKeyState(profile.openai_api_key);
            }
            
            if (profile.preferred_model as OpenAIModel) {
              setSelectedModel(profile.preferred_model as OpenAIModel);
            }
          }
        } else {
          // Fallback to localStorage for non-authenticated users
          const storedKey = localStorage.getItem('openai-api-key');
          if (storedKey) {
            setApiKeyState(storedKey);
          }
          
          const storedModel = localStorage.getItem('openai-model') as OpenAIModel | null;
          if (storedModel) {
            setSelectedModel(storedModel);
          }
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const { data: authListener } = setupAuthStateListener(async (session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        
        // Get user profile data when auth state changes
        const profile = await getUserProfile();
        if (profile) {
          if (profile.openai_api_key) {
            setApiKeyState(profile.openai_api_key);
          }
          
          if (profile.preferred_model as OpenAIModel) {
            setSelectedModel(profile.preferred_model as OpenAIModel);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const setApiKey = async (key: string) => {
    if (isAuthenticated) {
      // Save to Supabase profile
      const result = await saveApiKey(key);
      if (result.success) {
        setApiKeyState(key);
        toast.success('API key saved securely to your profile');
      }
    } else {
      // Fallback to localStorage
      localStorage.setItem('openai-api-key', key);
      setApiKeyState(key);
      toast.success('API key saved to browser local storage');
      toast.info('For more security, sign in to save your API key to your account', {
        duration: 5000,
      });
    }
  };

  const clearApiKey = async () => {
    if (isAuthenticated) {
      // Clear from Supabase profile
      const result = await saveApiKey('');
      if (result.success) {
        setApiKeyState(null);
        toast.success('API key removed from your profile');
      }
    } else {
      // Clear from localStorage
      localStorage.removeItem('openai-api-key');
      setApiKeyState(null);
      toast.success('API key removed');
    }
  };

  const handleSetSelectedModel = async (model: OpenAIModel) => {
    if (isAuthenticated) {
      // Save to Supabase profile
      const result = await savePreferredModel(model);
      if (result.success) {
        setSelectedModel(model);
      }
    } else {
      // Fallback to localStorage
      localStorage.setItem('openai-model', model);
      setSelectedModel(model);
    }
  };

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <ApiKeyContext.Provider 
      value={{ 
        apiKey, 
        isKeySet: !!apiKey, 
        setApiKey, 
        clearApiKey,
        selectedModel,
        setSelectedModel: handleSetSelectedModel,
        isAuthenticated,
        userEmail
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
