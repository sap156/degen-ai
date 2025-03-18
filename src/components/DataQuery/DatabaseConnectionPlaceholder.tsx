
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle,
  Database, 
  Server, 
  Snowflake,
} from 'lucide-react';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const DatabaseConnectionPlaceholder: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <span>Database Connection</span>
        </CardTitle>
        <CardDescription>
          Database connection feature is currently disabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature Disabled</AlertTitle>
          <AlertDescription>
            The database connection feature is currently unavailable. You can still use the Data Query tools with a manual schema.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/30">
          <div className="flex items-center gap-2 mb-4 opacity-50">
            <Server className="h-6 w-6 text-primary" />
            <Snowflake className="h-6 w-6 text-blue-500" />
            <Database className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">Database Connection Disabled</h3>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
            This feature is temporarily unavailable.
          </p>
          
          <Button
            variant="outline" 
            disabled={true}
            className="gap-2 opacity-50"
          >
            <Server className="h-4 w-4" />
            Connect Database
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseConnectionPlaceholder;
