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
      
      // Simulated generation process with progress updates
      const totalToGenerate = modelOptions.syntheticDataPreferences.volume || 100;
      const batchSize = 20;
      let generatedSamples: any[] = [];
      
      for (let i = 0; i < totalToGenerate; i += batchSize) {
        // Update progress
        const currentProgress = Math.min(Math.round((i / totalToGenerate) * 100), 90);
        setProgress(currentProgress);
        setGeneratedCount(i);
        
        // In a real implementation, this would call the backend service
        // For now, we'll create some unique synthetic data based on the original minority class samples
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        
        const batchCount = Math.min(batchSize, totalToGenerate - i);
        const currentBatch = createUniqueSyntheticSamples(
          originalData, 
          preferences.targetColumn,
          preferences.minorityClass,
          batchCount,
          modelOptions.syntheticDataPreferences.diversity,
          generatedSamples // Pass existing samples to ensure uniqueness
        );
        
        generatedSamples = [...generatedSamples, ...currentBatch];
      }
      
      setProgress(100);
      setGeneratedCount(generatedSamples.length);
      
      // Wait a bit to show 100% completion, then notify parent
      setTimeout(() => {
        onSyntheticDataGenerated(generatedSamples);
        toast.success(`Generated ${generatedSamples.length} unique synthetic samples`);
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error("Error generating synthetic data:", error);
      toast.error("Failed to generate synthetic data");
      setLoading(false);
    }
  };
  
  // This is a placeholder function - in reality, we would call the OpenAI service
  // This is just for UI demonstration without actual API calls
  const createUniqueSyntheticSamples = (
    data: any[], 
    targetColumn: string,
    minorityClass: string,
    count: number,
    diversity: 'low' | 'medium' | 'high' = 'medium',
    existingSamples: any[] = []
  ): any[] => {
    // Find minority class samples
    const minoritySamples = data.filter(item => 
      String(item[targetColumn]) === minorityClass
    );
    
    if (minoritySamples.length === 0) return [];
    
    // Create synthetic samples based on minority class
    const syntheticSamples = [];
    const diversityFactor = diversity === 'low' ? 0.05 : diversity === 'medium' ? 0.15 : 0.25;
    
    // Create a set of fingerprints for existing samples to check uniqueness
    const existingFingerprints = new Set();
    
    // Add fingerprints of existing synthetic samples
    existingSamples.forEach(sample => {
      const fingerprint = generateSampleFingerprint(sample, targetColumn);
      existingFingerprints.add(fingerprint);
    });
    
    // Generate unique samples
    let attemptsLeft = count * 3; // Allow up to 3 attempts per required sample
    while (syntheticSamples.length < count && attemptsLeft > 0) {
      // Pick a random sample to use as base
      const baseSample = minoritySamples[Math.floor(Math.random() * minoritySamples.length)];
      const syntheticSample = { ...baseSample };
      
      // Add synthetic_id
      syntheticSample.synthetic_id = `syn_${existingSamples.length + syntheticSamples.length + 1}`;
      
      // Vary numeric features with more randomness to ensure uniqueness
      for (const key in syntheticSample) {
        if (key !== targetColumn && typeof syntheticSample[key] === 'number') {
          const originalValue = syntheticSample[key];
          // Add more randomness based on diversity level
          const randomVariation = Math.random() * diversityFactor * 2 - diversityFactor;
          const additionalRandomness = Math.random() * 0.02 * (1 + syntheticSamples.length % 10);
          
          syntheticSample[key] = originalValue + (originalValue * (randomVariation + additionalRandomness));
          
          // Round to reasonable decimal places if the original was an integer
          if (Number.isInteger(baseSample[key])) {
            syntheticSample[key] = Math.round(syntheticSample[key]);
          } else {
            // Keep a few decimal places for non-integer values
            syntheticSample[key] = parseFloat(syntheticSample[key].toFixed(4));
          }
        }
      }
      
      // Check if this sample is unique
      const fingerprint = generateSampleFingerprint(syntheticSample, targetColumn);
      if (!existingFingerprints.has(fingerprint)) {
        existingFingerprints.add(fingerprint);
        syntheticSamples.push(syntheticSample);
      }
      
      attemptsLeft--;
    }
    
    return syntheticSamples;
  };
  
  // Helper to generate a fingerprint for sample uniqueness checking
  const generateSampleFingerprint = (sample: any, excludeKey: string): string => {
    const relevantData: Record<string, any> = {};
    
    // Only include numeric fields in the fingerprint to focus on the meaningful variations
    Object.keys(sample).forEach(key => {
      if (key !== excludeKey && key !== 'synthetic_id' && typeof sample[key] === 'number') {
        relevantData[key] = sample[key];
      }
    });
    
    return JSON.stringify(relevantData);
  };
  
  // Find the minority class in the original dataset
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
