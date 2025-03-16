
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RefreshCw, Download, Save } from 'lucide-react';
import { BalancingOptions, DatasetInfo } from '@/services/imbalancedDataService';

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
  
  const handleApplyBalancing = () => {
    onBalanceDataset({
      method: balancingMethod,
      targetRatio
    });
  };
  
  if (!originalDataset) {
    return null;
  }
  
  const isImbalanced = originalDataset.imbalanceRatio > 1.5;
  
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
                  </div>
                </RadioGroup>
              </div>
              
              {balancingMethod !== "none" && (
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
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-3">
        {isImbalanced && (
          <Button 
            className="w-full" 
            onClick={handleApplyBalancing}
            disabled={balancingMethod === 'none'}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Apply Balancing
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
