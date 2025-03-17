
import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Database, Server, Snowflake, ChevronRight, Folder, Table2, Trash2, Loader2 } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { toast } from 'sonner';
import { 
  getDatabases, 
  getSchemas, 
  getTables, 
  Database as DatabaseType, 
  DatabaseSchema,
  DatabaseTable,
  getConnectionConfig,
  disconnectDatabase
} from '@/services/databaseService';

interface DatabaseNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTableSelect?: (database: string, schema: string, table: DatabaseTable) => void;
}

const DatabaseNavigation: React.FC<DatabaseNavigationProps> = ({ 
  open, 
  onOpenChange,
  onTableSelect
}) => {
  const { apiKey } = useApiKey();
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState<DatabaseType[]>([]);
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  
  const connectionConfig = getConnectionConfig();
  
  useEffect(() => {
    // Load databases when the sheet is opened
    if (open && apiKey) {
      loadDatabases();
    }
  }, [open, apiKey]);
  
  const loadDatabases = async () => {
    setLoading(true);
    try {
      const result = await getDatabases(apiKey);
      setDatabases(result);
      // Reset selections
      setSelectedDatabase(null);
      setSelectedSchema(null);
      setTables([]);
    } catch (error) {
      console.error("Error loading databases:", error);
      toast.error("Failed to load databases");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDatabaseSelect = async (dbName: string) => {
    setSelectedDatabase(dbName);
    setSelectedSchema(null);
    setTables([]);
    setLoading(true);
    
    try {
      const result = await getSchemas(apiKey, dbName);
      setSchemas(result);
    } catch (error) {
      console.error("Error loading schemas:", error);
      toast.error("Failed to load schemas");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSchemaSelect = async (schemaName: string) => {
    if (!selectedDatabase) return;
    
    setSelectedSchema(schemaName);
    setLoading(true);
    
    try {
      const result = await getTables(apiKey, selectedDatabase, schemaName);
      setTables(result);
    } catch (error) {
      console.error("Error loading tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTableSelect = (table: DatabaseTable) => {
    setSelectedTable(table);
    if (onTableSelect && selectedDatabase && selectedSchema) {
      onTableSelect(selectedDatabase, selectedSchema, table);
    }
  };
  
  const handleDisconnect = () => {
    disconnectDatabase();
    setDatabases([]);
    setSchemas([]);
    setTables([]);
    setSelectedDatabase(null);
    setSelectedSchema(null);
    setSelectedTable(null);
    onOpenChange(false);
  };
  
  const getDatabaseIcon = () => {
    switch (connectionConfig?.type) {
      case 'mongodb':
        return <Database className="h-5 w-5" />;
      case 'postgresql':
        return <Server className="h-5 w-5" />;
      case 'snowflake':
        return <Snowflake className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };
  
  const getDatabaseLabel = () => {
    switch (connectionConfig?.type) {
      case 'mongodb':
        return 'MongoDB';
      case 'postgresql':
        return 'PostgreSQL';
      case 'snowflake':
        return 'Snowflake';
      default:
        return 'Database';
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[350px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {getDatabaseIcon()}
            {getDatabaseLabel()} Explorer
          </SheetTitle>
          <SheetDescription>
            Browse databases, schemas, and tables
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">
              Connected to: <span className="text-primary">{connectionConfig?.host || 'Database'}</span>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              className="gap-1 text-xs h-8"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Databases */}
              <div>
                <h3 className="text-sm font-medium mb-2">Databases</h3>
                <div className="space-y-1">
                  {databases.length > 0 ? (
                    databases.map((db) => (
                      <Button
                        key={db.name}
                        variant={selectedDatabase === db.name ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2 text-sm h-9"
                        onClick={() => handleDatabaseSelect(db.name)}
                      >
                        <Database className="h-4 w-4" />
                        <span>{db.name}</span>
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-1 px-2">No databases found</p>
                  )}
                </div>
              </div>
              
              {/* Schemas (if a database is selected) */}
              {selectedDatabase && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Schemas</h3>
                  <div className="space-y-1">
                    {schemas.length > 0 ? (
                      schemas.map((schema) => (
                        <Button
                          key={schema.name}
                          variant={selectedSchema === schema.name ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2 text-sm h-9"
                          onClick={() => handleSchemaSelect(schema.name)}
                        >
                          <Folder className="h-4 w-4" />
                          <span>{schema.name}</span>
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-1 px-2">No schemas found</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Tables (if a schema is selected) */}
              {selectedSchema && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tables</h3>
                  <div className="space-y-1">
                    {tables.length > 0 ? (
                      tables.map((table) => (
                        <Button
                          key={table.name}
                          variant={selectedTable?.name === table.name ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2 text-sm h-9"
                          onClick={() => handleTableSelect(table)}
                        >
                          <Table2 className="h-4 w-4" />
                          <span>{table.name}</span>
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-1 px-2">No tables found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DatabaseNavigation;
