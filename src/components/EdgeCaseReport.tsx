import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileText, Download, AlertTriangle, GitBranch, BarChart3, CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatData, downloadData } from '@/utils/fileUploadUtils';
import { toast } from 'sonner';
import { edgeCaseService } from '@/services/edgeCaseService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [detailedReportOpen, setDetailedReportOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [detailedReport, setDetailedReport] = useState<string | null>(null);
  const [recommendationsImpl, setRecommendationsImpl] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  // Configure marked options for proper header and bold text rendering
  marked.setOptions({
    breaks: true, 
    gfm: true,
    smartypants: true
  });

  const renderMarkdown = (content: string | null) => {
    if (!content) return '';
    
    try {
      // Use marked with proper configuration
      const html = marked.parse(content, { 
        breaks: true,
        gfm: true
      });
      const sanitizedHtml = DOMPurify.sanitize(html, { 
        USE_PROFILES: { html: true },
        ADD_ATTR: ['target'] 
      });
      return sanitizedHtml;
    } catch (error) {
      console.error("Error rendering markdown:", error);
      return content;
    }
  };

  const handleExportReport = () => {
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
    toast.success('Report exported successfully');
  };

  const handleDetailedReport = async () => {
    if (!detectedEdgeCases.length && !generatedEdgeCases.length && !testResults) {
      toast.error('No data available to generate a detailed report');
      return;
    }

    setIsGeneratingReport(true);
    setDetailedReportOpen(true);
    
    try {
      const report = await edgeCaseService.generateDetailedReport(
        detectedEdgeCases, 
        generatedEdgeCases, 
        testResults, 
        targetColumn
      );
      
      setDetailedReport(report);
    } catch (error) {
      console.error("Error generating detailed report:", error);
      toast.error("Failed to generate detailed report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleApplyRecommendations = async () => {
    if (!testResults || !testResults.recommendations || testResults.recommendations.length === 0) {
      toast.error('No recommendations available to implement');
      return;
    }

    setIsGeneratingRecommendations(true);
    setRecommendationsOpen(true);
    
    try {
      const implementation = await edgeCaseService.generateRecommendationsImplementation(
        testResults.recommendations,
        detectedEdgeCases
      );
      
      setRecommendationsImpl(implementation);
    } catch (error) {
      console.error("Error generating recommendations implementation:", error);
      toast.error("Failed to generate implementation steps");
    } finally {
      setIsGeneratingRecommendations(false);
    }
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
    <>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDetailedReport}
          >
            <FileText className="mr-2 h-4 w-4" />
            Detailed Report
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleApplyRecommendations}
            disabled={!testResults?.recommendations}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Apply Recommendations
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={detailedReportOpen} onOpenChange={setDetailedReportOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detailed Edge Case Analysis Report</DialogTitle>
            <DialogDescription>
              Comprehensive analysis of edge cases and their impact
            </DialogDescription>
          </DialogHeader>
          
          {isGeneratingReport ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Generating detailed AI report...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {detailedReport ? (
                <div 
                  className="markdown-content" 
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(detailedReport) }} 
                />
              ) : (
                <p>Failed to generate report. Please try again.</p>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => {
                if (detailedReport) {
                  const blob = new Blob([detailedReport], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'edge_case_detailed_report.md';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("Report downloaded successfully");
                }
              }}
              disabled={!detailedReport}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={recommendationsOpen} onOpenChange={setRecommendationsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Implementation of Recommendations</DialogTitle>
            <DialogDescription>
              Steps to apply the recommended fixes for edge cases
            </DialogDescription>
          </DialogHeader>
          
          {isGeneratingRecommendations ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Generating AI implementation steps...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {recommendationsImpl ? (
                <div 
                  className="markdown-content" 
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(recommendationsImpl) }} 
                />
              ) : (
                <p>Failed to generate implementation steps. Please try again.</p>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => {
                if (recommendationsImpl) {
                  const blob = new Blob([recommendationsImpl], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'edge_case_recommendations_implementation.md';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("Implementation steps downloaded successfully");
                }
              }}
              disabled={!recommendationsImpl}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Implementation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EdgeCaseReport;
