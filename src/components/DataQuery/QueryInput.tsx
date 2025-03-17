import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { toast } from 'sonner';
import { ProcessingMode, QueryResult } from '@/pages/DataQuery';
import { processQueryWithAI } from '@/services/dataQueryService';
import { Sparkles, Database, Loader2 } from 'lucide-react';
import { isDatabaseConnected } from '@/services/databaseService';

interface QueryInputProps {
  schema: string;
  onQueryProcessed: (result: QueryResult) => void;
  isProcessing: boolean;
  setIsProcessing: (value: boolean) => void;
}

const QueryInput: React.FC<QueryInputProps> = ({ 
  schema, 
  onQueryProcessed, 
  isProcessing, 
  setIsProcessing 
}) => {
  const { apiKey } = useApiKey();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ProcessingMode>('generate');

  const isDatabaseConnected = isDatabaseConnected();

  const handleSubmit = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await processQueryWithAI(apiKey, query, mode, schema);
      onQueryProcessed(result);
      
      if (!isDatabaseConnected) {
        if (mode === 'generate') {
          toast.success('SQL query generated successfully!');
        } else if (mode === 'optimize') {
          toast.success('SQL query optimized successfully!');
        } else if (mode === 'analyze') {
          toast.success('SQL query analyzed successfully!');
        } else {
          toast.success('Follow-up queries generated successfully!');
        }
      } else {
        toast.success('Query processed and executed successfully!');
      }
    } catch (error) {
      console.error('Error processing query:', error);
      toast.error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const examples = [
    "Show me the top 10 customers by revenue in the last quarter",
    "List all products with inventory less than 20 units",
    "What was the average order value by month in 2023?",
    "Show sales by region compared to last year"
  ];

  const cardTitle = isDatabaseConnected ? 
    "SQL Query Generator & Executor" : 
    "SQL Query Generator";

  const cardDescription = isDatabaseConnected ? 
    "Enter your question in natural language, and we'll convert it to SQL and execute it" : 
    "Enter your question in natural language, and we'll convert it to SQL";

  const getButtonText = () => {
    if (isProcessing) return "Processing";
    
    switch (mode) {
      case 'generate': return "Generate SQL";
      case 'optimize': return "Optimize SQL";
      case 'analyze': return "Analyze SQL";
      case 'followup': return "Generate Follow-ups";
      default: return "Process Query";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>
          {cardDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="e.g., Show me the top 10 customers by revenue in the last quarter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[120px] mb-2"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Examples:</span>
            {examples.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="text-sm text-blue-500 hover:underline"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium">Processing Mode</label>
            <Select value={mode} onValueChange={(value) => setMode(value as ProcessingMode)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generate">Generate SQL</SelectItem>
                <SelectItem value="optimize">Optimize SQL</SelectItem>
                <SelectItem value="analyze">Analyze SQL</SelectItem>
                <SelectItem value="followup">Suggest Follow-ups</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              disabled={isProcessing || !query.trim()} 
              onClick={handleSubmit}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> {getButtonText()}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QueryInput;
