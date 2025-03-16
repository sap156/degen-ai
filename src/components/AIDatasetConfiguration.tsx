
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Database, ArrowLeft } from 'lucide-react';
import { DatasetAnalysis, DatasetPreferences } from '@/services/aiDatasetAnalysisService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AIDatasetConfigurationProps {
  datasetAnalysis: DatasetAnalysis | null;
  isLoading: boolean;
  onConfigurationComplete: (preferences: DatasetPreferences) => void;
  apiKeyAvailable: boolean;
  onBackToUpload?: () => void;
}

const AIDatasetConfiguration: React.FC<AIDatasetConfigurationProps> = ({
  datasetAnalysis,
  isLoading,
  onConfigurationComplete,
  apiKeyAvailable,
  onBackToUpload
}) => {
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [classLabels, setClassLabels] = useState<string[]>([]);
  const [majorityClass, setMajorityClass] = useState<string>('');
  const [minorityClass, setMinorityClass] = useState<string>('');
  const [datasetContext, setDatasetContext] = useState<string>('');
  
  useEffect(() => {
    if (datasetAnalysis) {
      // Using optional chaining with the detectedTarget property
      setTargetColumn(datasetAnalysis.detectedTarget || '');
      
      // Initialize class labels as empty array since it's not in DatasetAnalysis
      setClassLabels([]);
    }
  }, [datasetAnalysis]);
  
  const handleSaveConfiguration = () => {
    if (!targetColumn || classLabels.length === 0 || !majorityClass || !minorityClass) {
      alert('Please fill in all required fields.');
      return;
    }
    
    const preferences: DatasetPreferences = {
      targetColumn,
      classLabels,
      majorityClass,
      minorityClass,
      datasetContext
    };
    
    onConfigurationComplete(preferences);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Database className="mr-2 h-5 w-5 text-primary" />
          Dataset Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Back navigation button */}
        {onBackToUpload && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-2" 
            onClick={onBackToUpload}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upload
          </Button>
        )}
        
        {!apiKeyAvailable && (
          <Alert>
            <AlertDescription>
              OpenAI API key is required for AI-powered analysis.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="targetColumn">Target Column</Label>
            <Input
              id="targetColumn"
              type="text"
              placeholder="Name of the target column"
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="classLabels">Class Labels (comma-separated)</Label>
            <Input
              id="classLabels"
              type="text"
              placeholder="List of class labels"
              value={classLabels.join(', ')}
              onChange={(e) => setClassLabels(e.target.value.split(',').map(s => s.trim()))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="majorityClass">Majority Class</Label>
              <Select onValueChange={setMajorityClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select majority class" />
                </SelectTrigger>
                <SelectContent>
                  {classLabels.map((label) => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minorityClass">Minority Class</Label>
              <Select onValueChange={setMinorityClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select minority class" />
                </SelectTrigger>
                <SelectContent>
                  {classLabels.map((label) => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="datasetContext">Dataset Context (optional)</Label>
            <Textarea
              id="datasetContext"
              placeholder="Describe the dataset and its purpose"
              value={datasetContext}
              onChange={(e) => setDatasetContext(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          onClick={handleSaveConfiguration}
          disabled={isLoading}
        >
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIDatasetConfiguration;
