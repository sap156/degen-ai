
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Database, Server, KeyRound, Table2, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { 
  DatabaseTable, 
  executeQuery, 
  isDatabaseConnected,
  getConnectionConfig
} from '@/services/databaseService';
import DatabaseConnectionDialog from '../DatabaseConnectionDialog';
import DatabaseNavigation from '../DatabaseNavigation';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DatabaseExplorerProps {
  onSchemaDetected?: (schema: string) => void;
}

const DatabaseExplorer: React.FC<DatabaseExplorerProps> = ({ onSchemaDetected }) => {
  const { apiKey } = useApiKey();
  const [isConnected, setIsConnected] = useState<boolean>(isDatabaseConnected());
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [queryResults, setQueryResults] = useState<{columns: string[], rows: any[], message?: string} | null>(null);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('structure');
  
  const connectionConfig = getConnectionConfig();
  
  const handleConnectionSuccess = () => {
    setIsConnected(true);
    // Show the navigation panel after successful connection
    setIsNavigationOpen(true);
  };
  
  const handleTableSelect = async (database: string, schema: string, table: DatabaseTable) => {
    setSelectedTable(table);
    
    // Generate SQL schema for the selected table and send it to the parent component
    if (onSchemaDetected && table.columns) {
      const sqlSchema = generateSQLSchema(table);
      onSchemaDetected(sqlSchema);
    }
    
    // Switch to the Structure tab
    setActiveTab('structure');
    
    // Clear previous data
    setTableData(null);
    setQueryResults(null);
    
    // Auto-generate a SELECT query for the Table Data tab
    const selectQuery = generateSelectQuery(table);
    setCustomQuery(selectQuery);
  };
  
  const generateSQLSchema = (table: DatabaseTable): string => {
    // Create SQL CREATE TABLE statement from the table definition
    const columns = table.columns.map(col => {
      let columnDef = `  ${col.name} ${col.type}`;
      if (col.isPrimary) columnDef += ' PRIMARY KEY';
      if (!col.nullable) columnDef += ' NOT NULL';
      return columnDef;
    }).join(',\n');
    
    return `CREATE TABLE ${table.schema ? `${table.schema}.` : ''}${table.name} (\n${columns}\n);`;
  };
  
  const generateSelectQuery = (table: DatabaseTable): string => {
    // Create a simple SELECT query for the selected table
    return `SELECT * FROM ${table.schema ? `${table.schema}.` : ''}${table.name} LIMIT 100;`;
  };
  
  const handleViewData = async () => {
    if (!selectedTable || !apiKey) return;
    
    setIsLoadingData(true);
    
    try {
      // Generate a query to select data from the table
      const query = generateSelectQuery(selectedTable);
      
      // Execute the query
      const result = await executeQuery(
        apiKey, 
        query, 
        selectedTable.schema || ''
      );
      
      if (result.error) {
        toast.error(result.error);
      } else {
        setTableData(result.rows);
        setActiveTab('data');
      }
    } catch (error) {
      console.error("Error loading table data:", error);
      toast.error("Failed to load table data");
    } finally {
      setIsLoadingData(false);
    }
  };
  
  const handleRunQuery = async () => {
    if (!customQuery.trim() || !apiKey) {
      toast.error("Please enter a valid SQL query");
      return;
    }
    
    setIsRunningQuery(true);
    
    try {
      // Execute the custom query
      const result = await executeQuery(
        apiKey, 
        customQuery, 
        selectedTable?.schema || ''
      );
      
      if (result.error) {
        toast.error(result.error);
      } else {
        setQueryResults(result);
        toast.success(result.message || 'Query executed successfully');
      }
    } catch (error) {
      console.error("Error executing query:", error);
      toast.error("Failed to execute query");
    } finally {
      setIsRunningQuery(false);
    }
  };
  
  return (
    <>
      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span>Database Connection</span>
            </CardTitle>
            <CardDescription>
              Connect to your database to explore schemas and tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/30 border-dashed">
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    PostgreSQL
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    Connect to PostgreSQL databases for relational data.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/30 border-dashed">
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    MongoDB
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    Explore document-based MongoDB collections.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/30 border-dashed">
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    Snowflake
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    Query data from Snowflake cloud data platform.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setIsConnectionDialogOpen(true)} 
              variant="database"
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Connect Database
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {connectionConfig?.type === 'postgresql' && <Server className="h-5 w-5" />}
                {connectionConfig?.type === 'mongodb' && <Database className="h-5 w-5" />}
                {connectionConfig?.type === 'snowflake' && <Server className="h-5 w-5 text-blue-500" />}
                Connected Database
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsNavigationOpen(true)}
                className="gap-1 h-8"
              >
                <Search className="h-3.5 w-3.5" />
                Browse
              </Button>
            </div>
            <CardDescription>
              {connectionConfig?.host || 'Connected to database'}
              {connectionConfig?.database && ` • Database: ${connectionConfig.database}`}
            </CardDescription>
          </CardHeader>
          
          {selectedTable ? (
            <CardContent className="pb-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Table2 className="h-4 w-4" />
                  <h3 className="font-medium">{selectedTable.name}</h3>
                  {selectedTable.schema && (
                    <Badge variant="outline" className="ml-1">
                      {selectedTable.schema}
                    </Badge>
                  )}
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="structure">Structure</TabsTrigger>
                    <TabsTrigger value="data">Table Data</TabsTrigger>
                    <TabsTrigger value="query">Custom Query</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="structure" className="mt-4">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Attributes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTable.columns.map((column, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{column.name}</TableCell>
                              <TableCell>{column.type}</TableCell>
                              <TableCell>
                                {column.isPrimary && <Badge className="mr-1">Primary Key</Badge>}
                                {column.nullable === false && <Badge variant="outline">Not Null</Badge>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleViewData}
                        disabled={isLoadingData}
                        className="gap-1"
                      >
                        {isLoadingData ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5" />
                        )}
                        View Table Data
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="data" className="mt-4">
                    {tableData ? (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tableData.length > 0 && 
                                Object.keys(tableData[0]).map((key) => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {Object.values(row).map((value: any, cellIndex) => (
                                  <TableCell key={cellIndex}>
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground mb-2">No data loaded yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleViewData}
                          disabled={isLoadingData}
                          className="gap-1"
                        >
                          {isLoadingData ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Table2 className="h-3.5 w-3.5" />
                          )}
                          Load Table Data
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="query" className="mt-4">
                    <div className="space-y-4">
                      <Textarea
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder="Enter SQL query here..."
                        className="font-mono text-sm resize-none h-24"
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleRunQuery}
                          disabled={isRunningQuery || !customQuery.trim()}
                          size="sm"
                          className="gap-1"
                        >
                          {isRunningQuery ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Search className="h-3.5 w-3.5" />
                          )}
                          Run Query
                        </Button>
                      </div>
                      
                      {queryResults && (
                        <div className="border rounded-lg overflow-hidden mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {queryResults.columns.map((column) => (
                                  <TableHead key={column}>{column}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {queryResults.rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  {Object.values(row).map((value: any, cellIndex) => (
                                    <TableCell key={cellIndex}>
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Table2 className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No table selected</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Browse your database to select a table
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNavigationOpen(true)}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Browse Database
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
      
      <DatabaseConnectionDialog 
        open={isConnectionDialogOpen} 
        onOpenChange={setIsConnectionDialogOpen}
        onConnectionSuccess={handleConnectionSuccess}
      />
      
      <DatabaseNavigation 
        open={isNavigationOpen}
        onOpenChange={setIsNavigationOpen}
        onTableSelect={handleTableSelect}
      />
    </>
  );
};

export default DatabaseExplorer;
