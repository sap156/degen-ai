
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
import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';
import SnowflakeConnectionManager, { SnowflakeConnection } from '@/components/Snowflake/SnowflakeConnectionManager';
import SnowflakeSqlEditor from '@/components/Snowflake/SnowflakeSqlEditor';
import SnowflakeConnectComponent from '@/components/DataQuery/SnowflakeConnectComponent';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const { user } = useAuth();
  const [schema, setSchema] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('query');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<SnowflakeConnection | null>(null);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  
  // When a successful query is processed, switch to results tab if database is connected
  const handleQuerySuccess = (result: QueryResult) => {
    setQueryResult(result);
    // Only switch to results tab if the database is connected
    if (selectedConnection) {
      setActiveTab('results');
    }
    setIsProcessing(false);
  };

  // Handle schema detection from database explorer
  const handleSchemaDetected = (detectedSchema: string) => {
    setSchema(detectedSchema);
  };
  
  // Handle selecting a Snowflake connection
  const handleConnectionSelect = (connection: SnowflakeConnection) => {
    setSelectedConnection(connection);
    setIsConnectionDialogOpen(false);
    // Switch to Snowflake tab when a connection is selected
    setActiveTab('snowflake');
  };

  // Handle click on Connect to Snowflake button
  const handleConnectClick = () => {
    setIsConnectionDialogOpen(true);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Query Service</h1>
        <p className="text-muted-foreground">
          Convert natural language to SQL queries, optimize them, analyze results, and get follow-up suggestions.
        </p>
      </div>

      {!user ? (
        <AuthRequirement showUserGuide={<UserGuideDataQuery />} />
      ) : !isKeySet ? (
        <ApiKeyRequirement />
      ) : (
        <>
          {/* Fixed the Tabs components to properly handle RovingFocusGroup */}
          <Tabs defaultValue="query" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="query">AI SQL Generator</TabsTrigger>
              <TabsTrigger value="snowflake">Snowflake</TabsTrigger>
            </TabsList>
            
            <TabsContent value="query" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-1 space-y-6">
                  <SnowflakeConnectComponent onConnectClick={handleConnectClick} />
                  
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
                </div>

                <div className="md:col-span-2 space-y-6">
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
            </TabsContent>
            
            <TabsContent value="snowflake" className="space-y-6">
              {selectedConnection ? (
                <SnowflakeSqlEditor selectedConnection={selectedConnection} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <h2 className="text-xl font-bold mb-2">No Snowflake Connection Selected</h2>
                  <p className="text-muted-foreground mb-4">
                    Please select or create a Snowflake connection to continue
                  </p>
                  <button
                    onClick={handleConnectClick}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Manage Connections
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Connection Manager Dialog */}
          <Dialog open={isConnectionDialogOpen} onOpenChange={setIsConnectionDialogOpen}>
            <DialogContent className="max-w-4xl">
              <SnowflakeConnectionManager 
                onConnectionSelect={handleConnectionSelect}
                selectedConnectionId={selectedConnection?.id}
                embedded={true}
              />
            </DialogContent>
          </Dialog>
          
          {/* Add the user guide at the bottom of the page */}
          <UserGuideDataQuery />
        </>
      )}
    </div>
  );
};

export default DataQuery;
