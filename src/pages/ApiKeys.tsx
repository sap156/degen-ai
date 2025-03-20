
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, EyeOff, Eye, KeyRound } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { useApiKey } from '@/contexts/ApiKeyContext';
import ApiKeyDialog from '@/components/ApiKeyDialog';

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  created_at: string;
}

const ApiKeys = () => {
  const { user } = useAuth();
  const { loadApiKeyFromDatabase } = useApiKey();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

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

  const addApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeyValue) {
      toast.error('Please enter both a name and value for your API key');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('api_keys')
        .insert([{ key_name: newKeyName, key_value: newKeyValue, user_id: user?.id }]);

      if (error) throw error;
      
      toast.success('API key added successfully');
      setNewKeyName('');
      setNewKeyValue('');
      setIsAdding(false);
      fetchApiKeys();
      
      // If this is an OpenAI API key, refresh the context
      if (newKeyName.toLowerCase().includes('openai')) {
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
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('API key deleted successfully');
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setIsLoading(false);
    }
  };

  const maskKey = (key: string) => {
    if (key.startsWith('sk-')) {
      return `sk-...${key.slice(-4)}`;
    }
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  const handleKeySaved = () => {
    fetchApiKeys();
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
                  These keys are stored securely in your account.
                </CardDescription>
              </div>
              {!isAdding && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setApiKeyDialogOpen(true)} 
                    variant="outline"
                    className="gap-1"
                  >
                    <KeyRound className="h-4 w-4" />
                    Set Up OpenAI Key
                  </Button>
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
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAdding(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save API Key'}
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
                      className="flex items-center justify-between p-3 bg-secondary/10 rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{apiKey.key_name}</p>
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
      
      <ApiKeyDialog 
        open={apiKeyDialogOpen} 
        onOpenChange={setApiKeyDialogOpen} 
        onKeySaved={handleKeySaved}
      />
    </div>
  );
};

export default ApiKeys;
