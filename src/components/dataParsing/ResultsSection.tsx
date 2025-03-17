
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, List } from 'lucide-react';
import { ProcessingType } from '@/services/textProcessingService';

interface ResultsSectionProps {
  aiProcessingResults: Record<string, any>;
  onDownload: () => void;
  renderProcessingTypeIcon: (type: ProcessingType) => React.ReactNode;
  renderProcessingTypeLabel: (type: ProcessingType) => string;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  aiProcessingResults,
  onDownload,
  renderProcessingTypeIcon,
  renderProcessingTypeLabel
}) => {
  if (Object.keys(aiProcessingResults).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-3">
          <List className="h-16 w-16 text-muted-foreground mx-auto" />
          <h3 className="font-medium text-xl">No Results Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Process your data using the Analyze tab to see the results here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Processing Results</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Results
        </Button>
      </div>
      
      {Object.entries(aiProcessingResults).map(([processingType, result]) => (
        <Card key={processingType} className="border-muted">
          <CardHeader className="py-3">
            <CardTitle className="text-md flex items-center">
              {renderProcessingTypeIcon(processingType as ProcessingType)}
              <span className="ml-2">{renderProcessingTypeLabel(processingType as ProcessingType)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.format === 'json' && result.structured ? (
              <pre className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[400px] text-xs font-mono">
                {JSON.stringify(result.structured, null, 2)}
              </pre>
            ) : (
              <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[400px]">
                <p className="whitespace-pre-wrap font-mono text-xs">{result.raw}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ResultsSection;
