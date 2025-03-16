import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Brain, BarChart4, Target, Wand2, Sliders, Layers, DatabaseBackup, ChevronDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DatasetPreferences, 
  PerformancePreferences, 
  ModelOptions 
} from '@/services/aiDataAnalysisService';

interface AIDatasetAnalysisProps {
  preferences: DatasetPreferences;
  apiKeyAvailable: boolean;
  onAnalysisComplete: (
    performancePrefs: PerformancePreferences,
    modelOptions: ModelOptions
  ) => void;
  loading?: boolean;
  aiAnalysis?: {
    analysis: string;
    recommendations: string;
    suggestedMethods: string[];
    featureImportance?: Record<string, number>;
    modelRecommendations?: string[];
  } | null;
}

const AIDatasetAnalysis: React.FC<AIDatasetAnalysisProps> = ({
  preferences,
  apiKeyAvailable,
  onAnalysisComplete,
  loading = false,
  aiAnalysis = null,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<{
    performancePrefs: PerformancePreferences;
    modelOptions: ModelOptions;
  }>({
    defaultValues: {
      performancePrefs: {
        desiredOutcome: 'balanced',
        priorityMetrics: ['f1_score'],
        explainabilityRequired: false,
      },
      modelOptions: {
        enableFeatureEngineering: true,
        syntheticDataPreferences: {
          enabled: false,
          volume: 100,
          diversity: 'medium',
        },
      }
    }
  });

  const priorityMetrics = watch('performancePrefs.priorityMetrics');
  const syntheticEnabled = watch('modelOptions.syntheticDataPreferences.enabled');
  const featureEngineeringEnabled = watch('modelOptions.enableFeatureEngineering');
  
  const handleMetricToggle = (metric: string) => {
    const current = priorityMetrics || [];
    if (current.includes(metric)) {
      setValue('performancePrefs.priorityMetrics', current.filter(m => m !== metric));
    } else {
      setValue('performancePrefs.priorityMetrics', [...current, metric]);
    }
  };

  const handleSubmitPreferences = (data: {
    performancePrefs: PerformancePreferences;
    modelOptions: ModelOptions;
  }) => {
    if (!apiKeyAvailable) {
      toast.error("OpenAI API key is required for AI analysis. Please set it up first.");
      return;
    }
    
    onAnalysisComplete(data.performancePrefs, data.modelOptions);
  };

  const formatFeatureImportance = () => {
    if (!aiAnalysis?.featureImportance) return [];
    
    return Object.entries(aiAnalysis.featureImportance)
      .sort((a, b) => b[1] - a[1])
      .map(([feature, importance]) => ({
        feature,
        importance: Math.round(importance * 100),
      }));
  };

  const featureImportance = formatFeatureImportance();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5 text-primary" />
          AI-Powered Dataset Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {!apiKeyAvailable && (
          <Alert>
            <AlertDescription>
              OpenAI API key is required for AI analysis. Please set it up first.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleSubmitPreferences)} className="space-y-6">
          <Accordion
            type="single"
            collapsible
            defaultValue="performance"
            className="w-full"
          >
            <AccordionItem value="performance">
              <AccordionTrigger className="py-4">
                <div className="flex items-center text-base font-medium">
                  <Target className="mr-2 h-5 w-5 text-blue-500" />
                  Performance Goals
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 px-1">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Desired Outcome</Label>
                    <RadioGroup 
                      defaultValue={watch('performancePrefs.desiredOutcome')}
                      onValueChange={(value) => 
                        setValue('performancePrefs.desiredOutcome', value as any)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="precision" id="precision" />
                        <Label htmlFor="precision">Highest precision</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="balanced" id="balanced" />
                        <Label htmlFor="balanced">Balanced recall & precision</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recall" id="recall" />
                        <Label htmlFor="recall">Highest recall on minority classes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="min_false_negatives" id="min_false_negatives" />
                        <Label htmlFor="min_false_negatives">Minimize false negatives</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="min_false_positives" id="min_false_positives" />
                        <Label htmlFor="min_false_positives">Minimize false positives</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Priority Metrics</Label>
                    <p className="text-sm text-muted-foreground">Select metrics that matter most to your use case</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="accuracy" 
                          checked={priorityMetrics?.includes('accuracy')}
                          onCheckedChange={() => handleMetricToggle('accuracy')}
                        />
                        <Label htmlFor="accuracy">Accuracy</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="precision_metric" 
                          checked={priorityMetrics?.includes('precision')}
                          onCheckedChange={() => handleMetricToggle('precision')}
                        />
                        <Label htmlFor="precision_metric">Precision</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="recall_metric" 
                          checked={priorityMetrics?.includes('recall')}
                          onCheckedChange={() => handleMetricToggle('recall')}
                        />
                        <Label htmlFor="recall_metric">Recall</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="f1_score" 
                          checked={priorityMetrics?.includes('f1_score')}
                          onCheckedChange={() => handleMetricToggle('f1_score')}
                        />
                        <Label htmlFor="f1_score">F1 Score</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="roc_auc" 
                          checked={priorityMetrics?.includes('roc_auc')}
                          onCheckedChange={() => handleMetricToggle('roc_auc')}
                        />
                        <Label htmlFor="roc_auc">ROC AUC</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="pr_auc" 
                          checked={priorityMetrics?.includes('pr_auc')}
                          onCheckedChange={() => handleMetricToggle('pr_auc')}
                        />
                        <Label htmlFor="pr_auc">PR AUC</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="explainability">Require model explainability</Label>
                      <Switch 
                        id="explainability"
                        checked={watch('performancePrefs.explainabilityRequired')}
                        onCheckedChange={(checked) => 
                          setValue('performancePrefs.explainabilityRequired', checked)
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prioritize models that can explain their predictions (may limit performance)
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="model">
              <AccordionTrigger className="py-4">
                <div className="flex items-center text-base font-medium">
                  <Layers className="mr-2 h-5 w-5 text-purple-500" />
                  Model & Feature Options
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 px-1">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="feature-engineering">AI-assisted Feature Engineering</Label>
                      <Switch 
                        id="feature-engineering"
                        checked={featureEngineeringEnabled}
                        onCheckedChange={(checked) => 
                          setValue('modelOptions.enableFeatureEngineering', checked)
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Let AI suggest new features to improve model performance on imbalanced data
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="synthetic-data">Generate Synthetic Data</Label>
                      <Switch 
                        id="synthetic-data"
                        checked={syntheticEnabled}
                        onCheckedChange={(checked) => 
                          setValue('modelOptions.syntheticDataPreferences.enabled', checked)
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Generate additional synthetic samples for minority classes
                    </p>
                  </div>

                  {syntheticEnabled && (
                    <div className="ml-6 space-y-4 mt-3 border-l-2 pl-4 border-primary/20">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="volume">Volume</Label>
                          <span className="text-sm text-muted-foreground">
                            {watch('modelOptions.syntheticDataPreferences.volume')} samples
                          </span>
                        </div>
                        <Slider
                          id="volume"
                          min={10}
                          max={500}
                          step={10}
                          defaultValue={[watch('modelOptions.syntheticDataPreferences.volume')]}
                          onValueChange={(values) => 
                            setValue('modelOptions.syntheticDataPreferences.volume', values[0])
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="diversity">Diversity</Label>
                        <Select 
                          value={watch('modelOptions.syntheticDataPreferences.diversity')}
                          onValueChange={(value) => 
                            setValue('modelOptions.syntheticDataPreferences.diversity', value as any)
                          }
                        >
                          <SelectTrigger id="diversity">
                            <SelectValue placeholder="Select diversity level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - More similar to original data</SelectItem>
                            <SelectItem value="medium">Medium - Balanced variation</SelectItem>
                            <SelectItem value="high">High - More creative variations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !apiKeyAvailable}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Run AI Analysis
                </>
              )}
            </Button>
          </div>
        </form>
        
        {aiAnalysis && (
          <div className="mt-6 space-y-4">
            <Separator />
            
            <div className="pt-2">
              <h3 className="text-lg font-medium flex items-center">
                <BarChart4 className="mr-2 h-5 w-5 text-primary" />
                AI Analysis Results
              </h3>
              
              <Tabs defaultValue="analysis" className="mt-4">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="space-y-4">
                  <div className="text-sm leading-relaxed">
                    {aiAnalysis.analysis.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  
                  {aiAnalysis.modelRecommendations && aiAnalysis.modelRecommendations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Recommended Models:</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.modelRecommendations.map((model, i) => (
                          <Badge key={i} variant={i === 0 ? "default" : "outline"}>
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recommendations" className="space-y-4">
                  <div className="text-sm leading-relaxed">
                    {aiAnalysis.recommendations.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  
                  {aiAnalysis.suggestedMethods && aiAnalysis.suggestedMethods.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Recommended Balancing Methods:</h4>
                      <div className="space-y-2">
                        {aiAnalysis.suggestedMethods.map((method, i) => (
                          <div key={i} className="flex items-center">
                            <div className="bg-primary/10 text-primary font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">
                              {i + 1}
                            </div>
                            <div>{method}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="features" className="space-y-4">
                  {featureImportance.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Feature Importance:</h4>
                      {featureImportance.map(({feature, importance}) => (
                        <div key={feature} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{feature}</span>
                            <span className="text-primary font-medium">{importance}%</span>
                          </div>
                          <Progress value={importance} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Feature importance information is not available.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDatasetAnalysis;
