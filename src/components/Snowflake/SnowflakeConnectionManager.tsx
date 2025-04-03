
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Edit2, Trash2, Database, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useApiKey } from '@/contexts/ApiKeyContext';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import AuthRequirement from '@/components/AuthRequirement';

export interface SnowflakeConnection {
  id: string;
  connection_name: string;
  account_identifier: string;
  username: string;
  password: string;
  database_name: string;
  schema_name: string;
  warehouse: string;
  is_active: boolean;
}

interface SnowflakeConnectionManagerProps {
  onConnectionSelect?: (connection: SnowflakeConnection) => void;
  selectedConnectionId?: string;
}

const SnowflakeConnectionManager: React.FC<SnowflakeConnectionManagerProps> = ({ 
  onConnectionSelect,
  selectedConnectionId 
}) => {
  const { user } = useAuth();
  const { apiKey, isKeySet } = useApiKey();
  const [connections, setConnections] = useState<SnowflakeConnection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [editingConnection, setEditingConnection] = useState<SnowflakeConnection | null>(null);
  
  // Form state
  const [connectionName, setConnectionName] = useState<string>('');
  const [accountIdentifier, setAccountIdentifier] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [databaseName, setDatabaseName] = useState<string>('');
  const [schemaName, setSchemaName] = useState<string>('');
  const [warehouse, setWarehouse] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  // Load user's saved Snowflake connections
  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('snowflake_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setConnections(data || []);
      
      // If there is a selected connection ID and it exists in the loaded connections, select it
      if (selectedConnectionId) {
        const selected = data?.find(conn => conn.id === selectedConnectionId);
        if (selected && onConnectionSelect) {
          onConnectionSelect(selected);
        }
      }
    } catch (error) {
      console.error('Error loading Snowflake connections:', error);
      toast.error('Failed to load Snowflake connections');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    resetForm();
    setEditingConnection(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (connection: SnowflakeConnection) => {
    setConnectionName(connection.connection_name);
    setAccountIdentifier(connection.account_identifier);
    setUsername(connection.username);
    setPassword(connection.password);
    setDatabaseName(connection.database_name);
    setSchemaName(connection.schema_name);
    setWarehouse(connection.warehouse);
    setEditingConnection(connection);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setConnectionName('');
    setAccountIdentifier('');
    setUsername('');
    setPassword('');
    setDatabaseName('');
    setSchemaName('');
    setWarehouse('');
  };

  const validateForm = (): boolean => {
    if (!connectionName.trim()) {
      toast.error('Connection name is required');
      return false;
    }
    if (!accountIdentifier.trim()) {
      toast.error('Account identifier is required');
      return false;
    }
    if (!username.trim()) {
      toast.error('Username is required');
      return false;
    }
    if (!password.trim()) {
      toast.error('Password is required');
      return false;
    }
    if (!databaseName.trim()) {
      toast.error('Database name is required');
      return false;
    }
    if (!schemaName.trim()) {
      toast.error('Schema name is required');
      return false;
    }
    if (!warehouse.trim()) {
      toast.error('Warehouse is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const connectionData = {
        connection_name: connectionName,
        account_identifier: accountIdentifier,
        username,
        password,
        database_name: databaseName,
        schema_name: schemaName,
        warehouse,
        user_id: user!.id,
        is_active: true
      };

      let result;

      if (editingConnection) {
        // Update existing connection
        result = await supabase
          .from('snowflake_connections')
          .update(connectionData)
          .eq('id', editingConnection.id);
      } else {
        // Insert new connection
        result = await supabase
          .from('snowflake_connections')
          .insert(connectionData)
          .select();
      }

      if (result.error) throw result.error;

      toast.success(`Connection ${editingConnection ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      loadConnections();
      
      // If a new connection was created and it's the only one, select it automatically
      if (!editingConnection && result.data && result.data.length > 0 && connections.length === 0) {
        if (onConnectionSelect) {
          onConnectionSelect(result.data[0]);
        }
      }
      
    } catch (error) {
      console.error('Error saving Snowflake connection:', error);
      toast.error(`Failed to ${editingConnection ? 'update' : 'create'} connection`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) return;
    
    try {
      const { error } = await supabase
        .from('snowflake_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Connection deleted successfully');
      loadConnections();
      
      // If the deleted connection was selected, deselect it
      if (selectedConnectionId === id && onConnectionSelect) {
        onConnectionSelect(undefined as any);
      }
    } catch (error) {
      console.error('Error deleting Snowflake connection:', error);
      toast.error('Failed to delete connection');
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setIsTestingConnection(true);
    
    try {
      // Prepare a simple test query
      const testQuery = "SELECT 1 AS test";
      
      // Prepare credentials object
      const credentials = {
        account: accountIdentifier,
        username,
        password,
        database: databaseName,
        schema: schemaName,
        warehouse
      };

      // Call the Snowflake Edge Function
      const response = await supabase.functions.invoke('snowflake-query', {
        body: {
          sql: testQuery,
          credentials
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Test query failed');
      }

      toast.success('Connection successful!');
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(`Connection test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSelectConnection = (connection: SnowflakeConnection) => {
    if (onConnectionSelect) {
      onConnectionSelect(connection);
    }
  };

  if (!user) {
    return <AuthRequirement />;
  }

  if (!isKeySet) {
    return <ApiKeyRequirement />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Snowflake Connections</CardTitle>
          <CardDescription>
            Create and manage your connections to Snowflake
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-6">
              <Database className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-2" />
              <p className="text-muted-foreground mb-4">No connections found</p>
              <Button onClick={openAddDialog} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Your First Connection
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((connection) => (
                <div 
                  key={connection.id}
                  className={`p-3 border rounded-lg flex items-center justify-between ${
                    selectedConnectionId === connection.id ? 'bg-muted border-primary' : ''
                  }`}
                >
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => handleSelectConnection(connection)}
                  >
                    <h3 className="font-medium">{connection.connection_name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {connection.account_identifier} • {connection.database_name}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(connection)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteConnection(connection.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={openAddDialog} 
            className="gap-2"
            variant="outline"
          >
            <PlusCircle className="h-4 w-4" />
            Add Connection
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? 'Edit Snowflake Connection' : 'New Snowflake Connection'}
            </DialogTitle>
            <DialogDescription>
              Enter your Snowflake credentials to connect to your account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="connectionName" className="text-right">
                  Connection Name
                </Label>
                <Input
                  id="connectionName"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  className="col-span-3"
                  placeholder="My Snowflake Connection"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">
                  Account Identifier
                </Label>
                <Input
                  id="accountId"
                  value={accountIdentifier}
                  onChange={(e) => setAccountIdentifier(e.target.value)}
                  className="col-span-3"
                  placeholder="xy12345.us-east-1"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="database" className="text-right">
                  Database
                </Label>
                <Input
                  id="database"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="schema" className="text-right">
                  Schema
                </Label>
                <Input
                  id="schema"
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="warehouse" className="text-right">
                  Warehouse
                </Label>
                <Input
                  id="warehouse"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTestingConnection || isSubmitting}
              >
                {isTestingConnection ? (
                  <>
                    <span className="mr-2">Testing</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Saving</span>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SnowflakeConnectionManager;
