
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Download, Play } from 'lucide-react';
import { SnowflakeConnection } from './SnowflakeConnectionManager';
import { supabase } from '@/integrations/supabase/client';

interface SnowflakeSqlEditorProps {
  selectedConnection: SnowflakeConnection;
}

interface QueryResult {
  data?: any;
  error?: string;
  details?: string;
}

// Function to clean Snowflake account identifier
const cleanSnowflakeAccountId = (accountId: string): string => {
  // Remove protocol if present
  let cleaned = accountId.replace(/^https?:\/\//, '');
  
  // Remove .snowflakecomputing.com if present
  cleaned = cleaned.replace(/\.snowflakecomputing\.com.*$/, '');
  
  return cleaned;
};

const SnowflakeSqlEditor: React.FC<SnowflakeSqlEditorProps> = ({ selectedConnection }) => {
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT current_timestamp();');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [resultColumns, setResultColumns] = useState<string[]>([]);
  const [resultRows, setResultRows] = useState<any[]>([]);

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query');
      return;
    }

    setIsExecuting(true);
    setQueryResult(null);
    setResultColumns([]);
    setResultRows([]);

    try {
      // Clean the account identifier
      const cleanedAccountId = cleanSnowflakeAccountId(selectedConnection.account_identifier);
      
      // Prepare the credentials object from the selected connection
      const credentials = {
        account: cleanedAccountId,
        username: selectedConnection.username,
        password: selectedConnection.password,
        database: selectedConnection.database_name,
        schema: selectedConnection.schema_name,
        warehouse: selectedConnection.warehouse
      };

      // Call the Snowflake Edge Function
      const { data, error } = await supabase.functions.invoke('snowflake-query', {
        body: {
          sql: sqlQuery,
          credentials
        }
      });

      if (error) {
        throw new Error(error.message || 'Error executing query');
      }

      setQueryResult(data);

      if (data && data.resultSetMetaData && data.data) {
        // Extract column names from metadata
        const columns = data.resultSetMetaData.rowType.map((col: any) => col.name);
        setResultColumns(columns);

        // Extract rows from data
        setResultRows(data.data);
        
        toast.success(`Query executed successfully. ${data.data.length} rows returned.`);
      } else if (data && !data.error) {
        toast.success('Query executed successfully. No rows returned.');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error executing SQL query:', error);
      setQueryResult({ error: 'Failed to execute query', details: error.message });
      toast.error(`Failed to execute query: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadResults = () => {
    if (!resultColumns.length || !resultRows.length) {
      toast.error('No results to download');
      return;
    }

    try {
      // Create CSV content
      const csvHeader = resultColumns.join(',');
      const csvRows = resultRows.map(row => {
        return row.map((cell: any) => {
          // Handle cells that might contain commas or quotes
          if (cell === null || cell === undefined) return '';
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',');
      });
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `snowflake-results-${new Date().toISOString().slice(0, 19)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Results downloaded as CSV');
    } catch (error) {
      console.error('Error downloading results:', error);
      toast.error('Failed to download results');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Snowflake SQL Editor</CardTitle>
          <CardDescription>
            Connected to: {selectedConnection.connection_name} ({selectedConnection.database_name}.{selectedConnection.schema_name})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter SQL query..."
            className="font-mono text-sm h-48"
            spellCheck={false}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setSqlQuery('')}>
            Clear
          </Button>
          <div className="flex gap-2">
            {queryResult && resultRows.length > 0 && (
              <Button 
                onClick={downloadResults}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            )}
            <Button 
              onClick={executeQuery} 
              disabled={isExecuting || !sqlQuery.trim()}
              className="gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Query
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {queryResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              Query Results
              {resultRows.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({resultRows.length} rows)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queryResult.error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                <p className="font-medium">Error: {queryResult.error}</p>
                {queryResult.details && (
                  <p className="mt-2 text-sm">{queryResult.details}</p>
                )}
              </div>
            ) : resultRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      {resultColumns.map((column, index) => (
                        <th key={index} className="py-2 px-3 text-left font-medium text-sm">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b">
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="py-2 px-3 text-sm">
                            {cell === null ? 'NULL' : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Query executed successfully. No results to display.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SnowflakeSqlEditor;
