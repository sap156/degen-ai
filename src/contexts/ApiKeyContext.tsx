
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type OpenAIModel = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';

interface ApiKeyContextType {
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  selectedModel: OpenAIModel;
  setSelectedModel: (model: OpenAIModel) => Promise<void>;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [selectedModel, setSelectedModelState] = useState<OpenAIModel>('gpt-4o');
  const { user } = useAuth();

  // Load API key and model preference from Supabase when user changes
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) {
        // Clear state if no user is logged in
        setApiKeyState(null);
        setSelectedModelState('gpt-4o');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('api_key, model_preference')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Error fetching user settings:', error);
          return;
        }
        
        if (data) {
          setApiKeyState(data.api_key);
          if (data.model_preference) {
            setSelectedModelState(data.model_preference as OpenAIModel);
          }
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      }
    };
    
    fetchUserSettings();
  }, [user]);

  const setApiKey = async (key: string) => {
    if (!user) {
      toast.error('You must be logged in to save API keys');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { 
            user_id: user.id, 
            api_key: key,
          },
          { onConflict: 'user_id' }
        );
      
      if (error) {
        console.error('Error saving API key:', error);
        toast.error('Failed to save API key');
        return;
      }
      
      setApiKeyState(key);
      toast.success('API key saved successfully');
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    }
  };

  const clearApiKey = async () => {
    if (!user) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ api_key: null })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error removing API key:', error);
        toast.error('Failed to remove API key');
        return;
      }
      
      setApiKeyState(null);
      toast.success('API key removed');
    } catch (error) {
      console.error('Error removing API key:', error);
      toast.error('Failed to remove API key');
    }
  };

  const handleSetSelectedModel = async (model: OpenAIModel) => {
    if (!user) {
      setSelectedModelState(model);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          { 
            user_id: user.id, 
            model_preference: model,
          },
          { onConflict: 'user_id' }
        );
      
      if (error) {
        console.error('Error saving model preference:', error);
        return;
      }
      
      setSelectedModelState(model);
    } catch (error) {
      console.error('Error saving model preference:', error);
    }
  };

  return (
    <ApiKeyContext.Provider 
      value={{ 
        apiKey, 
        isKeySet: !!apiKey, 
        setApiKey, 
        clearApiKey,
        selectedModel,
        setSelectedModel: handleSetSelectedModel
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
