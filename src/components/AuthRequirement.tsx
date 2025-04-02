
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuroraButton } from '@/components/ui/aurora-button';

interface AuthRequirementProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  showUserGuide?: React.ReactNode;
}

const AuthRequirement: React.FC<AuthRequirementProps> = ({
  title = "Authentication Required",
  description = "Please sign in to access this feature.",
  children,
  showUserGuide
}) => {
  return (
    <div className="space-y-6">
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
            <AuroraButton 
              className="border-transparent"
              glowClassName="from-amber-400 via-orange-500 to-amber-600"
            >
              <Link to="/auth" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </AuroraButton>
          </CardFooter>
        </Card>
      </motion.div>
      
      {/* Show only user guide if provided when not authenticated */}
      {showUserGuide}
    </div>
  );
};

export default AuthRequirement;
