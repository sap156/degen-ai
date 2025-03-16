
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clipboard, ClipboardCheck, FileText, Lock, ShieldCheck, ScissorsLineDashed, Sparkles, X } from 'lucide-react';
import { MaskingTechnique } from '@/services/piiHandlingService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

interface MaskingFieldControlProps {
  field: string;
  enabled: boolean;
  maskingTechnique: MaskingTechnique;
  customPrompt?: string;
  onToggle: () => void;
  onTechniqueChange: (technique: MaskingTechnique) => void;
  onCustomPromptChange: (prompt: string) => void;
  onRemoveField?: () => void;
  canRemove?: boolean;
}

const MaskingFieldControl: React.FC<MaskingFieldControlProps> = ({
  field,
  enabled,
  maskingTechnique,
  customPrompt = '',
  onToggle,
  onTechniqueChange,
  onCustomPromptChange,
  onRemoveField,
  canRemove = false
}) => {
  const [showCustomPrompt, setShowCustomPrompt] = React.useState(!!customPrompt);
  
  const fieldDisplayName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  
  return (
    <div className="border rounded-md p-3 mb-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`mask-${field}`} 
            checked={enabled} 
            onCheckedChange={onToggle} 
          />
          <Label 
            htmlFor={`mask-${field}`} 
            className="font-medium cursor-pointer"
          >
            {fieldDisplayName}
          </Label>
        </div>
        
        {canRemove && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={onRemoveField}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove field</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {enabled && (
        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <Label htmlFor={`technique-${field}`} className="text-xs">Masking Technique</Label>
            <Select 
              value={maskingTechnique}
              onValueChange={(value) => onTechniqueChange(value as MaskingTechnique)}
            >
              <SelectTrigger id={`technique-${field}`} className="w-full h-8 text-sm">
                <SelectValue placeholder="Select technique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="character-masking">
                  <div className="flex items-center">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    <span>Character Masking</span>
                  </div>
                </SelectItem>
                <SelectItem value="truncation">
                  <div className="flex items-center">
                    <ScissorsLineDashed className="mr-2 h-4 w-4" />
                    <span>Truncation</span>
                  </div>
                </SelectItem>
                <SelectItem value="tokenization">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Tokenization</span>
                  </div>
                </SelectItem>
                <SelectItem value="encryption">
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Encryption</span>
                  </div>
                </SelectItem>
                <SelectItem value="redaction">
                  <div className="flex items-center">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Data Redaction</span>
                  </div>
                </SelectItem>
                <SelectItem value="synthetic-replacement">
                  <div className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Synthetic Replacement</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col justify-end h-full">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor={`custom-prompt-toggle-${field}`} className="text-xs">Custom Instructions</Label>
              <Switch 
                id={`custom-prompt-toggle-${field}`}
                checked={showCustomPrompt}
                onCheckedChange={setShowCustomPrompt}
                className="h-4 w-8"
              />
            </div>
          </div>
          
          <div className="flex-1">
            {showCustomPrompt ? (
              <Input
                id={`custom-prompt-${field}`}
                value={customPrompt}
                onChange={(e) => onCustomPromptChange(e.target.value)}
                placeholder={`Instructions for ${fieldDisplayName.toLowerCase()}`}
                className="h-8 text-xs w-full"
              />
            ) : (
              <div className="h-8"></div> // Spacer when input is hidden
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaskingFieldControl;
