
import React, { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, AlertTriangle } from 'lucide-react';
import ApiKeyDialog from './ApiKeyDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ApiKeyRequirementProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const ApiKeyRequirement: React.FC<ApiKeyRequirementProps> = ({
  title = "OpenAI API Key Required",
  description = "To use AI-powered features, please set up your OpenAI API key.",
  children
}) => {
  const { isKeySet, isLoading: isKeyLoading } = useApiKey();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  
  // If authentication is loading, show loading state
  if (isAuthLoading || isKeyLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // If user is not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  // If API key is set, render children
  if (isKeySet) return <>{children}</>; 
  
  // If API key is not set, show warning card
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
      
      {/* Render children even if key is not set, so user can see UI */}
      {children}
      
      <ApiKeyDialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen} />
    </>
  );
};

export default ApiKeyRequirement;
