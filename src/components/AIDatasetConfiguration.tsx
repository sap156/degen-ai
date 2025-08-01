
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Bot, Brain, FileSearch, Target, Key, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatasetAnalysis, DatasetPreferences } from '@/services/aiDatasetAnalysisService';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

interface AIDatasetConfigurationProps {
  datasetAnalysis: DatasetAnalysis | null;
  isLoading: boolean;
  onConfigurationComplete: (preferences: DatasetPreferences) => void;
  apiKeyAvailable: boolean;
}

const AIDatasetConfiguration = ({
  datasetAnalysis,
  isLoading,
  onConfigurationComplete,
  apiKeyAvailable
}: AIDatasetConfigurationProps) => {
  const [step, setStep] = useState<'target' | 'primaryKeys' | 'context'>('target');
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DatasetPreferences>({
    defaultValues: {
      targetColumn: datasetAnalysis?.detectedTarget || '',
      classLabels: [],
      datasetContext: '',
      primaryKeys: []
    }
  });

  const targetColumn = watch('targetColumn');
  const selectedPrimaryKeys = watch('primaryKeys') || [];

  // Get unique values for the selected target column
  const getUniqueClassValues = (): string[] => {
    if (!datasetAnalysis || !targetColumn) return [];
    
    // Create a Set to store unique values
    const uniqueValues = new Set<string>();
    
    // Check each row in the preview data
    datasetAnalysis.preview.forEach(item => {
      if (targetColumn in item) {
        // Convert to string to ensure consistent handling of all value types
        const value = String(item[targetColumn]);
        if (value !== undefined && value !== null && value !== '') {
          uniqueValues.add(value);
        }
      }
    });
    
    return Array.from(uniqueValues).sort();
  };

  const uniqueClassValues = getUniqueClassValues();
  
  // Detect potential primary key fields
  const detectPrimaryKeys = (): string[] => {
    if (!datasetAnalysis) return [];
    
    const potentialKeys: string[] = [];
    const preview = datasetAnalysis.preview;
    
    if (!preview || preview.length === 0) return [];
    
    // Check fields with common primary key names
    const commonPrimaryKeyNames = [
      'id', 'ID', 'Id', '_id', 'key',
      'user_id', 'userId', 'customer_id', 'customerId',
      'record_id', 'recordId', 'uuid', 'guid'
    ];
    
    // Check for fields with standard primary key naming conventions
    const firstItem = preview[0];
    Object.keys(firstItem).forEach(field => {
      if (commonPrimaryKeyNames.includes(field) || 
          field.endsWith('_id') || 
          field.endsWith('Id') || 
          field.endsWith('ID')) {
        potentialKeys.push(field);
        return;
      }
    });
    
    // Check for fields with unique values
    const fieldUniqueValues: Record<string, Set<string>> = {};
    
    Object.keys(firstItem).forEach(field => {
      fieldUniqueValues[field] = new Set();
    });
    
    preview.forEach(item => {
      Object.keys(item).forEach(field => {
        if (item[field] !== undefined && item[field] !== null) {
          fieldUniqueValues[field].add(String(item[field]));
        }
      });
    });
    
    // Fields with unique values across all records are potential primary keys
    Object.entries(fieldUniqueValues).forEach(([field, values]) => {
      if (values.size === preview.length && !potentialKeys.includes(field)) {
        potentialKeys.push(field);
      }
    });
    
    return potentialKeys;
  };

  useEffect(() => {
    if (datasetAnalysis) {
      // Set default target column if detected
      if (datasetAnalysis.detectedTarget) {
        setValue('targetColumn', datasetAnalysis.detectedTarget);
      }
      
      // Set default primary keys if detected
      const detectedPrimaryKeys = detectPrimaryKeys();
      if (detectedPrimaryKeys.length > 0) {
        setValue('primaryKeys', datasetAnalysis.potentialPrimaryKeys || detectedPrimaryKeys);
      }
    }
  }, [datasetAnalysis, setValue]);

  const handleTargetSelection = () => {
    if (!targetColumn) {
      toast.error("Please select a target column");
      return;
    }
    
    // Auto-select the unique values as class labels
    setValue('classLabels', uniqueClassValues);
    setStep('primaryKeys');
  };

  const handlePrimaryKeysSelection = () => {
    setStep('context');
  };

  const handleBackToTarget = () => {
    setStep('target');
  };

  const handleBackToPrimaryKeys = () => {
    setStep('primaryKeys');
  };

  const handleComplete = (data: DatasetPreferences) => {
    // Determine majority and minority classes
    if (datasetAnalysis && targetColumn) {
      const classCounts: Record<string, number> = {};
      datasetAnalysis.preview.forEach(item => {
        const className = String(item[targetColumn]);
        if (className !== undefined && className !== null && className !== '') {
          classCounts[className] = (classCounts[className] || 0) + 1;
        }
      });
      
      let maxCount = 0;
      let minCount = Infinity;
      let majorityClass = '';
      let minorityClass = '';
      
      Object.entries(classCounts).forEach(([className, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityClass = className;
        }
        if (count < minCount) {
          minCount = count;
          minorityClass = className;
        }
      });
      
      data.majorityClass = majorityClass;
      data.minorityClass = minorityClass;
    }
    
    onConfigurationComplete(data);
  };

  if (!datasetAnalysis) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Dataset Loaded</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Please upload a dataset to configure AI-assisted analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get potential primary keys
  const potentialPrimaryKeys = datasetAnalysis.potentialPrimaryKeys || detectPrimaryKeys();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          Dataset Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!apiKeyAvailable && (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
            <p className="font-medium">OpenAI API Key Required</p>
            <p className="mt-1">Set your OpenAI API key to enable AI-powered analysis features.</p>
          </div>
        )}
        
        {step === 'target' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">1. Select Target Variable</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="targetColumn">Which column represents your target/label variable?</Label>
              <Select 
                value={targetColumn} 
                onValueChange={(value) => setValue('targetColumn', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target column" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(datasetAnalysis.schema).map(column => (
                    <SelectItem key={column} value={column}>
                      {column}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({datasetAnalysis.schema[column]})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleTargetSelection} 
              className="mt-4"
              disabled={!targetColumn}
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
        
        {step === 'primaryKeys' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Key className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">2. Select Primary Key Fields</h3>
            </div>
            
            <div className="space-y-3">
              <Label>Select the primary key field(s) that uniquely identify each record</Label>
              <p className="text-sm text-muted-foreground">
                Primary keys are fields with unique values for each record. They help maintain data integrity and uniqueness.
              </p>
              
              {potentialPrimaryKeys && potentialPrimaryKeys.length > 0 ? (
                <div className="p-3 bg-blue-50 rounded-md text-sm mb-2">
                  <p className="font-medium text-blue-800">AI-Detected Primary Keys</p>
                  <p className="text-blue-700 mt-1">
                    We've detected potential primary key fields. Please confirm or select different ones.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-md text-sm mb-2">
                  <p className="font-medium text-amber-800">No Primary Keys Detected</p>
                  <p className="text-amber-700 mt-1">
                    No obvious primary key fields were detected. Please select fields that uniquely identify each record.
                  </p>
                </div>
              )}
              
              <div className="border rounded-md p-3">
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(datasetAnalysis.schema).map(field => (
                    <div key={field} className="flex items-center">
                      <Checkbox
                        id={`pk-${field}`}
                        checked={selectedPrimaryKeys.includes(field)}
                        onCheckedChange={(checked) => {
                          const current = selectedPrimaryKeys || [];
                          if (checked) {
                            setValue('primaryKeys', [...current, field]);
                          } else {
                            setValue('primaryKeys', current.filter(k => k !== field));
                          }
                        }}
                      />
                      <Label htmlFor={`pk-${field}`} className="ml-2 flex items-center">
                        {field}
                        {potentialPrimaryKeys.includes(field) && (
                          <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-800 border-amber-200">
                            <Key className="h-3 w-3 mr-1" />
                            Suggested
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedPrimaryKeys.length > 0 && (
                <div className="text-xs text-primary">
                  {selectedPrimaryKeys.length} primary key field(s) selected
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={handleBackToTarget}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handlePrimaryKeysSelection}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {step === 'context' && (
          <form onSubmit={handleSubmit(handleComplete)} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-medium">3. Add Context (Optional)</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="datasetContext">Dataset Context</Label>
              <p className="text-sm text-muted-foreground">
                Providing context about your data helps our AI provide more relevant recommendations. 
                For example: "customer churn prediction", "fraud detection", "medical diagnosis".
              </p>
              <Textarea
                id="datasetContext"
                placeholder="Describe what this dataset represents and what you're trying to predict..."
                className="min-h-[100px]"
                {...register('datasetContext')}
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToPrimaryKeys}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit">
                <Bot className="mr-2 h-4 w-4" />
                Complete Configuration
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="bg-muted/50 flex flex-col items-start px-6 py-4">
        <h4 className="text-sm font-medium mb-2">Dataset Summary</h4>
        <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><span className="text-muted-foreground">Total Samples:</span> {datasetAnalysis.summary.totalSamples}</div>
          <div><span className="text-muted-foreground">Missing Values:</span> {datasetAnalysis.summary.missingValues}</div>
          <div><span className="text-muted-foreground">Duplicates:</span> {datasetAnalysis.summary.duplicates}</div>
          <div><span className="text-muted-foreground">Outliers:</span> {datasetAnalysis.summary.outliers}</div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIDatasetConfiguration;
