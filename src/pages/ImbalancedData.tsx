import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/FileUploader';
import { AIDatasetAnalysis } from '@/components/AIDatasetAnalysis';
import { BarChart3, Upload, Download, RefreshCw } from 'lucide-react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import DataBalancingControls from '@/components/DataBalancingControls';
import UserGuideImbalancedData from '@/components/ui/UserGuideImbalancedData';
import { toast } from 'sonner';
import { 
  analyzeDataset, 
  balanceDataset as balanceDatasetService, 
  downloadBalancedDataset 
} from '@/services/imbalancedDataService';

interface DatasetInfo {
  totalRows: number;
  columnNames: string[];
  positiveClassCount: number;
  negativeClassCount: number;
  imbalanceRatio: number;
}

const ImbalancedData = () => {
  const { isKeySet } = useApiKey();
  const [originalDataset, setOriginalDataset] = useState<DatasetInfo | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [balancedDataset, setBalancedDataset] = useState<any[] | null>(null);
  const [aiRecommendations, setAIRecommendations] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBalancing, setIsBalancing] = useState(false);
  
  const handleFileSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const jsonData = JSON.parse(fileContent);
        
        if (!Array.isArray(jsonData)) {
          toast.error('Uploaded file does not contain an array of objects.');
          return;
        }
        
        setParsedData(jsonData);
        
        setIsAnalyzing(true);
        const analysisResult = await analyzeDataset(jsonData);
        setOriginalDataset(analysisResult);
        setAIRecommendations(analysisResult.aiRecommendations);
        setIsAnalyzing(false);
        
        toast.success('Dataset uploaded and analyzed successfully!');
      } catch (error: any) {
        console.error('Error parsing or analyzing data:', error);
        toast.error(`Error processing file: ${error.message}`);
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(file);
  };
  
  const handleBalanceDataset = async (options: any, data?: any[]) => {
    if (!originalDataset) return;
    
    setIsBalancing(true);
    
    try {
      const balancedData = await balanceDatasetService(options, data);
      setBalancedDataset(balancedData);
      toast.success('Dataset balanced successfully!');
    } catch (error: any) {
      console.error('Error balancing dataset:', error);
      toast.error(`Failed to balance dataset: ${error.message}`);
    } finally {
      setIsBalancing(false);
    }
  };
  
  const handleDownloadBalanced = async (format: 'json' | 'csv') => {
    if (!balancedDataset) {
      toast.error('No balanced data available to download.');
      return;
    }
    
    try {
      const filename = `balanced_dataset.${format}`;
      await downloadBalancedDataset(balancedDataset, format, filename);
      toast.success('Balanced dataset downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading balanced dataset:', error);
      toast.error(`Failed to download balanced dataset: ${error.message}`);
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Imbalanced Data Handling</h1>
        <p className="text-muted-foreground">
          Analyze, understand, and fix imbalances in your datasets to improve model performance
        </p>
      </div>

      {!isKeySet ? (
        <ApiKeyRequirement />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-1">
            {/* Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Dataset
                </CardTitle>
                <CardDescription>Upload your dataset to analyze and balance</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader 
                  onFileSelect={handleFileSelect}
                  acceptedFileTypes={{ 'application/json': ['.json'] }}
                  maxSizeMB={10}
                />
              </CardContent>
            </Card>
            
            {/* Balancing Controls Card */}
            {originalDataset && (
              <DataBalancingControls 
                originalDataset={originalDataset}
                parsedData={parsedData}
                onBalanceDataset={handleBalanceDataset}
                onDownloadBalanced={handleDownloadBalanced}
                hasBalancedData={!!balancedDataset}
                aiRecommendationsAvailable={!!aiRecommendations}
                className="mt-6"
              />
            )}
            
            {/* User Guide */}
            <UserGuideImbalancedData />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {originalDataset ? (
              <AIDatasetAnalysis 
                datasetInfo={originalDataset} 
                aiRecommendations={aiRecommendations}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Upload a dataset to view analysis
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {balancedDataset && (
              <Card>
                <CardHeader>
                  <CardTitle>Balanced Dataset Preview</CardTitle>
                  <CardDescription>
                    Here's a preview of the balanced dataset. Download to use in your models.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          {originalDataset?.columnNames.map((header) => (
                            <th key={header} className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {balancedDataset.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            {originalDataset?.columnNames.map((column) => (
                              <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {JSON.stringify(row[column])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleDownloadBalanced('json')} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Balanced Data (JSON)
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImbalancedData;
