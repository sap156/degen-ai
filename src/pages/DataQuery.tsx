
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QueryInput from '@/components/DataQuery/QueryInput';
import QueryOutput from '@/components/DataQuery/QueryOutput';
import SchemaUploader from '@/components/DataQuery/SchemaUploader';
import QueryResults from '@/components/DataQuery/QueryResults';
import DatabaseConnectionPlaceholder from '@/components/DataQuery/DatabaseConnectionPlaceholder';
import { useApiKey } from '@/contexts/ApiKeyContext';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';

// Types for the SQL Query Service
export interface QueryResult {
  sql: string;
  optimizedSql?: string;
  analysis?: string;
  followUpQueries?: string[];
  results?: any[];
  error?: string;
}

export type ProcessingMode = 'generate' | 'optimize' | 'analyze' | 'followup';

const DataQuery = () => {
  const { apiKey, isKeySet } = useApiKey();
  const [schema, setSchema] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState('query');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Database connection is not available yet (will be implemented in future)
  const isDatabaseConnected = false;

  // When a successful query is processed, switch to results tab if database is connected
  const handleQuerySuccess = (result: QueryResult) => {
    setQueryResult(result);
    // Only switch to results tab if the database is connected
    if (isDatabaseConnected) {
      setActiveTab('results');
    }
    setIsProcessing(false);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Query Service</h1>
        <p className="text-muted-foreground">
          Convert natural language to SQL queries, optimize them, analyze results, and get follow-up suggestions.
        </p>
      </div>

      {!isKeySet ? (
        <ApiKeyRequirement />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Schema</CardTitle>
                <CardDescription>
                  Upload your database schema or sample data to improve SQL generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SchemaUploader schema={schema} setSchema={setSchema} />
              </CardContent>
            </Card>
            
            <DatabaseConnectionPlaceholder />
          </div>

          <div className="md:col-span-2 space-y-6">
            {isDatabaseConnected ? (
              // Only show tabs if database is connected
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="query">Query</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>
                
                <TabsContent value="query" className="space-y-4">
                  <QueryInput 
                    schema={schema}
                    onQueryProcessed={handleQuerySuccess}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                </TabsContent>
                
                <TabsContent value="results" className="space-y-4">
                  {queryResult ? (
                    <QueryResults queryResult={queryResult} />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>No Results Yet</CardTitle>
                        <CardDescription>
                          Enter a query in the Query tab to see results here
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              // If database is not connected, just show the query input without tabs
              <QueryInput 
                schema={schema}
                onQueryProcessed={handleQuerySuccess}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            )}
            
            {queryResult && (
              <QueryOutput queryResult={queryResult} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQuery;
