
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Bot, Download, RefreshCw, PlusCircle, DatabaseBackup, BarChart4, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DatasetPreferences, ModelOptions } from '@/services/aiDataAnalysisService';
import { generateSyntheticRecords, ClassDistribution, DatasetInfo } from '@/services/imbalancedDataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  const [selectedPrimaryKeys, setSelectedPrimaryKeys] = useState<string[]>([]);
  
  // Detect potential primary key fields on component mount
  const potentialPrimaryKeys = detectPrimaryKeyFields(originalData);
  
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
      
      console.log("Using primary keys:", selectedPrimaryKeys);
      
      for (let i = 0; i < totalToGenerate; i += batchSize) {
        // Update progress
        const currentProgress = Math.min(Math.round((i / totalToGenerate) * 100), 90);
        setProgress(currentProgress);
        setGeneratedCount(i);
        
        // In a real implementation, this would call the backend service
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        
        const batchCount = Math.min(batchSize, totalToGenerate - i);
        const minoritySamples = originalData.filter(item => 
          String(item[preferences.targetColumn]) === preferences.minorityClass
        );
        
        if (minoritySamples.length === 0) {
          toast.error("No minority class samples found");
          setLoading(false);
          return;
        }
        
        // Generate synthetic samples ensuring primary key uniqueness
        const currentBatch = await generateSyntheticSamplesWithUniqueKeys(
          minoritySamples,
          selectedPrimaryKeys, // Use user-selected primary keys
          batchCount,
          modelOptions.syntheticDataPreferences.diversity || 'medium'
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
  
  // Detect potential primary key fields in the dataset
  function detectPrimaryKeyFields(data: any[]): string[] {
    if (!data || data.length === 0) return [];
    
    const commonPrimaryKeyNames = [
      'id', 'ID', 'Id', '_id', 
      'patient_id', 'patientId', 'PatientId', 'patientID', 'PatientID',
      'user_id', 'userId', 'UserId', 'userID', 'UserID',
      'customer_id', 'customerId', 'CustomerId', 'customerID', 'CustomerID',
      'record_id', 'recordId', 'RecordId', 'recordID', 'RecordID',
      'uuid', 'UUID', 'guid', 'GUID'
    ];
    
    const potentialKeys: string[] = [];
    const sample = data[0];
    
    // Check for fields with names typically used for primary keys
    Object.keys(sample).forEach(field => {
      if (commonPrimaryKeyNames.includes(field)) {
        potentialKeys.push(field);
        return;
      }
      
      // Check if field name ends with _id, ID, Id
      if (field.endsWith('_id') || field.endsWith('ID') || field.endsWith('Id')) {
        potentialKeys.push(field);
        return;
      }
    });
    
    // If no obvious primary key fields found, check for fields with unique values
    if (potentialKeys.length === 0) {
      Object.keys(sample).forEach(field => {
        // Skip obvious non-key fields
        if (field === 'synthetic_id' || 
            field === preferences.targetColumn ||
            typeof sample[field] === 'object') {
          return;
        }
        
        // Check if values are unique across all records
        const values = new Set(data.map(item => item[field]));
        if (values.size === data.length) {
          potentialKeys.push(field);
        }
      });
    }
    
    return potentialKeys;
  };
  
  // Generate synthetic samples with unique primary key values
  const generateSyntheticSamplesWithUniqueKeys = async (
    minoritySamples: any[],
    primaryKeyFields: string[],
    count: number,
    diversity: 'low' | 'medium' | 'high' = 'medium',
    existingSamples: any[] = [],
    originalData: any[] = []
  ): Promise<any[]> => {
    if (!primaryKeyFields.length) {
      // If no primary keys detected, use the standard function from the service
      return generateSyntheticRecords(
        minoritySamples, 
        preferences.targetColumn, 
        count, 
        diversity
      );
    }
    
    // Get all existing key values to avoid duplication
    const existingKeyValues: Record<string, Set<any>> = {};
    primaryKeyFields.forEach(field => {
      existingKeyValues[field] = new Set();
      
      // Add values from original data
      originalData.forEach(record => {
        if (record[field] !== undefined) {
          existingKeyValues[field].add(String(record[field]));
        }
      });
      
      // Add values from already generated samples
      existingSamples.forEach(record => {
        if (record[field] !== undefined) {
          existingKeyValues[field].add(String(record[field]));
        }
      });
    });
    
    const syntheticSamples = [];
    const diversityFactor = diversity === 'low' ? 0.05 : diversity === 'medium' ? 0.15 : 0.25;
    
    // Generate unique samples one by one
    let attemptsLeft = count * 5; // Allow multiple attempts
    let nextId = 1;
    
    // Find highest existing numeric ID to start from
    if (primaryKeyFields.length > 0) {
      const numericIds: number[] = [];
      const firstKeyField = primaryKeyFields[0];
      
      // Collect all numeric IDs from original data and existing samples
      [...originalData, ...existingSamples].forEach(record => {
        if (record[firstKeyField] !== undefined) {
          const value = record[firstKeyField];
          if (typeof value === 'number') {
            numericIds.push(value);
          } else if (typeof value === 'string' && /^\d+$/.test(value)) {
            numericIds.push(parseInt(value, 10));
          }
        }
      });
      
      // Find the highest ID
      if (numericIds.length > 0) {
        nextId = Math.max(...numericIds) + 1;
      }
    }
    
    while (syntheticSamples.length < count && attemptsLeft > 0) {
      // Pick a random sample to use as base
      const baseSample = minoritySamples[Math.floor(Math.random() * minoritySamples.length)];
      const syntheticSample = { ...baseSample };
      
      // Add synthetic_id
      syntheticSample.synthetic_id = `syn_${existingSamples.length + syntheticSamples.length + 1}`;
      
      // Create a unique composite key to check if this combination exists
      let isDuplicate = false;
      let keyValues: Record<string, any> = {};
      
      // Generate unique primary key values
      primaryKeyFields.forEach(field => {
        const originalValue = baseSample[field];
        
        // Create a new unique ID value based on the field type
        if (typeof originalValue === 'number') {
          // For numeric IDs, use our nextId counter
          syntheticSample[field] = nextId;
          keyValues[field] = nextId;
          nextId++;
        } 
        else if (typeof originalValue === 'string' && /^[0-9]+$/.test(originalValue)) {
          // For string IDs containing only numbers
          syntheticSample[field] = String(nextId);
          keyValues[field] = String(nextId);
          nextId++;
        }
        else if (typeof originalValue === 'string') {
          // For string IDs, add a unique suffix
          syntheticSample[field] = `${originalValue}_syn_${nextId}`;
          keyValues[field] = syntheticSample[field];
          nextId++;
        }
        else {
          // For other types, preserve the original but make it unique
          syntheticSample[field] = `${String(originalValue)}_syn_${nextId}`;
          keyValues[field] = syntheticSample[field];
          nextId++;
        }
      });
      
      // Check if this composite key already exists in our generated samples
      if (primaryKeyFields.length > 0) {
        isDuplicate = syntheticSamples.some(sample => {
          return primaryKeyFields.every(field => String(sample[field]) === String(keyValues[field]));
        });
        
        if (isDuplicate) {
          attemptsLeft--;
          continue; // Skip this sample and try again
        }
        
        // Also check if key exists in original data
        isDuplicate = originalData.some(sample => {
          return primaryKeyFields.every(field => String(sample[field]) === String(keyValues[field]));
        });
        
        if (isDuplicate) {
          attemptsLeft--;
          continue; // Skip this sample and try again
        }
      }
      
      // Vary other numeric features
      for (const key in syntheticSample) {
        if (!primaryKeyFields.includes(key) && 
            key !== preferences.targetColumn && 
            key !== 'synthetic_id' && 
            typeof syntheticSample[key] === 'number') {
          
          const originalValue = syntheticSample[key];
          // Add randomness based on diversity level
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
      
      // Update tracking sets with new key values
      primaryKeyFields.forEach(field => {
        existingKeyValues[field].add(String(syntheticSample[field]));
      });
      
      syntheticSamples.push(syntheticSample);
      attemptsLeft--;
    }
    
    return syntheticSamples;
  };
  
  // Find the minority class in the original dataset
  const minorityClassName = preferences.minorityClass || '';
  const minorityClassInfo = originalDataset.classes.find(c => c.name === minorityClassName);
  const minorityClassCount = minorityClassInfo?.count || 0;
  const targetCount = modelOptions.syntheticDataPreferences?.volume || 100;
  
  // Component to show primary key selection
  const PrimaryKeySelector = () => {
    if (potentialPrimaryKeys.length === 0) {
      return (
        <div className="text-sm text-muted-foreground mt-2">
          No potential primary key fields detected. Synthetic records may contain duplicates.
        </div>
      );
    }
    
    return (
      <div className="space-y-3 mt-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Select Primary Key Fields</Label>
          <span className="text-xs text-muted-foreground">
            {selectedPrimaryKeys.length} selected
          </span>
        </div>
        
        <div className="border rounded-md p-3 space-y-2">
          {potentialPrimaryKeys.map(field => (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox 
                id={`pk-${field}`}
                checked={selectedPrimaryKeys.includes(field)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedPrimaryKeys(prev => [...prev, field]);
                  } else {
                    setSelectedPrimaryKeys(prev => prev.filter(key => key !== field));
                  }
                }}
              />
              <Label 
                htmlFor={`pk-${field}`}
                className="text-sm cursor-pointer flex items-center"
              >
                <Key className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                {field}
              </Label>
            </div>
          ))}
        </div>
        
        {selectedPrimaryKeys.length > 0 && (
          <div className="text-xs text-primary">
            Synthetic data generation will ensure unique values for selected primary key fields
          </div>
        )}
      </div>
    );
  };
  
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
          
          <Separator className="my-2" />
          
          <PrimaryKeySelector />
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
