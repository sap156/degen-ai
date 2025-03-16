
import React, { createContext, useContext, useState, useEffect } from 'react';

type OpenAIModel = 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';

interface ApiKeyContextType {
  apiKey: string | null;
  isKeySet: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  selectedModel: OpenAIModel;
  setSelectedModel: (model: OpenAIModel) => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>('gpt-4-turbo');

  useEffect(() => {
    const storedKey = localStorage.getItem('openai-api-key');
    if (storedKey) {
      setApiKeyState(storedKey);
    }
    
    const storedModel = localStorage.getItem('openai-model') as OpenAIModel | null;
    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem('openai-api-key', key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem('openai-api-key');
    setApiKeyState(null);
  };

  const handleSetSelectedModel = (model: OpenAIModel) => {
    localStorage.setItem('openai-model', model);
    setSelectedModel(model);
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
