
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MaskingFieldControlProps {
  field: string;
  enabled: boolean;
  onToggle: () => void;
}

const MaskingFieldControl: React.FC<MaskingFieldControlProps> = ({
  field,
  enabled,
  onToggle
}) => {
  const fieldDisplayName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  
  return (
    <div className="border rounded-md p-3 mb-2">
      <div className="flex justify-between items-center">
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
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span>PII Field</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>This field contains personal identifiable information</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default MaskingFieldControl;
