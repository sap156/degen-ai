
import React, { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, AlertTriangle } from 'lucide-react';
import ApiKeyDialog from './ApiKeyDialog';

interface ApiKeyRequirementProps {
  title?: string;
  description?: string;
}

const ApiKeyRequirement: React.FC<ApiKeyRequirementProps> = ({
  title = "OpenAI API Key Required",
  description = "To use AI-powered features, please set up your OpenAI API key."
}) => {
  const { isKeySet } = useApiKey();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  
  if (isKeySet) return null;
  
  return (
    <>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/20 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-300">
            {description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2">
          <Button 
            onClick={() => setApiKeyDialogOpen(true)}
            variant="outline"
            className="border-amber-400 bg-white dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Set Up API Key
          </Button>
        </CardFooter>
      </Card>
      
      <ApiKeyDialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen} />
    </>
  );
};

export default ApiKeyRequirement;
