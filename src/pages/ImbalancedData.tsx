
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploader from '@/components/FileUploader';
import { formatData, downloadData } from '@/utils/fileUploadUtils';
import { toast } from 'sonner';
import { Scale, BarChart, Download, Brain, PieChart } from 'lucide-react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import UserGuideImbalancedData from '@/components/ui/UserGuideImbalancedData';
import AIDatasetAnalysis from '@/components/AIDatasetAnalysis';
import DataBalancingControls from '@/components/DataBalancingControls';
import { Label } from '@/components/ui/label';

const ImbalancedData = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [balancingResults, setBalancingResults] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [balancingLoading, setBalancingLoading] = useState(false);
  const [balancingMethod, setBalancingMethod] = useState('undersampling');
  const [imbalanceRatio, setImbalanceRatio] = useState(0.5);
  
  const handleFileUpload = (data: any[]) => {
    setDataset(data);
    if (data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      setTargetColumn(cols[0]);
      toast.success(`Uploaded dataset with ${data.length} rows and ${cols.length} columns`);
    }
  };
  
  const handleAnalyzeDataset = async () => {
    if (dataset.length === 0) {
      toast.error('Please upload a dataset first');
      return;
    }
    
    if (!targetColumn) {
      toast.error('Please select a target column');
      return;
    }
    
    setAnalysisLoading(true);
    try {
      // For now, mock the results
      const results = { 
        classDistribution: {},
        imbalanceMetrics: {},
        recommendations: []
      };
      setAnalysisResults(results);
      toast.success('Dataset analysis completed');
    } catch (error) {
      console.error('Error analyzing dataset:', error);
      toast.error('Failed to analyze dataset');
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  const handleBalanceDataset = async () => {
    if (!analysisResults) {
      toast.error('Please analyze the dataset first');
      return;
    }
    
    setBalancingLoading(true);
    try {
      const results = { balancedData: dataset };
      setBalancingResults(results);
      toast.success('Dataset balancing completed');
    } catch (error) {
      console.error('Error balancing dataset:', error);
      toast.error('Failed to balance dataset');
    } finally {
      setBalancingLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Imbalanced Data Handling</h1>
          <p className="text-muted-foreground">
            Identify and fix class imbalance issues in your datasets for better model training.
          </p>
        </div>

        <ApiKeyRequirement showUserGuide={<UserGuideImbalancedData />}>
          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="analyze" className="flex items-center gap-1">
                <BarChart className="h-4 w-4" />
                <span>Analyze</span>
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-1">
                <Scale className="h-4 w-4" />
                <span>Balance</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyze" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="mr-2 h-5 w-5 text-blue-500" />
                      Dataset Analysis
                    </CardTitle>
                    <CardDescription>
                      Analyze class distribution and get AI recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Upload Dataset</Label>
                      <FileUploader onFileUpload={handleFileUpload} accept=".csv,.json" />
                    </div>
                    
                    {columns.length > 0 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="target-column">Target Column</Label>
                          <select 
                            id="target-column"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={targetColumn} 
                            onChange={e => setTargetColumn(e.target.value)}
                          >
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                        
                        <Button 
                          onClick={handleAnalyzeDataset} 
                          className="w-full"
                          disabled={analysisLoading || columns.length === 0}
                        >
                          {analysisLoading ? 'Analyzing...' : 'Analyze Dataset'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <AIDatasetAnalysis 
                  isLoading={analysisLoading}
                  datasetAnalysis={analysisResults}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="balance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Scale className="mr-2 h-5 w-5 text-blue-500" />
                      Data Balancing
                    </CardTitle>
                    <CardDescription>
                      Configure balancing parameters and apply techniques
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!analysisResults ? (
                      <div>
                        <p className="text-muted-foreground">
                          Please analyze the dataset first to configure balancing parameters.
                        </p>
                      </div>
                    ) : (
                      <DataBalancingControls 
                        originalDataset={analysisResults}
                        parsedData={dataset}
                        onBalanceDataset={handleBalanceDataset}
                        onDownloadBalanced={(format) => {/* implement download logic */}}
                        hasBalancedData={!!balancingResults}
                        aiRecommendationsAvailable={true}
                      />
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="mr-2 h-5 w-5 text-blue-500" />
                      Balancing Results
                    </CardTitle>
                    <CardDescription>
                      View the new class distribution after balancing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {balancingLoading ? (
                      <div className="flex items-center justify-center p-6">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary animate-spin rounded-full"></div>
                      </div>
                    ) : balancingResults ? (
                      <div>
                        <p>Balancing results will be displayed here.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <Scale className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No Balancing Results</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                          Apply a balancing technique to see the new class distribution
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </ApiKeyRequirement>
      </div>
    </div>
  );
};

export default ImbalancedData;
