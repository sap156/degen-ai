
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Code, Download } from 'lucide-react';

interface EdgeCaseReportAdapterProps {
  reportContent: string | null;
  implementationContent: string | null;
  reportLoading: boolean;
  implementationLoading: boolean;
  onGenerateReport: () => Promise<void>;
  onGenerateImplementation: () => Promise<void>;
  hasTestResults: boolean;
}

const EdgeCaseReportAdapter: React.FC<EdgeCaseReportAdapterProps> = ({
  reportContent,
  implementationContent,
  reportLoading,
  implementationLoading,
  onGenerateReport,
  onGenerateImplementation,
  hasTestResults
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edge Case Analysis Report</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="report" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Report</span>
            </TabsTrigger>
            <TabsTrigger value="implementation" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              <span>Implementation</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="report" className="space-y-4">
            {reportContent ? (
              <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: reportContent }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">{reportLoading ? 'Generating Report...' : 'No Report Generated'}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  {reportLoading 
                    ? 'Please wait while we generate your report' 
                    : 'Generate a detailed report about the detected edge cases'}
                </p>
                
                {!reportLoading && (
                  <Button 
                    onClick={onGenerateReport} 
                    className="mt-4"
                    disabled={!hasTestResults || reportLoading}
                  >
                    Generate Report
                  </Button>
                )}
                
                {reportLoading && (
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full mt-4"></div>
                )}
              </div>
            )}
            
            {reportContent && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {}}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="implementation" className="space-y-4">
            {implementationContent ? (
              <div className="border rounded-md p-4 max-h-96 overflow-y-auto bg-gray-50">
                <pre className="text-sm whitespace-pre-wrap">{implementationContent}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Code className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">{implementationLoading ? 'Generating Code...' : 'No Implementation Generated'}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  {implementationLoading 
                    ? 'Please wait while we generate the implementation guide' 
                    : 'Generate implementation guide for handling these edge cases'}
                </p>
                
                {!implementationLoading && (
                  <Button 
                    onClick={onGenerateImplementation} 
                    className="mt-4"
                    disabled={!hasTestResults || implementationLoading}
                  >
                    Generate Implementation Guide
                  </Button>
                )}
                
                {implementationLoading && (
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full mt-4"></div>
                )}
              </div>
            )}
            
            {implementationContent && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {}}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Implementation Guide
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        AI-generated analysis and implementation recommendations
      </CardFooter>
    </Card>
  );
};

export default EdgeCaseReportAdapter;
