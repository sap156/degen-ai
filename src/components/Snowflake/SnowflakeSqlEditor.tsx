
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Play, ClipboardCopy, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SnowflakeConnection } from './SnowflakeConnectionManager';

interface SnowflakeSqlEditorProps {
  selectedConnection: SnowflakeConnection | null;
}

interface QueryResult {
  data: any[];
  columns: string[];
  error?: string;
}

const SnowflakeSqlEditor: React.FC<SnowflakeSqlEditorProps> = ({ selectedConnection }) => {
  const [sql, setSql] = useState<string>('SELECT * FROM INFORMATION_SCHEMA.TABLES LIMIT 10;');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  const handleExecuteQuery = async () => {
    if (!selectedConnection) {
      toast.error('Please select a Snowflake connection first');
      return;
    }

    if (!sql.trim()) {
      toast.error('SQL query cannot be empty');
      return;
    }

    setIsExecuting(true);
    setQueryResult(null);

    try {
      // Prepare the credentials for the Snowflake Edge Function
      const credentials = {
        account: selectedConnection.account_identifier,
        username: selectedConnection.username,
        password: selectedConnection.password,
        database: selectedConnection.database_name,
        schema: selectedConnection.schema_name,
        warehouse: selectedConnection.warehouse
      };

      // Call the Snowflake Edge Function
      const response = await supabase.functions.invoke('snowflake-query', {
        body: {
          sql,
          credentials
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Query execution failed');
      }

      // Process the query result
      if (response.data.error) {
        setQueryResult({
          data: [],
          columns: [],
          error: response.data.error
        });
        toast.error('Query execution failed');
      } else {
        // Process successful result - format depends on Snowflake API response structure
        // This will need to be adjusted based on actual response format
        const resultData = processSnowflakeResult(response.data);
        setQueryResult(resultData);
        toast.success('Query executed successfully');
      }
    } catch (error) {
      console.error('Error executing Snowflake query:', error);
      setQueryResult({
        data: [],
        columns: [],
        error: error.message || 'An unknown error occurred'
      });
      toast.error('Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  };

  // Helper function to process Snowflake API result
  const processSnowflakeResult = (apiResponse: any): QueryResult => {
    // Check if the response contains result data
    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data.rows)) {
      return { 
        data: [], 
        columns: [], 
        error: 'Invalid response format from Snowflake API' 
      };
    }

    try {
      // Extract column information
      const columns = apiResponse.data.rowType
        ? apiResponse.data.rowType.map((col: any) => col.name || 'COLUMN')
        : [];

      // Extract row data
      const data = apiResponse.data.rows.map((row: any) => {
        // If row is an array, map it to an object with column names as keys
        if (Array.isArray(row)) {
          return row.reduce((obj: any, val: any, index: number) => {
            obj[columns[index] || `Column ${index}`] = val;
            return obj;
          }, {});
        }
        return row;
      });

      return {
        data,
        columns
      };
    } catch (error) {
      console.error('Error processing Snowflake result:', error);
      return {
        data: [],
        columns: [],
        error: 'Failed to process query result'
      };
    }
  };

  const handleCopyToClipboard = () => {
    if (!queryResult || !queryResult.data || queryResult.data.length === 0) {
      toast.error('No data to copy');
      return;
    }

    try {
      // Convert result to CSV format
      const headers = queryResult.columns.join(',');
      const rows = queryResult.data.map(row => 
        queryResult.columns.map(col => JSON.stringify(row[col] || '')).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      navigator.clipboard.writeText(csv);
      toast.success('Results copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy results');
    }
  };

  const handleDownloadResults = () => {
    if (!queryResult || !queryResult.data || queryResult.data.length === 0) {
      toast.error('No data to download');
      return;
    }

    try {
      // Convert result to CSV format
      const headers = queryResult.columns.join(',');
      const rows = queryResult.data.map(row => 
        queryResult.columns.map(col => JSON.stringify(row[col] || '')).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `snowflake_result_${new Date().getTime()}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Results downloaded as CSV');
    } catch (error) {
      console.error('Error downloading results:', error);
      toast.error('Failed to download results');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Snowflake SQL Editor</CardTitle>
          <CardDescription>
            {selectedConnection
              ? `Connected to ${selectedConnection.connection_name} (${selectedConnection.database_name}.${selectedConnection.schema_name})`
              : 'Select a connection to execute queries'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="font-mono text-sm h-48 mb-4"
          />
          
          <div className="flex justify-between">
            <Button
              onClick={handleExecuteQuery}
              disabled={isExecuting || !selectedConnection}
              className="gap-2"
            >
              {isExecuting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Execute Query
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyToClipboard}
                disabled={!queryResult || queryResult.data.length === 0}
              >
                <ClipboardCopy className="h-4 w-4 mr-2" />
                Copy Results
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownloadResults}
                disabled={!queryResult || queryResult.data.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {queryResult && queryResult.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error executing query</AlertTitle>
          <AlertDescription className="font-mono text-xs whitespace-pre-wrap">{queryResult.error}</AlertDescription>
        </Alert>
      )}

      {queryResult && queryResult.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>
              {queryResult.data.length} rows returned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {queryResult.columns.map((column, index) => (
                      <TableHead key={index}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResult.data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {queryResult.columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          {typeof row[column] === 'object' 
                            ? JSON.stringify(row[column]) 
                            : String(row[column] !== undefined ? row[column] : '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {queryResult && queryResult.data.length === 0 && !queryResult.error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">No results returned</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SnowflakeSqlEditor;
