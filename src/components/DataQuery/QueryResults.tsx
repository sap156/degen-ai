
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { QueryResult } from '@/types/dataQuery';

interface QueryResultsProps {
  queryResult: QueryResult;
}

const QueryResults: React.FC<QueryResultsProps> = ({ queryResult }) => {
  // Use optional chaining to safely access results property
  const results = queryResult.results || [];
  
  // If no results are available
  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Query Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No Results Available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This query doesn't have any results to display
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get column names from the first result object
  const columns = Object.keys(results[0]);

  const downloadResults = (format: 'json' | 'csv') => {
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      // CSV format
      const header = columns.join(',');
      const rows = results.map(row => 
        columns.map(col => {
          const value = row[col];
          // Handle values that might contain commas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );
      content = [header, ...rows].join('\n');
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    // Create and download the file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Results downloaded as ${fileExtension.toUpperCase()}`);
  };

  const copyResultsToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    toast.success('Results copied to clipboard as JSON');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Query Results</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadResults('csv')}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadResults('json')}>
            <Download className="mr-2 h-4 w-4" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={copyResultsToClipboard}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {row[column] !== null && row[column] !== undefined ? String(row[column]) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QueryResults;
