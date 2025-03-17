
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, ArrowLeft, Check } from 'lucide-react';

interface DatasetConfigurationProps {
  onComplete: (context: string) => void;
  onBack: () => void;
}

const DatasetConfiguration: React.FC<DatasetConfigurationProps> = ({
  onComplete,
  onBack
}) => {
  const [datasetContext, setDatasetContext] = useState('');

  const handleSubmit = () => {
    onComplete(datasetContext);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5 text-primary" />
          Dataset Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">3</div>
              <h3 className="text-base font-medium">Add Context (Optional)</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="datasetContext">Dataset Context</Label>
              <p className="text-sm text-muted-foreground">
                Providing context about your data helps our AI provide more relevant recommendations. For example:
                "customer churn prediction", "fraud detection", "medical diagnosis".
              </p>
              <Textarea
                id="datasetContext"
                placeholder="Describe what this dataset represents and what you're trying to predict..."
                className="min-h-[120px]"
                value={datasetContext}
                onChange={(e) => setDatasetContext(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Complete Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatasetConfiguration;
