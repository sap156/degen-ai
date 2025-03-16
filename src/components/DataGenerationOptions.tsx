
import React from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface DataGenerationOptionsProps {
  generationMode: 'new' | 'append';
  onGenerationModeChange: (mode: 'new' | 'append') => void;
  hasExistingData: boolean;
}

const DataGenerationOptions: React.FC<DataGenerationOptionsProps> = ({
  generationMode,
  onGenerationModeChange,
  hasExistingData
}) => {
  if (!hasExistingData) {
    return null;
  }

  return (
    <div className="border p-4 rounded-md space-y-3">
      <Label className="font-medium">Data Generation Mode</Label>
      <RadioGroup 
        value={generationMode} 
        onValueChange={(value) => onGenerationModeChange(value as 'new' | 'append')}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="option-new" />
          <Label htmlFor="option-new" className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate new data based on schema
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="append" id="option-append" />
          <Label htmlFor="option-append" className="flex items-center">
            <ArrowDown className="h-4 w-4 mr-2" />
            Append to existing dataset
          </Label>
        </div>
      </RadioGroup>
      <p className="text-xs text-muted-foreground">
        {generationMode === 'new' 
          ? "Generate a completely new dataset based on detected schema" 
          : "Add new data points continuing from the end of your existing dataset"}
      </p>
    </div>
  );
};

export default DataGenerationOptions;
