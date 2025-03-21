
import React from 'react';
import { AlertTriangle, Download, BarChart, Loader, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EdgeCaseDetectorAdapterProps {
  isLoading: boolean;
  edgeCases: any[];
  targetColumn: string;
}

const EdgeCaseDetectorAdapter: React.FC<EdgeCaseDetectorAdapterProps> = ({
  isLoading,
  edgeCases,
  targetColumn
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Detecting Edge Cases...
          </CardTitle>
          <CardDescription>
            Analyzing dataset for anomalies and edge cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (edgeCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Edge Case Detection
          </CardTitle>
          <CardDescription>
            No edge cases have been detected yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No Edge Cases</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Click the "Detect Edge Cases" button to identify anomalies in your dataset
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800';
    if (score >= 50) return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Detected Edge Cases
          </CardTitle>
          <CardDescription>
            {edgeCases.length} potential edge cases found in your dataset
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toast.success('More edge cases would be generated via the OpenAI API in a full implementation')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate More
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toast.success('Edge cases would be exported in a full implementation')}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Score</TableHead>
                <TableHead>Target ({targetColumn})</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="w-full">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edgeCases.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`font-medium ${getScoreColor(Number(item.score))}`}
                    >
                      {item.score}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item[targetColumn]}</TableCell>
                  <TableCell>{item.confidence}</TableCell>
                  <TableCell className="break-words whitespace-normal max-w-xl">
                    {item.reason}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {edgeCases.length} edge cases
        </div>
        <Button variant="outline" size="sm">
          <BarChart className="mr-2 h-4 w-4" />
          View Visualizations
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EdgeCaseDetectorAdapter;
