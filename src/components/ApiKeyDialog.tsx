
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { KeyRound, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import ModelSelector from '@/components/ModelSelector';
import { useAuth } from '@/contexts/AuthContext';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ open, onOpenChange }) => {
  const { apiKey, setApiKey, clearApiKey, isKeySet, isLoading } = useApiKey();
  const { user } = useAuth();
  const [inputKey, setInputKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save an API key');
      return;
    }
    
    if (inputKey.trim()) {
      setIsSaving(true);
      try {
        await setApiKey(inputKey.trim());
        setInputKey('');
        onOpenChange(false);
      } catch (error) {
        console.error('Error saving API key:', error);
        toast.error('Failed to save API key');
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.error('Please enter a valid API key');
    }
  };

  const handleRemove = async () => {
    if (!user) {
      toast.error('You must be logged in to remove your API key');
      return;
    }
    
    setIsSaving(true);
    try {
      await clearApiKey();
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing API key:', error);
      toast.error('Failed to remove API key');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {isKeySet ? 'Manage' : 'Set'} OpenAI API Key
          </DialogTitle>
          <DialogDescription>
            {isKeySet 
              ? 'Your API key is currently set. You can update or remove it.' 
              : 'Enter your OpenAI API key to enable AI features across all tools.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {isKeySet ? (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>API key is set and ready to use</span>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleRemove} 
                className="h-7 px-2 text-xs gap-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
              />
            </div>
          )}
          
          <ModelSelector />
          
          <div className="text-xs text-muted-foreground">
            <p>Your API key is stored securely in our database.</p>
            <p className="mt-1">
              Don't have an API key?{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noreferrer" 
                className="text-primary hover:underline"
              >
                Get one from OpenAI
              </a>
            </p>
          </div>
        </div>
        
        {!isKeySet && (
          <DialogFooter className="sm:justify-end">
            <Button 
              onClick={handleSave} 
              className="w-full sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              ) : null}
              Save API Key
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
