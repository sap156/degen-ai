
import React, { useState } from 'react';
import { Bot, Brain, BarChart, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatasetAnalysis, DatasetPreferences } from '@/services/aiDatasetAnalysisService';

interface AIDatasetAnalysisProps {
  datasetAnalysis: DatasetAnalysis | null;
  preferences: DatasetPreferences | null;
  apiKeyAvailable: boolean;
  onRequestAnalysis: () => void;
  isLoading: boolean;
  aiRecommendations?: string | null;
}

const AIDatasetAnalysis: React.FC<AIDatasetAnalysisProps> = ({
  datasetAnalysis,
  preferences,
  apiKeyAvailable,
  onRequestAnalysis,
  isLoading,
  aiRecommendations = null,
}) => {
  const [desiredOutcome, setDesiredOutcome] = useState<string>('balanced');
  const [modelPreference, setModelPreference] = useState<string>('auto');
  
  const handleAnalysisRequest = () => {
    if (onRequestAnalysis) {
      onRequestAnalysis();
    }
  };
  
  if (!datasetAnalysis || !preferences) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Configure Dataset First</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Please complete the dataset configuration to enable AI analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          AI-Powered Dataset Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!apiKeyAvailable && (
          <Alert>
            <AlertDescription>
              OpenAI API key is required for AI-powered analysis.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Desired Performance Outcome</Label>
            <RadioGroup 
              defaultValue={desiredOutcome} 
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
            <Select defaultValue={modelPreference} onValueChange={setModelPreference}>
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
        
        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center text-sm">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing dataset and generating recommendations...
            </div>
            <Progress value={70} className="h-2" />
          </div>
        ) : aiRecommendations ? (
          <div className="space-y-4 mt-6">
            <Tabs defaultValue="recommendations">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="analysis">Data Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recommendations" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h3 className="font-medium">AI Recommendations</h3>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-line">
                    {aiRecommendations}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analysis" className="space-y-4 pt-4">
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center">
                    <BarChart className="h-4 w-4 mr-2 text-blue-500" />
                    Class Distribution
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium">
                      <div>Class</div>
                      <div>Count</div>
                      <div>Percentage</div>
                      <div></div>
                    </div>
                    <Separator />
                    {preferences.classLabels.map((className) => {
                      const isMajority = className === preferences.majorityClass;
                      const isMinority = className === preferences.minorityClass;
                      
                      return (
                        <div key={className} className="grid grid-cols-4 gap-2 text-sm items-center">
                          <div className="flex items-center">
                            {className}
                            {isMajority && (
                              <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50">Majority</Badge>
                            )}
                            {isMinority && (
                              <Badge variant="outline" className="ml-2 text-[10px] bg-amber-50">Minority</Badge>
                            )}
                          </div>
                          <div>-</div>
                          <div>-</div>
                          <div></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">Ready for AI Analysis</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Run AI analysis to get recommendations for handling your imbalanced dataset based on your preferences.
            </p>
          </div>
        )}
      </CardContent>
      
      {!aiRecommendations && !isLoading && (
        <CardFooter className="pt-2">
          <Button 
            className="w-full" 
            onClick={handleAnalysisRequest}
            disabled={!apiKeyAvailable || !preferences || isLoading}
          >
            <Brain className="mr-2 h-4 w-4" />
            Analyze with AI
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AIDatasetAnalysis;
