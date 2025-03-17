
import React, { createContext, useContext, useState, useEffect } from 'react';

type OpenAIModel = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';

interface ApiKeyContextType {
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  selectedModel: OpenAIModel;
  setSelectedModel: (model: OpenAIModel) => void;
  availableModels: OpenAIModel[];
}

const DEFAULT_MODEL: OpenAIModel = 'gpt-4o';
const AVAILABLE_MODELS: OpenAIModel[] = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [selectedModel, setSelectedModelState] = useState<OpenAIModel>(DEFAULT_MODEL);
  const [availableModels] = useState<OpenAIModel[]>(AVAILABLE_MODELS);

  useEffect(() => {
    // Load API key from localStorage
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
  }, []);

  // Validate model to ensure it's a supported one
  const isValidModel = (model: string): model is OpenAIModel => {
    return AVAILABLE_MODELS.includes(model as OpenAIModel);
  };

  const setApiKey = (key: string) => {
    localStorage.setItem('openai-api-key', key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem('openai-api-key');
    setApiKeyState(null);
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
        availableModels: AVAILABLE_MODELS
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
