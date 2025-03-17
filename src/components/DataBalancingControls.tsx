
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Download, RefreshCw, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { BalancingOptions } from '@/services/imbalancedDataService';
import { DatasetInfo } from '@/services/imbalancedDataService';

export interface DataBalancingControlsProps {
  originalDataset: DatasetInfo;
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
  const [balancingMethod, setBalancingMethod] = useState<'oversampling' | 'undersampling' | 'smote' | 'adasyn'>('oversampling');
  const [targetRatio, setTargetRatio] = useState<number>(1.0);
  const [useCustomWeights, setUseCustomWeights] = useState<boolean>(false);
  const [classWeights, setClassWeights] = useState<Record<string, number>>({});
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  
  const handleBalanceClick = () => {
    const options: BalancingOptions = {
      method: balancingMethod,
      targetRatio: targetRatio,
      customWeights: useCustomWeights ? classWeights : undefined
    };
    
    onBalanceDataset(options, parsedData);
    toast.success('Balancing data with selected options');
  };
  
  const handleDownload = () => {
    if (!hasBalancedData) {
      toast.error('No balanced data available to download');
      return;
    }
    
    onDownloadBalanced(exportFormat);
  };
  
  const renderClassWeightControls = () => {
    if (!originalDataset?.classes || originalDataset.classes.length === 0) {
      return <p className="text-muted-foreground">No class data available</p>;
    }
    
    return (
      <div className="space-y-2">
        {originalDataset.classes.map((cls, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Label className="w-24 flex-shrink-0">{cls.name}</Label>
            <Slider
              value={[classWeights[cls.name] || 1.0]}
              min={0.1}
              max={2}
              step={0.1}
              disabled={!useCustomWeights}
              onValueChange={(value) => {
                setClassWeights({ ...classWeights, [cls.name]: value[0] });
              }}
            />
            <span className="w-12 text-right text-sm">{classWeights[cls.name] || 1.0}</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Scale className="h-5 w-5 mr-2" />
          Data Balancing Options
        </CardTitle>
        <CardDescription>
          Adjust class distribution to improve model performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="balancing-method">Balancing Method</Label>
          <Select 
            value={balancingMethod} 
            onValueChange={(value: 'oversampling' | 'undersampling' | 'smote' | 'adasyn') => setBalancingMethod(value)}
          >
            <SelectTrigger id="balancing-method">
              <SelectValue placeholder="Select a method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oversampling">Oversampling</SelectItem>
              <SelectItem value="undersampling">Undersampling</SelectItem>
              <SelectItem value="smote">SMOTE</SelectItem>
              <SelectItem value="adasyn">ADASYN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="target-ratio">Target Ratio: {targetRatio.toFixed(2)}</Label>
          </div>
          <Slider
            id="target-ratio"
            value={[targetRatio]}
            min={0.1}
            max={1}
            step={0.05}
            onValueChange={(value) => setTargetRatio(value[0])}
          />
          <p className="text-xs text-muted-foreground">
            1.0 = perfect balance, lower values = maintain some imbalance
          </p>
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <Switch 
            id="use-custom-weights" 
            checked={useCustomWeights} 
            onCheckedChange={setUseCustomWeights}
          />
          <Label htmlFor="use-custom-weights">Use custom class weights</Label>
        </div>
        
        {useCustomWeights && (
          <div className="bg-muted/40 p-3 rounded-md mt-2">
            {renderClassWeightControls()}
          </div>
        )}
        
        {aiRecommendationsAvailable && (
          <Toggle
            variant="outline"
            pressed={showRecommendations}
            onPressedChange={setShowRecommendations}
            className="mt-2"
          >
            Show AI recommendations
          </Toggle>
        )}
        
        {showRecommendations && aiRecommendationsAvailable && (
          <div className="bg-muted/40 p-3 rounded-md text-sm space-y-2">
            <h4 className="font-medium">AI Recommendations</h4>
            <p>For this dataset, we recommend using SMOTE with a target ratio of 0.8.</p>
            <p>The minority class would benefit from synthetic samples rather than duplicates.</p>
            <div className="flex justify-end">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  setBalancingMethod('smote');
                  setTargetRatio(0.8);
                  toast.info('Applied AI recommendations');
                }}
              >
                Apply recommendations
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Select value={exportFormat} onValueChange={(value: 'json' | 'csv') => setExportFormat(value as 'json' | 'csv')}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!hasBalancedData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        <Button onClick={handleBalanceClick}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Balance Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataBalancingControls;
