
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RefreshCw } from 'lucide-react';
import { BalancingOptions, DatasetInfo } from '@/services/imbalancedDataService';
import { toast } from 'sonner';

interface DataBalancingControlsProps {
  originalDataset: DatasetInfo | null;
  parsedData: any[];
  onBalanceDataset: (options: BalancingOptions, data?: any[]) => void;
  onDownloadBalanced: (format: 'json' | 'csv') => void;
  hasBalancedData: boolean;
  aiRecommendationsAvailable: boolean;
}

const DataBalancingControls: React.FC<DataBalancingControlsProps> = ({
  originalDataset,
  parsedData,
  onBalanceDataset,
  onDownloadBalanced,
  hasBalancedData,
  aiRecommendationsAvailable
}) => {
  const [balancingTechnique, setBalancingTechnique] = useState<BalancingOptions['technique']>('oversampling');
  const [targetRatio, setTargetRatio] = useState<number>(1.2);
  const [isBalancing, setIsBalancing] = useState(false);
  
  const handleApplyBalancing = () => {
    if (!originalDataset) return;
    
    setIsBalancing(true);
    
    try {
      onBalanceDataset({
        technique: balancingTechnique,
        ratio: targetRatio,
        preserveDistribution: true
      }, parsedData);
    } catch (error) {
      console.error('Error balancing dataset:', error);
      toast.error('Failed to balance dataset. Please try again.');
    } finally {
      setIsBalancing(false);
    }
  };
  
  if (!originalDataset) {
    return null;
  }
  
  if (!aiRecommendationsAvailable) {
    return (
      <Card className="mt-6 border-dashed">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Balance Your Dataset</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Get AI recommendations first to understand the best balancing approach for your dataset.
            </p>
          </div>
        </CardContent>
      </Card>
    );
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
                <Label>Balancing Technique</Label>
                <RadioGroup 
                  value={balancingTechnique}
                  onValueChange={(value) => setBalancingTechnique(value as BalancingOptions['technique'])}
                  className="grid grid-cols-1 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oversampling" id="oversampling" />
                    <Label htmlFor="oversampling">Oversampling (increase minority classes)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="undersampling" id="undersampling" />
                    <Label htmlFor="undersampling">Undersampling (reduce majority classes)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <Label htmlFor="hybrid">Hybrid (combine both techniques)</Label>
                  </div>
                </RadioGroup>
              </div>
              
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
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter>
        {isImbalanced && (
          <Button 
            className="w-full" 
            onClick={handleApplyBalancing}
            disabled={isBalancing}
          >
            {isBalancing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Balancing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Apply Balancing
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default DataBalancingControls;
