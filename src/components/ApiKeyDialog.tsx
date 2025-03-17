
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { KeyRound, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import ModelSelector from '@/components/ModelSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ open, onOpenChange }) => {
  const { apiKey, setApiKey, clearApiKey, isKeySet } = useApiKey();
  const [inputKey, setInputKey] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear validation error when dialog opens/closes
  useEffect(() => {
    if (open) {
      setValidationError(null);
    }
  }, [open]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      setIsValidatingKey(true);
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

  const handleSave = async () => {
    if (!inputKey.trim()) {
      setValidationError("Please enter a valid API key");
      return;
    }
    
    // Optional: validate API key before saving
    // Uncomment this section to enable validation
    /*
    const isValid = await validateApiKey(inputKey.trim());
    if (!isValid) {
      return;
    }
    */
    
    setApiKey(inputKey.trim());
    toast.success('API key saved successfully');
    setInputKey('');
    setValidationError(null);
    onOpenChange(false);
  };

  const handleRemove = () => {
    clearApiKey();
    toast.success('API key removed');
    setValidationError(null);
    onOpenChange(false);
  };

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
          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

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
              >
                <X className="h-3.5 w-3.5" />
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
                className={validationError ? "border-red-300" : ""}
              />
            </div>
          )}
          
          <ModelSelector />
          
          <div className="text-xs text-muted-foreground">
            <p>Your API key is stored locally in your browser and never sent to our servers.</p>
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
              disabled={isValidatingKey || !inputKey.trim()}
            >
              {isValidatingKey ? 'Validating...' : 'Save API Key'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
