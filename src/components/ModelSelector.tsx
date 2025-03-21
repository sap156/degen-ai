
import React from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const modelInfo: Record<string, {
  name: string;
  limitations: string[];
}> = {
  'gpt-4o': {
    name: 'GPT-4o (Recommended)',
    limitations: [
      'Most advanced model with strong performance across various tasks.',
      'Best balance of capabilities and efficiency.',
      'Supports vision and has a large context window.'
    ]
  },
  
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo (Next Best)',
    limitations: [
      'Slightly reduced context window and token limits compared to GPT-4.',
      'Occasionally sacrifices minor accuracy in complex reasoning tasks for speed.',
      'Best balance of cost, performance, and accuracy.'
    ]
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo (Cheapest Option)',
    limitations: [
      'Less accurate on complex reasoning or detailed instructions compared to GPT-4 models.',
      'Smaller context window, potentially limiting detailed tasks.',
      'Occasionally requires additional prompt-engineering effort to reach desired output quality.'
    ]
  },

  'gpt-4': {
    name: 'GPT-4 (Not Recommended)',
    limitations: [
      'Highest cost per token among available models.',
      'Slower response time due to computational complexity.',
      'May exceed resource quotas quickly, especially with large tasks.'
    ]
  },
  'fallback': {
    name: 'Unknown Model',
    limitations: [
      'This model isn\'t recognized or may not be available.',
      'Please select a different model from the dropdown.',
      'Using an unsupported model may result in errors or unexpected behavior.'
    ]
  }
};

const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel, isKeySet, availableModels } = useApiKey();

  // Ensure we have valid model info for the selected model
  const safeModelInfo = modelInfo[selectedModel] || modelInfo['fallback'];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <span>AI Model</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
              <Info className="h-3.5 w-3.5" />
              <span className="sr-only">Model information</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2 text-sm">
              <p className="font-medium">About OpenAI Models</p>
              <p>Select an AI model that best fits your needs. More powerful models offer better reasoning but may cost more or have longer response times.</p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <Select
        value={selectedModel}
        onValueChange={(value) => setSelectedModel(value as typeof selectedModel)}
        disabled={!isKeySet}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent position="popper" className="w-full">
          {availableModels.map((modelId) => (
            <SelectItem key={modelId} value={modelId} className="py-2.5">
              <span>{modelInfo[modelId]?.name || modelId}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedModel && (
        <Card className="mt-3 bg-secondary/20 border-dashed">
          <CardContent className="p-4 text-sm space-y-3">
            <p className="font-medium">{safeModelInfo.name} Limitations:</p>
            <ul className="space-y-2 list-disc pl-5">
              {safeModelInfo.limitations.map((limitation, i) => (
                <li key={i} className="text-muted-foreground">{limitation}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModelSelector;
