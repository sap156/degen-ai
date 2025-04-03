
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Snowflake,
  Database, 
  Server
} from 'lucide-react';

interface SnowflakeConnectComponentProps {
  onConnectClick: () => void;
}

const SnowflakeConnectComponent: React.FC<SnowflakeConnectComponentProps> = ({ onConnectClick }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-blue-500" />
          <span>Connect to Snowflake</span>
        </CardTitle>
        <CardDescription>
          Connect to your Snowflake database to run SQL queries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3 mb-4">
            <Snowflake className="h-8 w-8 text-blue-500" />
            <Database className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">Snowflake Integration</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Connect to your Snowflake database to execute SQL queries directly from this interface.
            Manage your connections in the Connections tab.
          </p>
          
          <Button
            variant="database" 
            onClick={onConnectClick}
            className="gap-2"
          >
            <Server className="h-4 w-4" />
            Manage Snowflake Connections
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SnowflakeConnectComponent;
