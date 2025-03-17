
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { toast } from 'sonner';
import { DatabaseConnectionConfig, connectToDatabase } from '@/services/databaseService';
import { Database, Server, Snowflake, KeyRound, Link2 } from 'lucide-react';

interface DatabaseConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess?: () => void;
}

const DatabaseConnectionDialog: React.FC<DatabaseConnectionDialogProps> = ({ 
  open, 
  onOpenChange,
  onConnectionSuccess 
}) => {
  const { apiKey } = useApiKey();
  const [connectionType, setConnectionType] = useState<'mongodb' | 'postgresql' | 'snowflake'>('postgresql');
  const [useConnectionString, setUseConnectionString] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [useSSL, setUseSSL] = useState(true);
  
  // Form fields
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [connectionString, setConnectionString] = useState('');
  
  // Default ports by database type
  const defaultPorts = {
    mongodb: '27017',
    postgresql: '5432',
    snowflake: ''  // Snowflake doesn't use a standard port
  };
  
  const resetForm = () => {
    setConnectionType('postgresql');
    setUseConnectionString(false);
    setHost('');
    setPort('');
    setDatabase('');
    setUsername('');
    setPassword('');
    setConnectionString('');
    setUseSSL(true);
  };
  
  const handleConnectionTypeChange = (value: 'mongodb' | 'postgresql' | 'snowflake') => {
    setConnectionType(value);
    setPort(defaultPorts[value]);
  };
  
  const handleConnect = async () => {
    if (!apiKey) {
      toast.error('Please set your OpenAI API key first');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const config: DatabaseConnectionConfig = {
        type: connectionType,
        host,
        port,
        database,
        username,
        password,
        connectionString,
        useConnectionString,
        ssl: useSSL
      };
      
      const success = await connectToDatabase(apiKey, config);
      
      if (success) {
        toast.success(`Connected to ${connectionType} database successfully`);
        resetForm();
        onOpenChange(false);
        if (onConnectionSuccess) {
          onConnectionSuccess();
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };
  
  const getConnectionIcon = () => {
    switch (connectionType) {
      case 'mongodb':
        return <Database className="h-5 w-5" />;
      case 'postgresql':
        return <Server className="h-5 w-5" />;
      case 'snowflake':
        return <Snowflake className="h-5 w-5" />;
    }
  };

  const getConnectionLabel = () => {
    switch (connectionType) {
      case 'mongodb':
        return 'MongoDB Connection';
      case 'postgresql':
        return 'PostgreSQL Connection';
      case 'snowflake':
        return 'Snowflake Connection';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getConnectionIcon()}
            {getConnectionLabel()}
          </DialogTitle>
          <DialogDescription>
            Connect to your database to query and analyze your data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Database Type</Label>
            <Select 
              value={connectionType} 
              onValueChange={(value) => handleConnectionTypeChange(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>PostgreSQL</span>
                  </div>
                </SelectItem>
                <SelectItem value="mongodb">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>MongoDB</span>
                  </div>
                </SelectItem>
                <SelectItem value="snowflake">
                  <div className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4" />
                    <span>Snowflake</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-connection-string" 
              checked={useConnectionString}
              onCheckedChange={(checked) => setUseConnectionString(checked as boolean)}
            />
            <label
              htmlFor="use-connection-string"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use connection string
            </label>
          </div>
          
          {useConnectionString ? (
            <div className="space-y-2">
              <Label htmlFor="connection-string">Connection String</Label>
              <div className="flex items-center space-x-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="connection-string"
                  type="password"
                  placeholder={connectionType === 'mongodb' ? 
                    'mongodb://username:password@host:port/database' : 
                    connectionType === 'postgresql' ? 
                    'postgresql://username:password@host:port/database' :
                    'account-name.snowflakecomputing.com'}
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    placeholder="localhost or hostname"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder={defaultPorts[connectionType]}
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="database">Database Name</Label>
                <Input
                  id="database"
                  placeholder="Optional database name"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              {(connectionType === 'postgresql' || connectionType === 'mongodb') && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-ssl"
                    checked={useSSL}
                    onCheckedChange={setUseSSL}
                  />
                  <Label htmlFor="use-ssl">Use SSL</Label>
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            <p>This application uses a simulated connection for demonstration purposes.</p>
            <p className="mt-1">In a production environment, direct database connections would be established.</p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConnect}
            disabled={isConnecting || (!useConnectionString && (!host || !username || !password)) || (useConnectionString && !connectionString)}
            className="gap-2"
          >
            {isConnecting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Connecting...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DatabaseConnectionDialog;
