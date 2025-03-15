
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isKeySet: boolean;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    return storedKey;
  });

  const setApiKey = (key: string) => {
    if (key.startsWith('sk-') && key.length > 20) {
      localStorage.setItem('openai_api_key', key);
      setApiKeyState(key);
      toast.success('API key saved successfully');
    } else {
      toast.error('Invalid OpenAI API key format');
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKeyState(null);
    toast.info('API key removed');
  };

  const isKeySet = Boolean(apiKey);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isKeySet, clearApiKey }}>
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
