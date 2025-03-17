
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import { DatasetInfo } from '@/services/imbalancedDataService';

interface DatasetInfoCardProps {
  datasetInfo: DatasetInfo;
  onGenerateRecommendations: () => void;
  isGeneratingRecommendations: boolean;
}

const DatasetInfoCard: React.FC<DatasetInfoCardProps> = ({ 
  datasetInfo, 
  onGenerateRecommendations,
  isGeneratingRecommendations
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Information</CardTitle>
        <CardDescription>
          Upload or generate a dataset to analyze class distributions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Sample dataset loaded with {datasetInfo.totalSamples} records.</p>
        <p>Imbalance ratio: {datasetInfo.imbalanceRatio}:1</p>
        
        <div className="mt-4">
          <Button 
            onClick={onGenerateRecommendations}
            disabled={isGeneratingRecommendations}
          >
            {isGeneratingRecommendations ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetInfoCard;
