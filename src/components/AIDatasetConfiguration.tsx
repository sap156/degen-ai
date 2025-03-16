
import React, { useState } from 'react';
import { Bot, ChevronRight, Sparkles, BarChart, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { DatasetAnalysis, DatasetPreferences } from '@/services/aiDatasetAnalysisService';

interface AIDatasetConfigurationProps {
  datasetAnalysis: DatasetAnalysis | null;
  isLoading: boolean;
  onConfigurationComplete: (preferences: DatasetPreferences) => void;
  apiKeyAvailable: boolean;
}

const AIDatasetConfiguration: React.FC<AIDatasetConfigurationProps> = ({
  datasetAnalysis,
  isLoading,
  onConfigurationComplete,
  apiKeyAvailable,
}) => {
  const [step, setStep] = useState<number>(1);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [classLabels, setClassLabels] = useState<string[]>([]);
  const [majorityClass, setMajorityClass] = useState<string>('');
  const [minorityClass, setMinorityClass] = useState<string>('');
  const [datasetContext, setDatasetContext] = useState<string>('');
  const [newClassName, setNewClassName] = useState<string>('');
  
  const handleAddClass = () => {
    if (newClassName.trim() && !classLabels.includes(newClassName.trim())) {
      setClassLabels([...classLabels, newClassName.trim()]);
      setNewClassName('');
    }
  };
  
  const handleRemoveClass = (className: string) => {
    setClassLabels(classLabels.filter(c => c !== className));
    if (majorityClass === className) setMajorityClass('');
    if (minorityClass === className) setMinorityClass('');
  };
  
  const handleComplete = () => {
    const preferences: DatasetPreferences = {
      targetColumn,
      classLabels,
      majorityClass,
      minorityClass,
      datasetContext,
    };
    
    onConfigurationComplete(preferences);
    setStep(4); // Move to completion step
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const resetConfiguration = () => {
    setStep(1);
  };
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Bot className="mr-2 h-4 w-4 animate-spin" />
              Analyzing dataset structure...
            </div>
            <Progress value={70} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          Dataset Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!apiKeyAvailable && (
          <Alert>
            <AlertDescription>
              OpenAI API key is recommended for better dataset analysis.
            </AlertDescription>
          </Alert>
        )}
        
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 1: Target Column</h3>
            <div className="space-y-2">
              <Label htmlFor="targetColumn">Class/Target Column Name</Label>
              <Input 
                id="targetColumn" 
                placeholder="e.g., class, label, target, y"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is the column that contains your class labels
              </p>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 2: Class Labels</h3>
            <div className="space-y-2">
              <Label>Add Class Labels</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter class name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddClass();
                    }
                  }}
                />
                <Button onClick={handleAddClass}>Add</Button>
              </div>
            </div>
            
            {classLabels.length > 0 && (
              <div className="space-y-2">
                <Label>Current Class Labels</Label>
                <div className="border rounded-md p-3 space-y-2">
                  {classLabels.map((className) => (
                    <div key={className} className="flex items-center justify-between">
                      <span>{className}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveClass(className)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium">Step 3: Class Distribution</h3>
            
            {classLabels.length >= 2 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="majorityClass">Majority Class</Label>
                  <Select value={majorityClass} onValueChange={setMajorityClass}>
                    <SelectTrigger id="majorityClass">
                      <SelectValue placeholder="Select majority class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classLabels.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minorityClass">Minority Class</Label>
                  <Select value={minorityClass} onValueChange={setMinorityClass}>
                    <SelectTrigger id="minorityClass">
                      <SelectValue placeholder="Select minority class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classLabels.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="datasetContext">Dataset Context (Optional)</Label>
                  <Textarea
                    id="datasetContext"
                    placeholder="e.g., Credit card fraud detection, medical diagnosis, customer churn prediction"
                    value={datasetContext}
                    onChange={(e) => setDatasetContext(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Please add at least two class labels in the previous step.
                </p>
              </div>
            )}
          </div>
        )}
        
        {step === 4 && (
          <div className="space-y-4 py-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Configuration Complete</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your dataset configuration has been saved. You can now proceed with AI analysis.
            </p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={resetConfiguration}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Reconfigure Dataset
            </Button>
          </div>
        )}
      </CardContent>
      
      {step < 4 && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            onClick={() => {
              if (step < 3) {
                setStep(step + 1);
              } else {
                handleComplete();
              }
            }}
            disabled={
              (step === 1 && !targetColumn) ||
              (step === 2 && classLabels.length < 2) ||
              (step === 3 && (!majorityClass || !minorityClass))
            }
          >
            {step === 3 ? (
              <>
                Complete
                <Sparkles className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AIDatasetConfiguration;
