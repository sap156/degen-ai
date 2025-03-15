
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Info, KeyRound, Check, X } from 'lucide-react';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ open, onOpenChange }) => {
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [inputKey, setInputKey] = useState(apiKey || '');

  const handleSave = () => {
    setApiKey(inputKey);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            OpenAI API Key Setup
          </DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable AI-powered features across the platform.
            Your key is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Input
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="sk-..."
              className="font-mono"
              type="password"
            />
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Keys start with "sk-" and can be found in your OpenAI dashboard
            </div>
          </div>
          
          {apiKey && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <Check className="h-4 w-4" />
              API key is currently set
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {apiKey && (
            <Button 
              variant="outline" 
              type="button" 
              onClick={clearApiKey}
              className="w-full sm:w-auto flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Remove Key
            </Button>
          )}
          <Button 
            type="button" 
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
