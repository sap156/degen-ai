
import React, { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, AlertTriangle, LogIn } from 'lucide-react';
import ApiKeyDialog from './ApiKeyDialog';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const { isKeySet, loadApiKeyFromDatabase } = useApiKey();
  const { user } = useAuth();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  
  const handleKeySaved = async () => {
    if (user) {
      // Reload API keys from database after saving
      await loadApiKeyFromDatabase();
    }
  };
  
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/20 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Authentication Required
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-300">
              Please sign in to access and manage your API keys.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button 
              variant="outline"
              className="border-amber-400 bg-white dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 gap-2"
              asChild
            >
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }
  
  if (isKeySet) return <>{children}</>; // Return children directly if key is set
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
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
      </motion.div>
      
      {/* Render children even if key is not set, so user can see UI */}
      {children}
      
      <ApiKeyDialog 
        open={apiKeyDialogOpen} 
        onOpenChange={setApiKeyDialogOpen} 
        onKeySaved={handleKeySaved}
      />
    </>
  );
};

export default ApiKeyRequirement;
