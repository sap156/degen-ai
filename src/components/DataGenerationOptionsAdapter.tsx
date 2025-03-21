
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, ArrowUpDown, ArrowDown, Lightbulb } from 'lucide-react';

interface DataGenerationOptionsAdapterProps {
  isLoading: boolean;
  handleAugment: (method: string) => Promise<void>;
}

const DataGenerationOptionsAdapter: React.FC<DataGenerationOptionsAdapterProps> = ({
  isLoading,
  handleAugment
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wand2 className="mr-2 h-5 w-5 text-blue-500" />
            Noise Injection
          </CardTitle>
          <CardDescription>
            Add random noise to data fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Adds controlled random variations to numeric fields while preserving data patterns and distributions.
          </p>
          <Button 
            onClick={() => handleAugment('noise')} 
            disabled={isLoading}
            className="w-full"
          >
            Apply Noise
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowUpDown className="mr-2 h-5 w-5 text-blue-500" />
            Scaling & Transformation
          </CardTitle>
          <CardDescription>
            Scale or transform data values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Applies statistical scaling or mathematical transformations to data fields to improve model training.
          </p>
          <Button 
            onClick={() => handleAugment('scaling')} 
            disabled={isLoading}
            className="w-full"
          >
            Apply Scaling
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowDown className="mr-2 h-5 w-5 text-blue-500" />
            Outlier Generation
          </CardTitle>
          <CardDescription>
            Generate synthetic outliers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Creates controlled outliers to test model robustness and boundary conditions.
          </p>
          <Button 
            onClick={() => handleAugment('outliers')} 
            disabled={isLoading}
            className="w-full"
          >
            Generate Outliers
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataGenerationOptionsAdapter;
