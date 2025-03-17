
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { signOut } from '@/services/supabaseService';
import { User, Settings, LogOut, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import ApiKeyDialog from './ApiKeyDialog';
import AuthDialog from './AuthDialog';

const UserProfileDropdown: React.FC = () => {
  const { isAuthenticated, userEmail, isKeySet } = useApiKey();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) {
      toast.success('Signed out successfully');
    }
  };

  return (
    <>
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="max-w-[100px] truncate hidden sm:inline-block">
                {userEmail}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
              {userEmail}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setApiKeyDialogOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              {isKeySet ? 'Manage API Key' : 'Set API Key'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setAuthDialogOpen(true)}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline-block">Sign In</span>
        </Button>
      )}
      
      <ApiKeyDialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen} />
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default UserProfileDropdown;
