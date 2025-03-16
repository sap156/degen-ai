
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { BalancingOptions } from '@/services/imbalancedDataService';
import { DatabaseBackup, RefreshCw } from 'lucide-react';

interface DataBalancingControlsProps {
  onBalanceDataset: (options: BalancingOptions) => void;
  isDisabled: boolean;
}

const DataBalancingControls: React.FC<DataBalancingControlsProps> = ({
  onBalanceDataset,
  isDisabled
}) => {
  // Update this type definition to include 'none' as a valid option
  const [balancingMethod, setBalancingMethod] = React.useState<'undersample' | 'oversample' | 'smote' | 'none'>('none');
  const [targetRatio, setTargetRatio] = React.useState<number>(1.2);

  const handleApplyBalancing = () => {
    onBalanceDataset({
      method: balancingMethod,
      targetRatio
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <DatabaseBackup className="mr-2 h-5 w-5 text-primary" />
          Balance Dataset
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Balancing Method</Label>
          <RadioGroup 
            value={balancingMethod} 
            onValueChange={(value) => setBalancingMethod(value as any)}
            className="grid grid-cols-1 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none">None (Original dataset)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="undersample" id="undersample" />
              <Label htmlFor="undersample">Undersampling (Reduce majority classes)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="oversample" id="oversample" />
              <Label htmlFor="oversample">Oversampling (Duplicate minority classes)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="smote" id="smote" />
              <Label htmlFor="smote">SMOTE (Synthetic Minority Oversampling)</Label>
            </div>
          </RadioGroup>
        </div>
        
        {balancingMethod !== 'none' && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="targetRatio">Target Imbalance Ratio</Label>
              <span className="text-sm text-muted-foreground">{targetRatio}:1</span>
            </div>
            <Slider
              id="targetRatio"
              min={1}
              max={3}
              step={0.1}
              value={[targetRatio]}
              onValueChange={(values) => setTargetRatio(values[0])}
              disabled={balancingMethod === 'none'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower values create more balanced datasets (1:1 is perfectly balanced)
            </p>
          </div>
        )}
        
        <Button 
          onClick={handleApplyBalancing} 
          className="w-full"
          disabled={isDisabled || balancingMethod === 'none'}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Apply Balancing
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataBalancingControls;
