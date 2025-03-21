
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Database, BarChart4 } from 'lucide-react';

interface SyntheticDataGeneratorAdapterProps {
  generatedData: any[];
  isLoading: boolean;
  handleExport: () => void;
  isExporting: boolean;
}

const SyntheticDataGeneratorAdapter: React.FC<SyntheticDataGeneratorAdapterProps> = ({
  generatedData,
  isLoading,
  handleExport,
  isExporting
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5 text-blue-500" />
          Generated Data
        </CardTitle>
        <CardDescription>
          Results of data augmentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full"></div>
          </div>
        ) : generatedData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{generatedData.length} records generated</h3>
              <div className="flex items-center">
                <BarChart4 className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-muted-foreground">Data Preview</span>
              </div>
            </div>
            
            <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(generatedData.slice(0, 3), null, 2)}
                {generatedData.length > 3 && '\n\n... and ' + (generatedData.length - 3) + ' more records'}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No Data Generated</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Use the tools in the other tabs to generate augmented data
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleExport}
          disabled={isExporting || generatedData.length === 0}
        >
          {isExporting ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary animate-spin rounded-full mr-2"></div>
              Exporting...
            </span>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Generated Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SyntheticDataGeneratorAdapter;
