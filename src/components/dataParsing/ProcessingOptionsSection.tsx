
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { ProcessingType } from '@/services/textProcessingService';

interface ProcessingTypeOption {
  type: ProcessingType;
  label: string;
  icon: React.ReactNode;
}

interface ProcessingOptionsSectionProps {
  selectedProcessingTypes: ProcessingType[];
  processingDetailLevel: 'brief' | 'standard' | 'detailed';
  processingOutputFormat: 'json' | 'text';
  userContext: string;
  isLoading: boolean;
  onProcessingTypeToggle: (type: ProcessingType) => void;
  onDetailLevelChange: (level: 'brief' | 'standard' | 'detailed') => void;
  onOutputFormatChange: (format: 'json' | 'text') => void;
  onUserContextChange: (context: string) => void;
  onProcessWithAI: () => void;
  renderProcessingTypeIcon: (type: ProcessingType) => React.ReactNode;
  renderProcessingTypeLabel: (type: ProcessingType) => string;
}

const ProcessingOptionsSection: React.FC<ProcessingOptionsSectionProps> = ({
  selectedProcessingTypes,
  processingDetailLevel,
  processingOutputFormat,
  userContext,
  isLoading,
  onProcessingTypeToggle,
  onDetailLevelChange,
  onOutputFormatChange,
  onUserContextChange,
  onProcessWithAI,
  renderProcessingTypeIcon,
  renderProcessingTypeLabel
}) => {
  const processingTypes: ProcessingType[] = [
    'structuring', 'cleaning', 'ner', 'topics', 'summarization', 'sentiment', 'tagging'
  ];
  
  return (
    <div>
      <Label className="text-lg font-medium">AI Processing Options</Label>
      <div className="bg-muted/30 p-4 rounded-md mt-2 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Processing Types</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {processingTypes.map(type => (
              <div className="flex items-center space-x-2" key={type}>
                <Checkbox 
                  id={`process-${type}`} 
                  checked={selectedProcessingTypes.includes(type)} 
                  onCheckedChange={() => onProcessingTypeToggle(type)} 
                />
                <label 
                  htmlFor={`process-${type}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                >
                  {renderProcessingTypeIcon(type)}
                  <span className="ml-1">{renderProcessingTypeLabel(type)}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Detail Level</p>
          <div className="flex space-x-2">
            {(['brief', 'standard', 'detailed'] as const).map(level => (
              <Button 
                key={level} 
                variant={processingDetailLevel === level ? "default" : "outline"} 
                size="sm" 
                onClick={() => onDetailLevelChange(level)} 
                className="text-xs"
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Output Format</p>
          <div className="flex space-x-2">
            {(['json', 'text'] as const).map(format => (
              <Button 
                key={format} 
                variant={processingOutputFormat === format ? "default" : "outline"} 
                size="sm" 
                onClick={() => onOutputFormatChange(format)} 
                className="text-xs"
              >
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="userContext" className="text-sm font-medium">Additional Context (Optional)</Label>
          <Textarea 
            id="userContext" 
            placeholder="Add any specific instructions or context for the AI to consider..." 
            value={userContext} 
            onChange={e => onUserContextChange(e.target.value)} 
            className="h-20" 
          />
        </div>
        
        <Button 
          onClick={onProcessWithAI} 
          className="w-full" 
          disabled={isLoading || selectedProcessingTypes.length === 0}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Process with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProcessingOptionsSection;
