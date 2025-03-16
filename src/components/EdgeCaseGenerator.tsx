
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Download, CheckCircle, XCircle, Sparkles, Loader } from 'lucide-react';
import { formatData, downloadData } from '@/utils/fileUploadUtils';
import { toast } from 'sonner';

interface EdgeCaseGeneratorProps {
  loading: boolean;
  generatedEdgeCases: any[];
  edgeCaseType: string;
  targetColumn: string;
}

const EdgeCaseGenerator: React.FC<EdgeCaseGeneratorProps> = ({
  loading,
  generatedEdgeCases,
  edgeCaseType,
  targetColumn
}) => {
  const [validatedCases, setValidatedCases] = React.useState<Record<number, boolean>>({});
  const [exporting, setExporting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const handleExport = () => {
    if (generatedEdgeCases.length > 0) {
      setExporting(true);
      setTimeout(() => {
        const formattedData = formatData(generatedEdgeCases, 'json');
        downloadData(formattedData, 'synthetic_edge_cases', 'json');
        setExporting(false);
        toast.success('Edge cases exported successfully');
      }, 800);
    }
  };

  const handleValidate = (index: number, isValid: boolean) => {
    setValidatedCases(prev => ({
      ...prev,
      [index]: isValid
    }));
  };

  const handleExportValidCases = () => {
    setExporting(true);
    setTimeout(() => {
      const validCasesIndices = Object.entries(validatedCases)
        .filter(([_, isValid]) => isValid)
        .map(([index]) => parseInt(index));
      
      if (validCasesIndices.length === 0) {
        toast.error('No valid cases selected for export');
        setExporting(false);
        return;
      }
      
      const validCases = validCasesIndices.map(index => generatedEdgeCases[index]);
      const formattedData = formatData(validCases, 'json');
      downloadData(formattedData, 'valid_synthetic_edge_cases', 'json');
      setExporting(false);
      toast.success(`${validCasesIndices.length} valid cases exported`);
    }, 800);
  };

  const handleGenerateMore = () => {
    setGenerating(true);
    // Simulate generating more edge cases
    setTimeout(() => {
      toast.success('Additional edge cases generated');
      setGenerating(false);
    }, 1000);
  };

  // Get a sample of columns for display, excluding long text fields
  const getSampleColumns = () => {
    if (generatedEdgeCases.length === 0) return [];
    
    const allColumns = Object.keys(generatedEdgeCases[0]);
    // Filter out metadata fields
    return allColumns.filter(col => 
      col !== targetColumn && 
      col !== 'synthetic' && 
      col !== 'confidence' && 
      col !== 'modification' &&
      col !== 'complexity' &&
      typeof generatedEdgeCases[0][col] !== 'object'
    ).slice(0, 3); // Limit to 3 additional columns for readability
  };
  
  const sampleColumns = getSampleColumns();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="mr-2 h-5 w-5 text-blue-500" />
            Generating Synthetic Edge Cases...
          </CardTitle>
          <CardDescription>
            Creating synthetic data points to test model boundaries
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

  if (generatedEdgeCases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="mr-2 h-5 w-5 text-blue-500" />
            Synthetic Edge Cases
          </CardTitle>
          <CardDescription>
            No synthetic edge cases have been generated yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No Synthetic Data</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Click the "Generate Synthetic Cases" button to create new edge cases
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
            <GitBranch className="mr-2 h-5 w-5 text-blue-500" />
            Synthetic Edge Cases
          </CardTitle>
          <CardDescription>
            {generatedEdgeCases.length} synthetic edge cases generated ({edgeCaseType} type)
          </CardDescription>
        </div>
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
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Complexity</TableHead>
                <TableHead>Target ({targetColumn})</TableHead>
                {sampleColumns.map(col => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
                <TableHead>Modification</TableHead>
                <TableHead>Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generatedEdgeCases.map((item, index) => {
                const complexity = item.complexity || 50;
                const complexityColor = complexity > 70 ? 'bg-red-100 text-red-800' : 
                                       complexity > 40 ? 'bg-amber-100 text-amber-800' : 
                                       'bg-blue-100 text-blue-800';
                
                const isValidated = validatedCases[index] !== undefined;
                const isValid = validatedCases[index];
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`font-medium ${complexityColor}`}
                      >
                        {complexity}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {item[targetColumn]}
                        <Sparkles className="h-3 w-3 text-amber-500" />
                      </div>
                    </TableCell>
                    {sampleColumns.map(col => (
                      <TableCell key={col}>
                        {typeof item[col] === 'object' 
                          ? JSON.stringify(item[col]).substring(0, 20) + '...'
                          : String(item[col]).substring(0, 20)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="max-w-xs truncate" title={item.modification}>
                        {item.modification}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant={isValidated && isValid ? "default" : "outline"} 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleValidate(index, true)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={isValidated && !isValid ? "destructive" : "outline"} 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleValidate(index, false)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportValidCases}
          disabled={exporting || Object.values(validatedCases).filter(Boolean).length === 0}
        >
          {exporting ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export Valid Cases
        </Button>
        <Button 
          size="sm"
          onClick={handleGenerateMore}
          disabled={generating}
        >
          {generating ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate More
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EdgeCaseGenerator;
