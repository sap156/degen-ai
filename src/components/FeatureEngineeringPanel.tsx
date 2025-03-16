
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Wand2, Check, X, Plus, Code, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { DatasetPreferences } from '@/services/aiDataAnalysisService';

interface FeatureEngineeringPanelProps {
  preferences: DatasetPreferences;
  apiKeyAvailable: boolean;
  onApplyFeatureEngineering: (selectedFeatures: string[]) => void;
  featureSuggestions?: {
    suggestedFeatures: Array<{name: string; description: string; formula: string}>;
    expectedImpact: string;
  } | null;
  loading?: boolean;
}

const FeatureEngineeringPanel: React.FC<FeatureEngineeringPanelProps> = ({
  preferences,
  apiKeyAvailable,
  onApplyFeatureEngineering,
  featureSuggestions = null,
  loading = false,
}) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const handleToggleFeature = (featureName: string) => {
    if (selectedFeatures.includes(featureName)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== featureName));
    } else {
      setSelectedFeatures([...selectedFeatures, featureName]);
    }
  };
  
  const handleApplyFeatures = () => {
    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature to apply");
      return;
    }
    
    onApplyFeatureEngineering(selectedFeatures);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Wand2 className="mr-2 h-5 w-5 text-primary" />
          Feature Engineering
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!apiKeyAvailable && (
          <Alert>
            <AlertDescription>
              OpenAI API key is required for AI-assisted feature engineering.
            </AlertDescription>
          </Alert>
        )}
        
        {loading && (
          <div className="space-y-3 py-4">
            <div className="flex items-center text-sm">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing data and generating feature suggestions...
            </div>
            <Progress value={70} className="h-2" />
          </div>
        )}
        
        {featureSuggestions && (
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-medium mb-1">Expected Impact:</p>
              <p className="text-muted-foreground">{featureSuggestions.expectedImpact}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <p className="text-sm font-medium">Suggested Features:</p>
              
              {featureSuggestions.suggestedFeatures.map((feature, index) => (
                <div key={index} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id={`feature-${index}`}
                        checked={selectedFeatures.includes(feature.name)}
                        onCheckedChange={() => handleToggleFeature(feature.name)}
                      />
                      <Label htmlFor={`feature-${index}`} className="font-medium">
                        {feature.name}
                      </Label>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.formula.includes('+') ? 'Addition' :
                       feature.formula.includes('-') ? 'Subtraction' :
                       feature.formula.includes('*') ? 'Multiplication' :
                       feature.formula.includes('/') ? 'Division' :
                       feature.formula.includes('log') ? 'Logarithm' : 'Transform'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground pl-7">
                    {feature.description}
                  </p>
                  
                  <div className="bg-muted/50 text-xs rounded p-2 font-mono pl-7">
                    {feature.formula}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!featureSuggestions && !loading && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Code className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No Feature Suggestions Yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Run AI analysis to get feature engineering suggestions that could improve your model's 
              performance on imbalanced data.
            </p>
          </div>
        )}
      </CardContent>
      
      {featureSuggestions && (
        <CardFooter className="pt-2">
          <Button 
            className="w-full" 
            disabled={selectedFeatures.length === 0}
            onClick={handleApplyFeatures}
          >
            <Plus className="mr-2 h-4 w-4" />
            Apply Selected Features ({selectedFeatures.length})
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FeatureEngineeringPanel;
