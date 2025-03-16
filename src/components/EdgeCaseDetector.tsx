
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, BarChart } from 'lucide-react';
import { formatData, downloadData } from '@/utils/fileUploadUtils';

interface EdgeCaseDetectorProps {
  loading: boolean;
  detectedEdgeCases: any[];
  targetColumn: string;
}

const EdgeCaseDetector: React.FC<EdgeCaseDetectorProps> = ({
  loading,
  detectedEdgeCases,
  targetColumn
}) => {
  const handleExport = () => {
    if (detectedEdgeCases.length > 0) {
      const formattedData = formatData(detectedEdgeCases, 'json');
      downloadData(formattedData, 'detected_edge_cases', 'json');
    }
  };

  // Get a sample of columns for display, excluding long text fields
  const getSampleColumns = () => {
    if (detectedEdgeCases.length === 0) return [];
    
    const allColumns = Object.keys(detectedEdgeCases[0]);
    // Filter out the target column, score, confidence, and reason as they're displayed separately
    return allColumns.filter(col => 
      col !== targetColumn && 
      col !== 'score' && 
      col !== 'confidence' && 
      col !== 'reason' &&
      typeof detectedEdgeCases[0][col] !== 'object'
    ).slice(0, 3); // Limit to 3 additional columns for readability
  };
  
  const sampleColumns = getSampleColumns();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Detecting Edge Cases...
          </CardTitle>
          <CardDescription>
            Analyzing your dataset to identify potential edge cases
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

  if (detectedEdgeCases.length === 0) {
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
            <h3 className="text-lg font-medium">No Edge Cases Detected</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Click the "Detect Edge Cases" button to begin analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Detected Edge Cases
          </CardTitle>
          <CardDescription>
            {detectedEdgeCases.length} potential edge cases found in your dataset
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Score</TableHead>
                <TableHead>Target ({targetColumn})</TableHead>
                {sampleColumns.map(col => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
                <TableHead>Confidence</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detectedEdgeCases.map((item, index) => {
                // Calculate a color for the score (red for high scores, green for low)
                const score = parseFloat(item.score);
                const scoreColor = score > 75 ? 'bg-red-100 text-red-800' : 
                                   score > 50 ? 'bg-amber-100 text-amber-800' : 
                                   'bg-green-100 text-green-800';
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`font-medium ${scoreColor}`}
                      >
                        {item.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item[targetColumn]}
                    </TableCell>
                    {sampleColumns.map(col => (
                      <TableCell key={col}>
                        {typeof item[col] === 'object' 
                          ? JSON.stringify(item[col]).substring(0, 20) + '...'
                          : String(item[col]).substring(0, 20)}
                      </TableCell>
                    ))}
                    <TableCell>{item.confidence}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {detectedEdgeCases.length} edge cases
          </div>
          <Button size="sm" variant="ghost">
            <BarChart className="mr-2 h-4 w-4" />
            View Visualizations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EdgeCaseDetector;
