
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileText, Download, AlertTriangle, GitBranch, BarChart3, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatData, downloadData } from '@/utils/fileUploadUtils';

interface EdgeCaseReportProps {
  loading: boolean;
  detectedEdgeCases: any[];
  generatedEdgeCases: any[];
  testResults: any | null;
  targetColumn: string;
}

const EdgeCaseReport: React.FC<EdgeCaseReportProps> = ({
  loading,
  detectedEdgeCases,
  generatedEdgeCases,
  testResults,
  targetColumn
}) => {
  // Function to generate and download a comprehensive report
  const handleExportReport = () => {
    // Prepare a report object with all findings
    const report = {
      summary: {
        detectedCount: detectedEdgeCases.length,
        generatedCount: generatedEdgeCases.length,
        targetColumn,
        robustnessScore: testResults?.robustnessScore || 'N/A',
        timestamp: new Date().toISOString()
      },
      detectedEdgeCases: detectedEdgeCases.map(item => ({
        target: item[targetColumn],
        score: item.score,
        confidence: item.confidence,
        reason: item.reason
      })),
      generatedEdgeCases: generatedEdgeCases.map(item => ({
        target: item[targetColumn],
        complexity: item.complexity,
        modification: item.modification
      })),
      testResults: testResults ? {
        overallAccuracy: testResults.overallAccuracy,
        edgeCaseAccuracy: testResults.edgeCaseAccuracy,
        falsePositives: testResults.falsePositives,
        falseNegatives: testResults.falseNegatives,
        robustnessScore: testResults.robustnessScore,
        impactedFeatures: testResults.impactedFeatures,
        recommendations: testResults.recommendations
      } : null
    };
    
    const formattedData = formatData([report], 'json');
    downloadData(formattedData, 'edge_case_report', 'json');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-green-500" />
            Generating Report...
          </CardTitle>
          <CardDescription>
            Compiling edge case analysis results
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

  const hasData = detectedEdgeCases.length > 0 || generatedEdgeCases.length > 0 || testResults;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-green-500" />
            Edge Case Report
          </CardTitle>
          <CardDescription>
            No report data available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No Report Data</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              First detect edge cases, generate synthetic samples, or test your model
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
            <FileText className="mr-2 h-5 w-5 text-green-500" />
            Edge Case Analysis Report
          </CardTitle>
          <CardDescription>
            Summary of all edge case findings and recommendations
          </CardDescription>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Full Report
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-medium">Detected</h3>
                </div>
                <p className="text-2xl font-semibold">{detectedEdgeCases.length}</p>
                <p className="text-xs text-muted-foreground mt-1">edge cases</p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-medium">Generated</h3>
                </div>
                <p className="text-2xl font-semibold">{generatedEdgeCases.length}</p>
                <p className="text-xs text-muted-foreground mt-1">synthetic samples</p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-sm font-medium">Robustness</h3>
                </div>
                <p className="text-2xl font-semibold">{testResults?.robustnessScore || 'N/A'}</p>
                <p className="text-xs text-muted-foreground mt-1">out of 10</p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h3 className="text-sm font-medium">Target</h3>
                </div>
                <p className="text-lg font-semibold truncate">{targetColumn}</p>
                <p className="text-xs text-muted-foreground mt-1">variable</p>
              </CardContent>
            </Card>
          </div>
          
          {detectedEdgeCases.length > 0 && (
            <>
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Top Edge Cases</h3>
                <div className="space-y-2">
                  {detectedEdgeCases.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50">{item.score}</Badge>
                        <span className="text-sm font-medium">{item[targetColumn]}</span>
                      </div>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {item.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {testResults && (
            <>
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Key Findings</h3>
                <div className="border rounded-md p-4 bg-muted/50 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />
                      <p className="text-sm font-medium">Performance Impact</p>
                    </div>
                    <p className="text-sm">
                      Regular data accuracy: <span className="font-medium">{testResults.overallAccuracy}%</span>, 
                      Edge case accuracy: <span className="font-medium">{testResults.edgeCaseAccuracy}%</span>
                      <br />
                      <span className="text-muted-foreground">
                        Accuracy drop of {(Number(testResults.overallAccuracy) - Number(testResults.edgeCaseAccuracy)).toFixed(1)}% on edge cases
                      </span>
                    </p>
                  </div>
                  
                  {testResults.impactedFeatures && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-medium">Most Impacted Features</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {testResults.impactedFeatures.map((feature: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-blue-50">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {testResults?.recommendations && (
            <>
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Top Recommendations</h3>
                <div className="border rounded-md p-4 bg-green-50 space-y-2">
                  {testResults.recommendations.slice(0, 3).map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Detailed Report
        </Button>
        <Button size="sm" variant="secondary">
          <CheckCircle className="mr-2 h-4 w-4" />
          Apply Recommendations
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EdgeCaseReport;
