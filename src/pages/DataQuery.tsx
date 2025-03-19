
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QueryInput from '@/components/DataQuery/QueryInput';
import QueryOutput from '@/components/DataQuery/QueryOutput';
import SchemaUploader from '@/components/DataQuery/SchemaUploader';
import QueryResults from '@/components/DataQuery/QueryResults';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useApiKey } from '@/contexts/ApiKeyContext';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { InfoIcon } from 'lucide-react';
import UserGuideDataQuery from '@/components/ui/UserGuideDataQuery';

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
  
  // DB connection is disabled
  const isConnected = false;

  // When a successful query is processed, switch to results tab if database is connected
  const handleQuerySuccess = (result: QueryResult) => {
    setQueryResult(result);
    // Only switch to results tab if the database is connected
    if (isConnected) {
      setActiveTab('results');
    }
    setIsProcessing(false);
  };

  // Handle schema detection from database explorer
  const handleSchemaDetected = (detectedSchema: string) => {
    setSchema(detectedSchema);
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
            <Alert variant="warning">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Database Connection Disabled</AlertTitle>
              <AlertDescription>
                The database connection feature is currently unavailable. 
                You can still use the SQL query generation with your schema.
              </AlertDescription>
            </Alert>
            
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
            
            {/* User Guide */}
            <UserGuideDataQuery />
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Always show the simplified view without tabs now that DB is disabled */}
            <QueryInput 
              schema={schema}
              onQueryProcessed={handleQuerySuccess}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
            
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
