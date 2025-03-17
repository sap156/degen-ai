
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Lock } from 'lucide-react';

const DatabaseConnectionPlaceholder: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <span>Database Connection</span>
        </CardTitle>
        <CardDescription>
          Coming soon: Connect directly to your database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/30">
          <Lock className="h-10 w-10 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">Direct Database Access</h3>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
            Soon you'll be able to connect directly to your database to navigate and execute queries.
          </p>
          <Button variant="outline" disabled>
            Connect Database
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseConnectionPlaceholder;
