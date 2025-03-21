
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, EyeOff, Eye, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  created_at: string;
  is_active?: boolean;
}

const ApiKeys = () => {
  const { user } = useAuth();
  const { loadApiKeyFromDatabase, activeKeyId, setActiveKeyId } = useApiKey();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const toggleKeyVisibility = (keyId: string) => {
    setHiddenKeys(prevHiddenKeys => {
      const newHiddenKeys = new Set(prevHiddenKeys);
      if (newHiddenKeys.has(keyId)) {
        newHiddenKeys.delete(keyId);
      } else {
        newHiddenKeys.add(keyId);
      }
      return newHiddenKeys;
    });
  };

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setApiKeys(data || []);
      
      // Initialize all keys as hidden
      const hidden = new Set<string>();
      data?.forEach(key => hidden.add(key.id));
      setHiddenKeys(hidden);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key.trim()) {
      setValidationError("Please enter a valid API key");
      return false;
    }

    setIsValidatingKey(true);
    setValidationError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
        }
      });
      
      if (response.ok) {
        return true;
      }
      
      const errorData = await response.json();
      if (response.status === 401) {
        setValidationError("Invalid API key. Please check and try again.");
        return false;
      } else {
        setValidationError(`API key error: ${errorData.error?.message || "Unknown error"}`);
        return false;
      }
    } catch (error) {
      console.error("API key validation error:", error);
      setValidationError("Could not validate API key. Check your internet connection.");
      return false;
    } finally {
      setIsValidatingKey(false);
    }
  };

  const addApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeyValue) {
      toast.error('Please enter both a name and value for your API key');
      return;
    }

    // Validate the API key before saving
    const isValid = await validateApiKey(newKeyValue);
    if (!isValid) {
      return;
    }

    try {
      setIsLoading(true);
      
      // First deactivate all keys if this is the first key
      if (apiKeys.length === 0) {
        const { error: updateError } = await supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('user_id', user?.id);
          
        if (updateError) {
          console.error("Error deactivating existing API keys:", updateError);
        }
      }
      
      // Then insert the new key, making it active if it's the first key
      const { error } = await supabase
        .from('api_keys')
        .insert([{ 
          key_name: newKeyName, 
          key_value: newKeyValue, 
          user_id: user?.id,
          is_active: apiKeys.length === 0 // Make active if it's the first key
        }]);

      if (error) throw error;
      
      toast.success('API key added successfully');
      setNewKeyName('');
      setNewKeyValue('');
      setIsAdding(false);
      fetchApiKeys();
      
      // If this is the first OpenAI API key or if there are no active keys, refresh the context
      if (newKeyName.toLowerCase().includes('openai') || apiKeys.every(key => !key.is_active)) {
        loadApiKeyFromDatabase();
      }
    } catch (error) {
      console.error('Error adding API key:', error);
      toast.error('Failed to add API key');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Check if deleting the active key
      const keyToDelete = apiKeys.find(key => key.id === id);
      const isActiveKey = keyToDelete?.is_active;
      
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('API key deleted successfully');
      
      // If we deleted the active key, we need to activate another key if available
      if (isActiveKey) {
        // Fetch remaining keys
        const { data: remainingKeys, error: fetchError } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!fetchError && remainingKeys && remainingKeys.length > 0) {
          // Set first remaining key as active
          await setActiveKeyId(remainingKeys[0].id);
          toast.success(`Set "${remainingKeys[0].key_name}" as the active key`);
        }
      }
      
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setIsLoading(false);
    }
  };

  const activateKey = async (id: string) => {
    try {
      const success = await setActiveKeyId(id);
      
      if (success) {
        toast.success('API key activated successfully');
        fetchApiKeys();
      } else {
        toast.error('Failed to activate API key');
      }
    } catch (error) {
      console.error('Error activating API key:', error);
      toast.error('Failed to activate API key');
    }
  };

  const maskKey = (key: string) => {
    if (key.startsWith('sk-')) {
      return `sk-...${key.slice(-4)}`;
    }
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys securely. These keys are stored encrypted and can only be accessed by you.
          </p>
        </div>

        <ApiKeyRequirement 
          title="Authentication Required" 
          description="You need to sign in to manage your API keys."
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl">Your API Keys</CardTitle>
                <CardDescription>
                  Only one API key can be active at a time. The active key will be used for all API requests.
                </CardDescription>
              </div>
              {!isAdding && (
                <div className="flex gap-2">
                  <Button onClick={() => setIsAdding(true)} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Key
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {isAdding && (
                <form onSubmit={addApiKey} className="space-y-4 mb-6 p-4 bg-secondary/20 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="OpenAI API Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="key-value">API Key</Label>
                    <Input
                      id="key-value"
                      type="password"
                      placeholder="sk-..."
                      value={newKeyValue}
                      onChange={(e) => {
                        setNewKeyValue(e.target.value);
                        setValidationError(null);
                      }}
                      required
                      className={validationError ? "border-red-300" : ""}
                    />
                  </div>
                  
                  {validationError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAdding(false);
                        setValidationError(null);
                        setNewKeyName('');
                        setNewKeyValue('');
                      }}
                      disabled={isLoading || isValidatingKey}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || isValidatingKey || !newKeyName || !newKeyValue}
                    >
                      {isValidatingKey ? 'Validating...' : isLoading ? 'Saving...' : 'Save API Key'}
                    </Button>
                  </div>
                </form>
              )}
              
              {isLoading && !apiKeys.length ? (
                <div className="text-center py-6">Loading API keys...</div>
              ) : !apiKeys.length ? (
                <div className="text-center py-6 text-muted-foreground">
                  <KeyRound className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>You haven't added any API keys yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((apiKey) => (
                    <div 
                      key={apiKey.id} 
                      className={`flex items-center justify-between p-3 rounded-md ${
                        apiKey.is_active 
                          ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/30' 
                          : 'bg-secondary/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{apiKey.key_name}</p>
                          {apiKey.is_active && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {hiddenKeys.has(apiKey.id) ? maskKey(apiKey.key_value) : apiKey.key_value}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          title={hiddenKeys.has(apiKey.id) ? "Show API key" : "Hide API key"}
                        >
                          {hiddenKeys.has(apiKey.id) ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        {!apiKey.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30"
                            onClick={() => activateKey(apiKey.id)}
                            title="Set as active key"
                          >
                            Set Active
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteApiKey(apiKey.id)}
                          title="Delete API key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </ApiKeyRequirement>
      </div>
    </div>
  );
};

export default ApiKeys;
