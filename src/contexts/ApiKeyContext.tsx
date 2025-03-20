
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type OpenAIModel = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';

interface ApiKeyContextType {
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string, keyId?: string) => void;
  clearApiKey: () => void;
  selectedModel: OpenAIModel;
  setSelectedModel: (model: OpenAIModel) => void;
  availableModels: OpenAIModel[];
  loadApiKeyFromDatabase: () => Promise<boolean>;
  activeKeyId: string | null;
  setActiveKeyId: (keyId: string) => Promise<boolean>;
}

const DEFAULT_MODEL: OpenAIModel = 'gpt-4o';
const AVAILABLE_MODELS: OpenAIModel[] = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [selectedModel, setSelectedModelState] = useState<OpenAIModel>(DEFAULT_MODEL);
  const [availableModels] = useState<OpenAIModel[]>(AVAILABLE_MODELS);
  const [activeKeyId, setActiveKeyIdState] = useState<string | null>(null);
  const { user } = useAuth();

  // Load API key from localStorage or database on mount and when auth state changes
  useEffect(() => {
    const loadInitialApiKey = async () => {
      // First check localStorage (for non-authenticated users)
      try {
        const storedKey = localStorage.getItem('openai-api-key');
        if (storedKey) {
          setApiKeyState(storedKey);
        }
        
        // Load model preference from localStorage with fallback
        const storedModel = localStorage.getItem('openai-model');
        if (storedModel && isValidModel(storedModel)) {
          setSelectedModelState(storedModel);
        } else {
          // If the stored model is invalid, reset to default
          localStorage.setItem('openai-model', DEFAULT_MODEL);
        }
      } catch (error) {
        console.error("Error loading API key or model from localStorage:", error);
        // Reset to defaults if there's any issue
        localStorage.setItem('openai-model', DEFAULT_MODEL);
      }

      // If user is logged in, check for API key in database
      if (user) {
        await loadApiKeyFromDatabase();
      }
    };

    loadInitialApiKey();
  }, [user]);

  // Validate model to ensure it's a supported one
  const isValidModel = (model: string): model is OpenAIModel => {
    return AVAILABLE_MODELS.includes(model as OpenAIModel);
  };

  const loadApiKeyFromDatabase = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Query for the active API key (is_active = true)
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error("Error loading active API key from database:", error);
        return false;
      }

      if (data && data.length > 0) {
        const activeKey = data[0];
        setApiKeyState(activeKey.key_value);
        setActiveKeyIdState(activeKey.id);
        localStorage.setItem('openai-api-key', activeKey.key_value);
        return true;
      }
      
      // If no active key found, try to find any key
      const { data: allKeys, error: allKeysError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
        
      if (allKeysError) {
        console.error("Error loading any API key from database:", allKeysError);
        return false;
      }
      
      if (allKeys && allKeys.length > 0) {
        // Set the first key as active
        const keyToActivate = allKeys[0];
        await setActiveKeyId(keyToActivate.id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error loading API key from database:", error);
      return false;
    }
  };

  const setActiveKeyId = async (keyId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // First, deactivate all keys
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error("Error deactivating existing API keys:", updateError);
        return false;
      }
      
      // Then activate the selected key
      const { data, error } = await supabase
        .from('api_keys')
        .update({ is_active: true })
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error("Error activating API key:", error);
        return false;
      }
      
      // Update local state
      setApiKeyState(data.key_value);
      setActiveKeyIdState(data.id);
      localStorage.setItem('openai-api-key', data.key_value);
      
      return true;
    } catch (error) {
      console.error("Error setting active API key:", error);
      return false;
    }
  };

  const setApiKey = (key: string, keyId?: string) => {
    localStorage.setItem('openai-api-key', key);
    setApiKeyState(key);
    
    // If keyId is provided, update the activeKeyId
    if (keyId) {
      setActiveKeyIdState(keyId);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('openai-api-key');
    setApiKeyState(null);
    setActiveKeyIdState(null);
  };

  const setSelectedModel = (model: OpenAIModel) => {
    if (!isValidModel(model)) {
      console.warn(`Attempted to set invalid model: ${model}, defaulting to ${DEFAULT_MODEL}`);
      model = DEFAULT_MODEL;
    }
    
    localStorage.setItem('openai-model', model);
    setSelectedModelState(model);
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
        availableModels: AVAILABLE_MODELS,
        loadApiKeyFromDatabase,
        activeKeyId,
        setActiveKeyId
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
