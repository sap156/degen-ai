
import React from 'react';
import { BalancingOptions } from '@/services/imbalancedDataService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DataBalancingControlsProps {
  balancingOptions: BalancingOptions;
  setBalancingOptions: (options: BalancingOptions) => void;
  onApplyBalancing: () => void;
  isLoading: boolean;
  availableClasses?: string[];
  targetClassName?: string;
}

const DataBalancingControls: React.FC<DataBalancingControlsProps> = ({
  balancingOptions,
  setBalancingOptions,
  onApplyBalancing,
  isLoading,
  availableClasses = [],
  targetClassName,
}) => {
  const handleTechniqueChange = (technique: string) => {
    setBalancingOptions({
      ...balancingOptions,
      technique // Use technique instead of method
    });
  };

  const handleTargetClassChange = (targetClass: string) => {
    setBalancingOptions({
      ...balancingOptions,
      targetClass
    });
  };

  const handleTargetRatioChange = (value: number[]) => {
    setBalancingOptions({
      ...balancingOptions,
      targetRatio: value[0]
    });
  };

  const handlePreserveMinorityChange = (checked: boolean) => {
    setBalancingOptions({
      ...balancingOptions,
      preserveMinority: checked
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="balancing-technique">Balancing Technique</Label>
        <Select
          value={balancingOptions.technique}
          onValueChange={handleTechniqueChange}
        >
          <SelectTrigger id="balancing-technique">
            <SelectValue placeholder="Select balancing technique" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oversample">Oversampling (duplicate minority)</SelectItem>
            <SelectItem value="undersample">Undersampling (reduce majority)</SelectItem>
            <SelectItem value="hybrid">Hybrid (over + under sampling)</SelectItem>
            <SelectItem value="smote">SMOTE (synthetic minority)</SelectItem>
            <SelectItem value="adasyn">ADASYN (adaptive synthetic)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-class">Target Class</Label>
        <Select
          value={balancingOptions.targetClass || (targetClassName || '')}
          onValueChange={handleTargetClassChange}
        >
          <SelectTrigger id="target-class">
            <SelectValue placeholder="Select target class" />
          </SelectTrigger>
          <SelectContent>
            {availableClasses.map(className => (
              <SelectItem key={className} value={className}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="target-ratio">Target Ratio: {balancingOptions.targetRatio || 1}</Label>
        </div>
        <Slider
          id="target-ratio"
          min={0.1}
          max={2}
          step={0.1}
          value={[balancingOptions.targetRatio || 1]}
          onValueChange={handleTargetRatioChange}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          checked={balancingOptions.preserveMinority || false}
          onCheckedChange={handlePreserveMinorityChange}
          id="preserve-minority"
        />
        <Label htmlFor="preserve-minority">Preserve minority samples</Label>
      </div>

      <Button 
        onClick={onApplyBalancing} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Balancing...' : 'Apply Balancing'}
      </Button>
    </div>
  );
};

export default DataBalancingControls;
