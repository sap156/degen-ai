
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Server, Snowflake, ExternalLink } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { isDatabaseConnected } from '@/services/databaseService';
import DatabaseConnectionDialog from '../DatabaseConnectionDialog';
import DatabaseNavigation from '../DatabaseNavigation';

const DatabaseConnectionPlaceholder: React.FC = () => {
  const { apiKey } = useApiKey();
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = React.useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = React.useState(false);
  const isConnected = isDatabaseConnected();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <span>Database Connection</span>
        </CardTitle>
        <CardDescription>
          {isConnected 
            ? "Your database is connected. Browse schemas and tables."
            : "Connect to your database to query and analyze data"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-6 w-6 text-primary" />
              <Snowflake className="h-6 w-6 text-blue-500" />
              <Database className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-medium">Database Connected</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
              You can now browse your database and execute queries.
            </p>
            
            <Button 
              variant="outline" 
              onClick={() => setIsNavigationOpen(true)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Browse Database
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-6 w-6 text-primary" />
              <Snowflake className="h-6 w-6 text-blue-500" />
              <Database className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-medium">Connect to Database</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
              Connect to PostgreSQL, MongoDB, or Snowflake to navigate, execute queries, and view results.
            </p>
            
            <Button
              variant="database" 
              disabled={!apiKey}
              onClick={() => setIsConnectionDialogOpen(true)}
              className="gap-2"
            >
              <Server className="h-4 w-4" />
              Connect Database
            </Button>
          </div>
        )}
      </CardContent>
      
      <DatabaseConnectionDialog 
        open={isConnectionDialogOpen} 
        onOpenChange={setIsConnectionDialogOpen} 
      />
      
      <DatabaseNavigation
        open={isNavigationOpen}
        onOpenChange={setIsNavigationOpen}
      />
    </Card>
  );
};

export default DatabaseConnectionPlaceholder;
