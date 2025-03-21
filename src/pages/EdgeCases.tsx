import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';
import { AlertTriangle, AlertCircle, Sparkles, GitBranch, GitFork, Bug, Beaker } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import UserGuideEdgeCases from '@/components/ui/UserGuideEdgeCases';
import EdgeCaseDetector from '@/components/EdgeCaseDetector';
import EdgeCaseGenerator from '@/components/EdgeCaseGenerator';
import EdgeCaseReport from '@/components/EdgeCaseReport';
import ModelTester from '@/components/ModelTester';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { edgeCaseService, EdgeCaseDetectionOptions } from '@/services/edgeCaseService';

const edgeCaseTypes = [
  { value: 'numerical', label: 'Numerical Extremes', description: 'Identify outliers and boundary values in numerical features' },
  { value: 'categorical', label: 'Categorical Anomalies', description: 'Find rare categories and unusual combinations of categorical features' },
  { value: 'temporal', label: 'Temporal Anomalies', description: 'Detect unusual patterns in time-based data' },
  { value: 'structural', label: 'Structural Issues', description: 'Identify data structure problems and inconsistencies' },
  { value: 'relational', label: 'Relational Anomalies', description: 'Find unusual relationships between features' }
];

const EdgeCases = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [edgeCaseType, setEdgeCaseType] = useState('numerical');
  const [generationMethod, setGenerationMethod] = useState('ai');
  const [complexityLevel, setComplexityLevel] = useState(50);
  
  const [detectionLoading, setDetectionLoading] = useState(false);
  const [detectedEdgeCases, setDetectedEdgeCases] = useState<any[]>([]);
  
  const [generationLoading, setGenerationLoading] = useState(false);
  const [generatedEdgeCases, setGeneratedEdgeCases] = useState<any[]>([]);
  
  const [testResults, setTestResults] = useState<any>(null);
  const [testingLoading, setTestingLoading] = useState(false);
  
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [implementationContent, setImplementationContent] = useState<string | null>(null);
  const [implementationLoading, setImplementationLoading] = useState(false);
  
  const handleFileUpload = (data: any[]) => {
    setDataset(data);
    if (data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      setTargetColumn(cols[0]);
      toast.success(`Uploaded dataset with ${data.length} rows and ${cols.length} columns`);
    }
  };
  
  const handleDetectEdgeCases = async () => {
    if (dataset.length === 0) {
      toast.error('Please upload a dataset first');
      return;
    }
    
    if (!targetColumn) {
      toast.error('Please select a target column');
      return;
    }
    
    setDetectionLoading(true);
    try {
      const options: EdgeCaseDetectionOptions = {
        dataset,
        targetColumn,
        edgeCaseType,
        complexityLevel
      };
      
      const results = await edgeCaseService.detectEdgeCases(options);
      setDetectedEdgeCases(results);
      
      if (results.length === 0) {
        toast.info('No edge cases detected for the selected criteria');
      } else {
        toast.success(`Detected ${results.length} potential edge cases`);
      }
    } catch (error) {
      console.error('Error detecting edge cases:', error);
      toast.error('Failed to detect edge cases');
    } finally {
      setDetectionLoading(false);
    }
  };
  
  const handleGenerateSyntheticCases = async () => {
    if (dataset.length === 0) {
      toast.error('Please upload a dataset first');
      return;
    }
    
    if (!targetColumn) {
      toast.error('Please select a target column');
      return;
    }
    
    setGenerationLoading(true);
    try {
      const options: EdgeCaseDetectionOptions = {
        dataset,
        targetColumn,
        edgeCaseType,
        complexityLevel
      };
      
      const results = await edgeCaseService.generateSyntheticCases(options, generationMethod);
      setGeneratedEdgeCases(results);
      
      if (results.length === 0) {
        toast.info('No synthetic cases could be generated');
      } else {
        toast.success(`Generated ${results.length} synthetic edge cases`);
      }
    } catch (error) {
      console.error('Error generating synthetic cases:', error);
      toast.error('Failed to generate synthetic cases');
    } finally {
      setGenerationLoading(false);
    }
  };
  
  const handleTestModel = async () => {
    if (detectedEdgeCases.length === 0 && generatedEdgeCases.length === 0) {
      toast.error('Please detect or generate edge cases first');
      return;
    }
    
    setTestingLoading(true);
    try {
      const combinedEdgeCases = [...detectedEdgeCases, ...generatedEdgeCases];
      const results = await edgeCaseService.testModelOnEdgeCases({
        edgeCases: combinedEdgeCases,
        dataset,
        targetColumn
      });
      
      setTestResults(results);
      toast.success('Model testing completed');
    } catch (error) {
      console.error('Error testing model:', error);
      toast.error('Failed to test model on edge cases');
    } finally {
      setTestingLoading(false);
    }
  };
  
  const handleGenerateReport = async () => {
    if (!testResults) {
      toast.error('Please run model testing first');
      return;
    }
    
    setReportLoading(true);
    try {
      const reportContent = await edgeCaseService.generateDetailedReport(
        detectedEdgeCases,
        generatedEdgeCases,
        testResults,
        targetColumn
      );
      
      setReportContent(reportContent);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };
  
  const handleGenerateImplementation = async () => {
    if (!testResults || !testResults.recommendations) {
      toast.error('Please run model testing first');
      return;
    }
    
    setImplementationLoading(true);
    try {
      const implementationContent = await edgeCaseService.generateRecommendationsImplementation(
        testResults.recommendations,
        dataset
      );
      
      setImplementationContent(implementationContent);
      toast.success('Implementation guide generated successfully');
    } catch (error) {
      console.error('Error generating implementation guide:', error);
      toast.error('Failed to generate implementation guide');
    } finally {
      setImplementationLoading(false);
    }
  };
  
  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Edge Case Detection & Testing</h1>
          <p className="text-muted-foreground">
            Identify edge cases in your data and test how your models perform on them.
          </p>
        </div>
        
        <ApiKeyRequirement showUserGuide={<UserGuideEdgeCases />}>
          <Tabs defaultValue="detect" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="detect" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Detect</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                <span>Generate</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-1">
                <Beaker className="h-4 w-4" />
                <span>Test</span>
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-1">
                <Bug className="h-4 w-4" />
                <span>Report</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="detect" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-blue-500" />
                      Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure detection parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Upload Dataset</Label>
                      <FileUploader onFileLoaded={handleFileUpload} accept=".csv,.json" />
                    </div>
                    
                    {columns.length > 0 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="target-column">Target Column</Label>
                          <Select 
                            value={targetColumn} 
                            onValueChange={setTargetColumn}
                          >
                            <SelectTrigger id="target-column">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Edge Case Type</Label>
                          <RadioGroup value={edgeCaseType} onValueChange={setEdgeCaseType} className="space-y-3">
                            {edgeCaseTypes.map(type => (
                              <div key={type.value} className="flex items-start space-x-2">
                                <RadioGroupItem value={type.value} id={`type-${type.value}`} />
                                <div className="grid gap-1.5">
                                  <Label htmlFor={`type-${type.value}`} className="font-medium">
                                    {type.label}
                                  </Label>
                                  <p className="text-sm text-muted-foreground">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Complexity Level</Label>
                            <span className="text-sm text-muted-foreground">{complexityLevel}%</span>
                          </div>
                          <Slider 
                            value={[complexityLevel]} 
                            min={10} 
                            max={100} 
                            step={5} 
                            onValueChange={values => setComplexityLevel(values[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Simple</span>
                            <span>Complex</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleDetectEdgeCases} 
                          className="w-full"
                          disabled={detectionLoading || columns.length === 0}
                        >
                          {detectionLoading ? 'Detecting...' : 'Detect Edge Cases'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="md:col-span-2">
                  <EdgeCaseDetector 
                    loading={detectionLoading}
                    detectedEdgeCases={detectedEdgeCases}
                    targetColumn={targetColumn}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="generate" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <GitFork className="mr-2 h-5 w-5 text-blue-500" />
                      Generation Settings
                    </CardTitle>
                    <CardDescription>
                      Configure synthetic data generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {columns.length === 0 && (
                      <div>
                        <Label htmlFor="file-upload">Upload Dataset</Label>
                        <FileUploader onFileLoaded={handleFileUpload} accept=".csv,.json" />
                      </div>
                    )}
                    
                    {columns.length > 0 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="target-column-gen">Target Column</Label>
                          <Select 
                            value={targetColumn} 
                            onValueChange={setTargetColumn}
                          >
                            <SelectTrigger id="target-column-gen">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Generation Method</Label>
                          <RadioGroup value={generationMethod} onValueChange={setGenerationMethod} className="space-y-3">
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="ai" id="method-ai" />
                              <div className="grid gap-1.5">
                                <Label htmlFor="method-ai" className="font-medium">
                                  AI-based Generation
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Uses AI to create contextually relevant edge cases
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="rule" id="method-rule" />
                              <div className="grid gap-1.5">
                                <Label htmlFor="method-rule" className="font-medium">
                                  Rule-based Generation
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Uses domain-specific rules to create edge cases
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>Complexity Level</Label>
                            <span className="text-sm text-muted-foreground">{complexityLevel}%</span>
                          </div>
                          <Slider 
                            value={[complexityLevel]} 
                            min={10} 
                            max={100} 
                            step={5} 
                            onValueChange={values => setComplexityLevel(values[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Simple</span>
                            <span>Complex</span>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleGenerateSyntheticCases} 
                          className="w-full"
                          disabled={generationLoading || columns.length === 0}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {generationLoading ? 'Generating...' : 'Generate Synthetic Cases'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="md:col-span-2">
                  <EdgeCaseGenerator 
                    loading={generationLoading}
                    generatedEdgeCases={generatedEdgeCases}
                    edgeCaseType={edgeCaseType}
                    targetColumn={targetColumn}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="test" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Beaker className="mr-2 h-5 w-5 text-blue-500" />
                    Model Testing
                  </CardTitle>
                  <CardDescription>
                    Test how a model would perform on the detected and generated edge cases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Edge Cases Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Detected Edge Cases:</span>
                            <Badge variant="outline">{detectedEdgeCases.length}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Generated Edge Cases:</span>
                            <Badge variant="outline">{generatedEdgeCases.length}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Total Edge Cases:</span>
                            <Badge>{detectedEdgeCases.length + generatedEdgeCases.length}</Badge>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Button 
                            onClick={handleTestModel} 
                            disabled={testingLoading || (detectedEdgeCases.length === 0 && generatedEdgeCases.length === 0)}
                            className="w-full"
                          >
                            <Beaker className="h-4 w-4 mr-2" />
                            {testingLoading ? 'Testing...' : 'Test Model on Edge Cases'}
                          </Button>
                        </div>
                      </div>
                      
                      <ModelTester 
                        loading={testingLoading}
                        data={testResults}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="report" className="space-y-6">
              <EdgeCaseReport 
                data={reportContent}
                implementationData={implementationContent}
                isLoading={reportLoading}
                isImplementationLoading={implementationLoading}
                onGenerateReport={handleGenerateReport}
                onGenerateImplementation={handleGenerateImplementation}
                hasTestResults={!!testResults}
              />
            </TabsContent>
          </Tabs>
        </ApiKeyRequirement>
      </div>
    </div>
  );
};

export default EdgeCases;
