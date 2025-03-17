
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { QueryResult } from '@/pages/DataQuery';

interface QueryOutputProps {
  queryResult: QueryResult;
}

const QueryOutput: React.FC<QueryOutputProps> = ({ queryResult }) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadSql = (sql: string, filename: string) => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded`);
  };

  // Determine if each tab should be disabled
  const isOptimizedDisabled = !queryResult.optimizedSql;
  const isAnalysisDisabled = !queryResult.analysis;
  const isFollowupDisabled = !queryResult.followUpQueries?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SQL Query Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generated" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generated">Generated SQL</TabsTrigger>
            <TabsTrigger value="optimized" disabled={isOptimizedDisabled}>Optimized SQL</TabsTrigger>
            <TabsTrigger value="analysis" disabled={isAnalysisDisabled}>Analysis</TabsTrigger>
            <TabsTrigger value="followup" disabled={isFollowupDisabled}>Follow-ups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generated" className="space-y-4">
            <div className="relative">
              <Textarea
                value={queryResult.sql}
                readOnly
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(queryResult.sql, 'SQL query')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => downloadSql(queryResult.sql, 'generated-query.sql')}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="optimized" className="space-y-4">
            {queryResult.optimizedSql ? (
              <div className="relative">
                <Textarea
                  value={queryResult.optimizedSql}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => copyToClipboard(queryResult.optimizedSql || '', 'Optimized SQL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => downloadSql(queryResult.optimizedSql || '', 'optimized-query.sql')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                The query is already well-optimized or no optimization suggestions are available.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            {queryResult.analysis ? (
              <div className="prose max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: queryResult.analysis }} />
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No analysis available for this query
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="followup" className="space-y-4">
            {queryResult.followUpQueries && queryResult.followUpQueries.length > 0 ? (
              <div className="space-y-2">
                {queryResult.followUpQueries.map((query, index) => (
                  <div key={index} className="p-3 bg-muted rounded-md flex justify-between items-center">
                    <div>{query}</div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(query, 'Follow-up query')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No follow-up queries available
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QueryOutput;
