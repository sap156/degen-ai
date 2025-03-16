
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, BarChart, Loader, Plus } from 'lucide-react';
import { formatData, downloadData } from '@/utils/fileUploadUtils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [exporting, setExporting] = useState(false);
  const [visualizationsOpen, setVisualizationsOpen] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);

  const handleExport = () => {
    if (detectedEdgeCases.length > 0) {
      setExporting(true);
      setTimeout(() => {
        const formattedData = formatData(detectedEdgeCases, 'json');
        downloadData(formattedData, 'detected_edge_cases', 'json');
        setExporting(false);
        toast.success('Edge cases exported successfully');
      }, 800);
    }
  };

  const handleGenerateMore = () => {
    setGeneratingMore(true);
    // Simulate generating more edge cases
    setTimeout(() => {
      toast.success('More edge cases would be generated via the OpenAI API in a full implementation');
      setGeneratingMore(false);
    }, 1500);
  };

  // Get colors for scores
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800';
    if (score >= 50) return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
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
            <h3 className="text-lg font-medium">No Edge Cases</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Click the "Detect Edge Cases" button to identify anomalies in your dataset
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Visualizations component for the dialog
  const Visualizations = () => (
    <div className="space-y-8">
      {/* Score Distribution Chart */}
      <div>
        <h3 className="text-sm font-medium mb-4">Edge Case Score Distribution</h3>
        <div className="h-48 border rounded-md p-4">
          <div className="flex h-full items-end space-x-2">
            {detectedEdgeCases.map((item, index) => {
              const height = `${Math.max(15, Number(item.score))}%`;
              return (
                <div key={index} className="relative flex flex-col items-center flex-1">
                  <div 
                    className={`w-full rounded-t-sm ${getScoreColor(Number(item.score))}`} 
                    style={{ height }}
                  ></div>
                  <span className="text-xs mt-1">{item[targetColumn]?.toString().substring(0, 6)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confidence vs Score Scatter Plot */}
      <div>
        <h3 className="text-sm font-medium mb-4">Confidence vs Score</h3>
        <div className="h-64 border rounded-md p-4 relative">
          <div className="absolute inset-0 p-4">
            {/* Y-axis (confidence) */}
            <div className="absolute left-0 top-0 h-full w-px bg-gray-300"></div>
            <div className="absolute left-0 bottom-0 transform -translate-y-1/2 -translate-x-3">
              <span className="text-xs">0</span>
            </div>
            <div className="absolute left-0 top-0 transform translate-y-1/2 -translate-x-3">
              <span className="text-xs">1</span>
            </div>
            <span className="absolute left-0 top-1/2 transform -translate-x-6 -translate-y-1/2 -rotate-90 text-xs font-medium">
              Confidence
            </span>
            
            {/* X-axis (score) */}
            <div className="absolute left-0 bottom-0 w-full h-px bg-gray-300"></div>
            <div className="absolute left-0 bottom-0 transform -translate-y-3">
              <span className="text-xs">0</span>
            </div>
            <div className="absolute right-0 bottom-0 transform -translate-y-3">
              <span className="text-xs">100</span>
            </div>
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-5 text-xs font-medium">
              Edge Case Score
            </span>
            
            {/* Plot points */}
            {detectedEdgeCases.map((item, index) => {
              const x = `${Math.min(95, Math.max(5, Number(item.score)))}%`;
              const y = `${100 - Math.min(95, Math.max(5, Number(item.confidence) * 100))}%`;
              return (
                <div
                  key={index}
                  className="absolute w-3 h-3 rounded-full bg-blue-500 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: x, top: y }}
                  title={`${item[targetColumn]}: Score ${item.score}, Confidence ${item.confidence}`}
                ></div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateMore}
            disabled={generatingMore}
          >
            {generatingMore ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate More
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
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
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detectedEdgeCases.map((item, index) => (
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
                  <TableCell>
                    <div className="max-w-xs truncate" title={item.reason}>
                      {item.reason}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {detectedEdgeCases.length} edge cases
        </div>
        <Dialog open={visualizationsOpen} onOpenChange={setVisualizationsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <BarChart className="mr-2 h-4 w-4" />
              View Visualizations
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edge Case Visualizations</DialogTitle>
              <DialogDescription>
                Visual analysis of detected edge cases
              </DialogDescription>
            </DialogHeader>
            <Visualizations />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default EdgeCaseDetector;
