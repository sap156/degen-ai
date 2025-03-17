
import React, { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useToast } from '@/components/ui/use-toast';
import {
  DatasetInfo,
  generateSampleDataset,
  balanceDataset,
  BalancingOptions,
  getAIRecommendations
} from '@/services/imbalancedDataService';

// Import our new component
import DatasetInfoCard from '@/components/imbalanced-data/DatasetInfoCard';
import DatasetVisualization from '@/components/imbalanced-data/DatasetVisualization';
import AIRecommendations from '@/components/imbalanced-data/AIRecommendations';
import DataBalancingControls from '@/components/DataBalancingControls';
import SyntheticDataGenerator from '@/components/SyntheticDataGenerator';

// For chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ImbalancedDataPage: React.FC = () => {
  const { apiKey } = useApiKey();
  const { toast } = useToast();
  
  // Core dataset states
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo>(generateSampleDataset());
  const [balancingOptions, setBalancingOptions] = useState<BalancingOptions>({ method: 'none' });
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [syntheticData, setSyntheticData] = useState<any[]>([]);
  
  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    isGeneratingSynthetic: false,
    isBalancing: false,
    isExporting: false,
    isImporting: false,
    isAnalyzing: false,
    isGeneratingRecommendations: false,
    isTestingModel: false
  });

  // Helper function to manage loading states
  const setLoadingState = (stateName: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [stateName]: value
    }));
  };

  // Event handler for getting AI recommendations
  const handleGetRecommendations = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your OpenAI API key to use this feature",
        variant: "destructive"
      });
      return;
    }

    setLoadingState('isGeneratingRecommendations', true);
    try {
      const recommendations = await getAIRecommendations(datasetInfo, apiKey);
      setAiRecommendations(recommendations);
      toast({
        title: "Recommendations Generated",
        description: "AI analysis of your dataset is complete",
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI recommendations",
        variant: "destructive"
      });
    } finally {
      setLoadingState('isGeneratingRecommendations', false);
    }
  };

  // Event handler for balancing dataset
  const handleBalanceDataset = (options: BalancingOptions) => {
    setLoadingState('isBalancing', true);
    
    try {
      const balancedDataset = balanceDataset(datasetInfo, options);
      setDatasetInfo(balancedDataset);
      setBalancingOptions(options);
      
      toast({
        title: "Dataset Balanced",
        description: `Applied ${options.method} balancing technique`,
      });
    } catch (error) {
      console.error("Error balancing dataset:", error);
      toast({
        title: "Error",
        description: "Failed to balance dataset",
        variant: "destructive"
      });
    } finally {
      setLoadingState('isBalancing', false);
    }
  };

  // Event handler for synthetic data generation
  const handleSyntheticDataGenerated = (newSyntheticData: any[]) => {
    setSyntheticData(newSyntheticData);
    
    // Update dataset info with the new synthetic data
    if (newSyntheticData.length > 0) {
      // In a real app, you'd update the dataset with the new synthetic records
      // For now, we'll simulate this
      toast({
        title: "Synthetic Data Generated",
        description: `Generated ${newSyntheticData.length} synthetic records`,
      });
    }
  };

  // Configuration for synthetic data generation
  const dummyPreferences = {
    targetColumn: 'class', // Assuming 'class' is the target column
    minorityClass: datasetInfo.classes.length > 0 ? 
      datasetInfo.classes[datasetInfo.classes.length - 1].className : '',
  };

  const dummyModelOptions = {
    syntheticDataPreferences: {
      enabled: true,
      volume: 100,
      diversity: 'medium' as 'low' | 'medium' | 'high',
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Imbalanced Data Tool</h1>
      <p className="mb-4">This tool helps you analyze and balance datasets with imbalanced class distributions.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Dataset Information Card */}
          <DatasetInfoCard 
            datasetInfo={datasetInfo}
            onGenerateRecommendations={handleGetRecommendations}
            isGeneratingRecommendations={loadingStates.isGeneratingRecommendations}
          />
          
          {/* Dataset Visualization Component */}
          <DatasetVisualization datasetInfo={datasetInfo} />
          
          {/* Data Balancing Controls */}
          <DataBalancingControls
            originalDataset={datasetInfo}
            parsedData={parsedData}
            onBalanceDataset={handleBalanceDataset}
            onDownloadBalanced={() => {}}  // Implement if needed
            hasBalancedData={balancingOptions.method !== 'none'}
            aiRecommendationsAvailable={!!aiRecommendations}
          />
        </div>
        
        <div>
          {/* AI Recommendations Component */}
          <AIRecommendations 
            recommendations={aiRecommendations}
            isLoading={loadingStates.isGeneratingRecommendations}
          />
          
          {/* Synthetic Data Generator */}
          {aiRecommendations && (
            <SyntheticDataGenerator
              preferences={dummyPreferences}
              modelOptions={dummyModelOptions}
              originalData={parsedData}
              apiKeyAvailable={!!apiKey}
              onSyntheticDataGenerated={handleSyntheticDataGenerated}
              originalDataset={datasetInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImbalancedDataPage;
