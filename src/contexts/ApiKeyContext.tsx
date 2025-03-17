
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

type OpenAIModel = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';

interface ApiKeyContextType {
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  selectedModel: OpenAIModel;
  setSelectedModel: (model: OpenAIModel) => Promise<void>;
  isLoading: boolean;
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [selectedModel, setSelectedModelState] = useState<OpenAIModel>('gpt-4o');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch user's API key and model preference from the database
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) {
        setApiKeyState(null);
        setSelectedModelState('gpt-4o');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_settings')
          .select('api_key, model_preference')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user settings:", error);
          setIsLoading(false);
          return;
        }

        if (data) {
          setApiKeyState(data.api_key);
          if (data.model_preference) {
            setSelectedModelState(data.model_preference as OpenAIModel);
          }
        }
      } catch (error) {
        console.error("Error in fetching user settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSettings();
  }, [user]);

  const setApiKey = async (key: string) => {
    if (!user) {
      toast.error("You must be logged in to save API key");
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ api_key: key })
        .eq('user_id', user.id);

      if (error) {
        toast.error("Failed to save API key");
        console.error("Error saving API key:", error);
        return;
      }

      setApiKeyState(key);
      toast.success("API key saved successfully");
    } catch (error) {
      toast.error("An error occurred while saving API key");
      console.error("Error in saving API key:", error);
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
        toast.error("Failed to remove API key");
        console.error("Error removing API key:", error);
        return;
      }

      setApiKeyState(null);
      toast.success("API key removed");
    } catch (error) {
      toast.error("An error occurred while removing API key");
      console.error("Error in removing API key:", error);
    }
  };

  const setSelectedModel = async (model: OpenAIModel) => {
    if (!user) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ model_preference: model })
        .eq('user_id', user.id);

      if (error) {
        toast.error("Failed to save model preference");
        console.error("Error saving model preference:", error);
        return;
      }

      setSelectedModelState(model);
    } catch (error) {
      toast.error("An error occurred while saving model preference");
      console.error("Error in saving model preference:", error);
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
        setSelectedModel,
        isLoading
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
