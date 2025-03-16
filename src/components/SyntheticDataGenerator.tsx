import React, { useState } from 'react';
import { toast } from 'sonner';
import { Bot, Download, RefreshCw, PlusCircle, DatabaseBackup, BarChart4 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DatasetPreferences, ModelOptions } from '@/services/aiDataAnalysisService';
import { DatasetInfo } from '@/services/imbalancedDataService';

interface SyntheticDataGeneratorProps {
  preferences: DatasetPreferences;
  modelOptions: ModelOptions;
  originalData: any[];
  apiKeyAvailable: boolean;
  onSyntheticDataGenerated: (syntheticData: any[]) => void;
  originalDataset: DatasetInfo;
}

const SyntheticDataGenerator: React.FC<SyntheticDataGeneratorProps> = ({
  preferences,
  modelOptions,
  originalData,
  apiKeyAvailable,
  onSyntheticDataGenerated,
  originalDataset
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  
  const handleGenerateSyntheticData = async () => {
    if (!apiKeyAvailable) {
      toast.error("OpenAI API key is required for synthetic data generation");
      return;
    }
    
    if (!preferences.minorityClass) {
      toast.error("Minority class must be specified for synthetic data generation");
      return;
    }
    
    if (!modelOptions.syntheticDataPreferences?.enabled) {
      toast.error("Synthetic data generation is not enabled");
      return;
    }
    
    try {
      setLoading(true);
      setProgress(10);
      
      const totalToGenerate = modelOptions.syntheticDataPreferences.volume || 100;
      const batchSize = 20;
      let generatedSamples: any[] = [];
      
      for (let i = 0; i < totalToGenerate; i += batchSize) {
        const currentProgress = Math.min(Math.round((i / totalToGenerate) * 100), 90);
        setProgress(currentProgress);
        setGeneratedCount(i);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const batchCount = Math.min(batchSize, totalToGenerate - i);
        const currentBatch = createDummySyntheticSamples(
          originalData, 
          preferences.targetColumn,
          preferences.minorityClass,
          batchCount,
          modelOptions.syntheticDataPreferences.diversity
        );
        
        generatedSamples = [...generatedSamples, ...currentBatch];
      }
      
      setProgress(100);
      setGeneratedCount(generatedSamples.length);
      
      setTimeout(() => {
        onSyntheticDataGenerated(generatedSamples);
        toast.success(`Generated ${generatedSamples.length} synthetic samples`);
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error("Error generating synthetic data:", error);
      toast.error("Failed to generate synthetic data");
      setLoading(false);
    }
  };
  
  const createDummySyntheticSamples = (
    data: any[], 
    targetColumn: string,
    minorityClass: string,
    count: number,
    diversity: 'low' | 'medium' | 'high' = 'medium'
  ): any[] => {
    const minoritySamples = data.filter(item => 
      String(item[targetColumn]) === minorityClass
    );
    
    if (minoritySamples.length === 0) return [];
    
    const syntheticSamples = [];
    const diversityFactor = diversity === 'low' ? 0.05 : diversity === 'medium' ? 0.15 : 0.25;
    
    for (let i = 0; i < count; i++) {
      const baseSample = minoritySamples[Math.floor(Math.random() * minoritySamples.length)];
      const syntheticSample = { ...baseSample };
      
      syntheticSample.synthetic_id = `syn_${i + 1}`;
      
      for (const key in syntheticSample) {
        if (key !== targetColumn && typeof syntheticSample[key] === 'number') {
          const originalValue = syntheticSample[key];
          const variation = originalValue * diversityFactor * (Math.random() * 2 - 1);
          syntheticSample[key] = originalValue + variation;
        }
      }
      
      syntheticSamples.push(syntheticSample);
    }
    
    return syntheticSamples;
  };
  
  const minorityClassName = preferences.minorityClass || '';
  const minorityClassInfo = originalDataset.classes.find(c => c.className === minorityClassName);
  const minorityClassCount = minorityClassInfo?.count || 0;
  const targetCount = modelOptions.syntheticDataPreferences?.volume || 100;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          Synthetic Data Generation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!apiKeyAvailable && (
          <Alert>
            <AlertDescription>
              OpenAI API key is required for synthetic data generation.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Minority Class</span>
            <span className="text-sm">{minorityClassName}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Sample Count</span>
            <span className="text-sm">{minorityClassCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Target Generation</span>
            <span className="text-sm">{targetCount} samples</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Diversity Level</span>
            <span className="text-sm capitalize">{modelOptions.syntheticDataPreferences?.diversity || 'medium'}</span>
          </div>
        </div>
        
        {loading && (
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span>Generating synthetic samples...</span>
              <span>{generatedCount} / {targetCount}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          disabled={loading || !apiKeyAvailable || !modelOptions.syntheticDataPreferences?.enabled}
          onClick={handleGenerateSyntheticData}
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Generate Synthetic Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SyntheticDataGenerator;
