
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signInWithEmail, signUpWithEmail } from '@/services/supabaseService';
import { toast } from 'sonner';
import { KeyRound, Mail, User, Lock } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const { success } = await signInWithEmail(email, password);
      
      if (success) {
        toast.success('Signed in successfully');
        onOpenChange(false);
        setEmail('');
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const { success } = await signUpWithEmail(email, password);
      
      if (success) {
        toast.success('Account created successfully! Check your email to confirm your account.');
        setActiveTab('signin');
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </DialogTitle>
          <DialogDescription>
            Sign in or create an account to securely save your OpenAI API key and settings.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email-signin">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="email-signin" 
                  placeholder="you@example.com" 
                  type="email" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-signin">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="password-signin" 
                  type="password" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
                onClick={handleSignIn}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email-signup">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="email-signup" 
                  placeholder="you@example.com" 
                  type="email" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-signup">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="password-signup" 
                  type="password" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
                onClick={handleSignUp}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
        
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          <p>By signing up, you can:</p>
          <ul className="mt-1 space-y-1 list-disc pl-4">
            <li>Securely store your OpenAI API key</li>
            <li>Save model preferences across devices</li>
            <li>Manage history and favorites</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
