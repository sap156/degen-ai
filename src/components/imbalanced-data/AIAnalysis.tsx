
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, RefreshCw } from 'lucide-react';

interface AIAnalysisProps {
  apiKeyAvailable: boolean;
  onAnalyze: (options: { 
    desiredOutcome: string; 
    modelPreference: string;
  }) => void;
  isAnalyzing: boolean;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({
  apiKeyAvailable,
  onAnalyze,
  isAnalyzing
}) => {
  const [desiredOutcome, setDesiredOutcome] = useState('balanced');
  const [modelPreference, setModelPreference] = useState('auto');

  const handleAnalyze = () => {
    onAnalyze({
      desiredOutcome,
      modelPreference
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          AI-Powered Dataset Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apiKeyAvailable && (
          <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm mb-2">
            <p className="font-medium">OpenAI API Key Required</p>
            <p className="mt-1">Set your OpenAI API key in the settings to enable AI-powered analysis features.</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Desired Performance Outcome</Label>
            <RadioGroup 
              value={desiredOutcome} 
              onValueChange={setDesiredOutcome}
              className="grid grid-cols-1 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="balanced" />
                <Label htmlFor="balanced">Balanced precision and recall</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="precision" id="precision" />
                <Label htmlFor="precision">Maximize precision (reduce false positives)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recall" id="recall" />
                <Label htmlFor="recall">Maximize recall on minority class (reduce false negatives)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="f1" id="f1" />
                <Label htmlFor="f1">Optimize F1 score</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Model Preference</Label>
            <Select value={modelPreference} onValueChange={setModelPreference}>
              <SelectTrigger>
                <SelectValue placeholder="Select model preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (AI-recommended)</SelectItem>
                <SelectItem value="tree">Tree-based models (XGBoost, RF)</SelectItem>
                <SelectItem value="linear">Linear models (Logistic, SVM)</SelectItem>
                <SelectItem value="neural">Neural Networks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">Ready for AI Analysis</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Run AI analysis to get recommendations for handling your imbalanced dataset based on your preferences.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleAnalyze}
          disabled={!apiKeyAvailable || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Analyze with AI
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIAnalysis;
