
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Database, Server, Snowflake, ExternalLink, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { 
  isDatabaseConnected, 
  getAllConnections, 
  DatabaseConnectionConfig,
  switchConnection,
  disconnectDatabase,
  getConnectionConfig
} from '@/services/databaseService';
import DatabaseConnectionDialog from '../DatabaseConnectionDialog';
import DatabaseNavigation from '../DatabaseNavigation';
import { Badge } from '@/components/ui/badge';

const DatabaseConnectionPlaceholder: React.FC = () => {
  const { apiKey } = useApiKey();
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(isDatabaseConnected());
  const [connections, setConnections] = useState<DatabaseConnectionConfig[]>([]);
  const [activeConnection, setActiveConnection] = useState<DatabaseConnectionConfig | null>(null);
  
  // Load all connections
  useEffect(() => {
    const loadConnections = () => {
      const allConnections = getAllConnections();
      setConnections(allConnections);
      
      const current = getConnectionConfig();
      setActiveConnection(current);
      
      setIsConnected(isDatabaseConnected());
    };
    
    loadConnections();
  }, []);
  
  const handleConnectionSuccess = () => {
    // Refresh the connections list
    const allConnections = getAllConnections();
    setConnections(allConnections);
    
    const current = getConnectionConfig();
    setActiveConnection(current);
    
    setIsConnected(true);
  };
  
  const handleSwitchConnection = (connectionId: string) => {
    if (switchConnection(connectionId)) {
      const current = getConnectionConfig();
      setActiveConnection(current);
    }
  };
  
  const handleDisconnect = (connectionId?: string) => {
    disconnectDatabase(connectionId);
    
    // Refresh the connections list
    const allConnections = getAllConnections();
    setConnections(allConnections);
    
    const current = getConnectionConfig();
    setActiveConnection(current);
    
    setIsConnected(isDatabaseConnected());
  };
  
  const getConnectionIcon = (type: 'mongodb' | 'postgresql' | 'snowflake') => {
    switch (type) {
      case 'mongodb':
        return <Database className="h-5 w-5" />;
      case 'postgresql':
        return <Server className="h-5 w-5" />;
      case 'snowflake':
        return <Snowflake className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getConnectionLabel = (type: 'mongodb' | 'postgresql' | 'snowflake') => {
    switch (type) {
      case 'mongodb':
        return 'MongoDB';
      case 'postgresql':
        return 'PostgreSQL';
      case 'snowflake':
        return 'Snowflake';
    }
  };
  
  const getConnectionDisplayName = (connection: DatabaseConnectionConfig) => {
    if (connection.database) {
      return `${connection.host}/${connection.database}`;
    } else {
      return connection.host || connection.connectionString?.split('@')[1]?.split('/')[0] || 'Database';
    }
  };
  
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
        {isConnected && activeConnection ? (
          <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              {getConnectionIcon(activeConnection.type)}
              <h3 className="text-lg font-medium">{getConnectionLabel(activeConnection.type)}</h3>
              <Badge variant="outline">
                {getConnectionDisplayName(activeConnection)}
              </Badge>
            </div>
            
            <div className="w-full flex flex-col gap-3 mt-3">
              <div className="flex justify-between items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Database className="h-4 w-4" />
                      Connections
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[240px]">
                    <DropdownMenuLabel>Switch Database</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {connections.map((conn) => (
                      <DropdownMenuItem
                        key={conn.id}
                        onClick={() => handleSwitchConnection(conn.id!)}
                        className={`gap-2 ${activeConnection.id === conn.id ? 'bg-muted' : ''}`}
                      >
                        {getConnectionIcon(conn.type)}
                        <span>{getConnectionDisplayName(conn)}</span>
                        {activeConnection.id === conn.id && (
                          <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsConnectionDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Database
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDisconnect(activeConnection.id)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Disconnect Current
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsNavigationOpen(true)}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Browse Database
                </Button>
              </div>
            </div>
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
        onConnectionSuccess={handleConnectionSuccess}
      />
      
      <DatabaseNavigation
        open={isNavigationOpen}
        onOpenChange={setIsNavigationOpen}
      />
    </Card>
  );
};

export default DatabaseConnectionPlaceholder;
