
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import DataBalancingControls from '@/components/DataBalancingControls';
import UserGuideImbalancedData from '@/components/ui/UserGuideImbalancedData';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { useApiKey } from '@/contexts/ApiKeyContext';

const ImbalancedData = () => {
  const { apiKey, isKeySet } = useApiKey();
  
  // Mock props for DataBalancingControls
  const mockBalancingProps = {
    originalDataset: null,
    parsedData: [],
    onBalanceDataset: () => {},
    onDownloadBalanced: () => {},
    onClearData: () => {},
    className: ""
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Scale className="h-8 w-8 text-primary" />
          Imbalanced Data Handling
        </h1>
        <p className="text-muted-foreground">
          Balance your datasets for better model training and fairer predictions
        </p>
      </div>
      
      {!isKeySet ? (
        <ApiKeyRequirement />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Data Balancing Controls</CardTitle>
            <CardDescription>
              Upload your dataset and apply various techniques to address class imbalance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataBalancingControls {...mockBalancingProps} />
          </CardContent>
        </Card>
      )}
      
      <UserGuideImbalancedData />
    </div>
  );
};

export default ImbalancedData;
