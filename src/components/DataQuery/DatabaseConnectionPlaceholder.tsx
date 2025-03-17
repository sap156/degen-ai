
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Lock, Server, ChevronRight, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          
          <div className="w-full max-w-sm opacity-70 mb-4">
            <div className="border rounded-md p-3 bg-background/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Type</span>
                <div className="bg-muted rounded h-6 w-24"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hostname</span>
                <div className="bg-muted rounded h-6 w-32"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Credentials</span>
                <div className="bg-muted rounded h-6 w-28"></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="database" disabled>
              <Server className="mr-2 h-4 w-4" />
              Connect Database
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" disabled>
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    In an upcoming release, you'll be able to connect to PostgreSQL, 
                    MySQL, SQL Server, and SQLite databases to execute queries and explore schemas directly.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseConnectionPlaceholder;
