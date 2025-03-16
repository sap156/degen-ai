
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RefreshCw, Download, Save } from 'lucide-react';
import { BalancingOptions, DatasetInfo } from '@/services/imbalancedDataService';
import { useApiKey } from '@/contexts/ApiKeyContext';

interface DataBalancingControlsProps {
  originalDataset: DatasetInfo | null;
  onBalanceDataset: (options: BalancingOptions) => void;
  onDownloadBalanced: (format: 'json' | 'csv') => void;
  hasBalancedData: boolean;
}

const DataBalancingControls: React.FC<DataBalancingControlsProps> = ({
  originalDataset,
  onBalanceDataset,
  onDownloadBalanced,
  hasBalancedData
}) => {
  const [balancingMethod, setBalancingMethod] = useState<BalancingOptions['method']>('none');
  const [targetRatio, setTargetRatio] = useState<number>(1.2);
  const { apiKey } = useApiKey();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const handleApplyBalancing = async () => {
    setIsProcessing(true);
    onBalanceDataset({
      method: balancingMethod,
      targetRatio
    });
    setIsProcessing(false);
  };
  
  if (!originalDataset) {
    return null;
  }
  
  const isImbalanced = originalDataset.imbalanceRatio > 1.5;
  const needsApiKeyForSmote = balancingMethod === 'smote' && !apiKey;
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCw className="mr-2 h-5 w-5 text-primary" />
          Balance Your Dataset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isImbalanced ? (
          <div className="text-sm bg-green-50 p-4 rounded-md border border-green-200">
            <p className="font-medium text-green-800">Your dataset is already balanced</p>
            <p className="text-green-700 mt-1">
              The current imbalance ratio of {originalDataset.imbalanceRatio}:1 is considered balanced. No action needed.
            </p>
          </div>
        ) : (
          <>
            <div className="text-sm bg-amber-50 p-4 rounded-md border border-amber-200">
              <p className="font-medium text-amber-800">Your dataset is imbalanced</p>
              <p className="text-amber-700 mt-1">
                The current imbalance ratio is {originalDataset.imbalanceRatio}:1. Apply a balancing technique below.
              </p>
            </div>
            
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Balancing Method</Label>
                <RadioGroup 
                  value={balancingMethod} 
                  onValueChange={(value) => setBalancingMethod(value as BalancingOptions['method'])}
                  className="grid grid-cols-1 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">None (keep original)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="evenout" id="evenout" />
                    <Label htmlFor="evenout">Even Out (50:50 distribution with synthetic data)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="undersample" id="undersample" />
                    <Label htmlFor="undersample">Undersampling (reduce majority classes)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oversample" id="oversample" />
                    <Label htmlFor="oversample">Oversampling (increase minority classes)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="smote" id="smote" />
                    <Label htmlFor="smote">SMOTE (Synthetic Minority Over-sampling)</Label>
                    {needsApiKeyForSmote && (
                      <span className="text-xs text-red-500 ml-2">Requires API key</span>
                    )}
                  </div>
                </RadioGroup>
              </div>
              
              {balancingMethod !== "none" && balancingMethod !== "evenout" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="targetRatio">Target Imbalance Ratio</Label>
                    <span className="text-sm text-muted-foreground">{targetRatio}:1</span>
                  </div>
                  <Slider
                    id="targetRatio"
                    min={1}
                    max={5}
                    step={0.1}
                    defaultValue={[targetRatio]}
                    onValueChange={(values) => setTargetRatio(values[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower values create more balanced datasets (1:1 is perfectly balanced)
                  </p>
                </div>
              )}
              
              {balancingMethod === "evenout" && (
                <div className="text-sm bg-blue-50 p-4 rounded-md border border-blue-200">
                  <p className="font-medium text-blue-800">Even Distribution</p>
                  <p className="text-blue-700 mt-1">
                    This will generate synthetic data to create an even distribution across all classes.
                    {!apiKey && " An OpenAI API key is recommended for better synthetic data."}
                  </p>
                </div>
              )}
              
              {balancingMethod === "smote" && (
                <div className="text-sm bg-purple-50 p-4 rounded-md border border-purple-200">
                  <p className="font-medium text-purple-800">SMOTE - Synthetic Data</p>
                  <p className="text-purple-700 mt-1">
                    SMOTE generates synthetic samples for minority classes based on existing features.
                    {!apiKey && " An OpenAI API key is required for this method."}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-3">
        {isImbalanced && (
          <Button 
            className="w-full" 
            onClick={handleApplyBalancing}
            disabled={balancingMethod === 'none' || isProcessing || (balancingMethod === 'smote' && !apiKey)}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Apply Balancing
              </>
            )}
          </Button>
        )}
        
        {hasBalancedData && (
          <div className="flex w-full space-x-2">
            <Button 
              variant="outline" 
              className="w-1/2" 
              onClick={() => onDownloadBalanced('csv')}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              className="w-1/2" 
              onClick={() => onDownloadBalanced('json')}
            >
              <Save className="mr-2 h-4 w-4" />
              JSON
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default DataBalancingControls;
