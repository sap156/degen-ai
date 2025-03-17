
import React, { useState } from 'react';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { toast } from 'sonner';
import {
  DatasetInfo,
  generateSampleDataset,
  balanceDataset,
  BalancingOptions,
  getAIRecommendations
} from '@/services/imbalancedDataService';

// Import components
import { Button } from '@/components/ui/button'; // Add this import
import DatasetControls from '@/components/imbalanced-data/DatasetControls';
import DatasetConfiguration from '@/components/imbalanced-data/DatasetConfiguration';
import DatasetSummary from '@/components/imbalanced-data/DatasetSummary';
import DatasetVisualization from '@/components/imbalanced-data/DatasetVisualization';
import AIRecommendations from '@/components/imbalanced-data/AIRecommendations';
import DataBalancingControls from '@/components/DataBalancingControls';
import SyntheticDataGenerator from '@/components/SyntheticDataGenerator';
import AIAnalysis from '@/components/imbalanced-data/AIAnalysis';

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
  
  // Core dataset states
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo>(generateSampleDataset());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [balancingOptions, setBalancingOptions] = useState<BalancingOptions>({ method: 'none' });
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [syntheticData, setSyntheticData] = useState<any[]>([]);
  const [datasetContext, setDatasetContext] = useState('');
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'analyze'>('upload');
  
  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  
  // Additional stats
  const [additionalStats, setAdditionalStats] = useState({
    missingValues: 109,
    duplicates: 3,
    outliers: 16
  });
  
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

  // Event handler for file upload
  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    // In a real app, you would parse the file here
    // For now, we'll just use the sample dataset
    toast.success(`Uploaded ${file.name}`);
  };

  // Event handler for clearing the file
  const handleClearFile = () => {
    setSelectedFile(null);
  };

  // Event handler for completing configuration
  const handleConfigurationComplete = (context: string) => {
    setDatasetContext(context);
    setCurrentStep('analyze');
  };

  // Event handler for getting AI recommendations
  const handleGetRecommendations = async () => {
    if (!apiKey) {
      toast.error("API Key Required", {
        description: "Please set your OpenAI API key to use this feature"
      });
      return;
    }

    setLoadingState('isGeneratingRecommendations', true);
    try {
      const recommendations = await getAIRecommendations(datasetInfo, apiKey);
      setAiRecommendations(recommendations);
      toast.success("Recommendations Generated", {
        description: "AI analysis of your dataset is complete"
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast.error("Error", {
        description: "Failed to generate AI recommendations"
      });
    } finally {
      setLoadingState('isGeneratingRecommendations', false);
    }
  };

  // Event handler for AI analysis
  const handleAnalyze = (options: { desiredOutcome: string; modelPreference: string }) => {
    setLoadingState('isAnalyzing', true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setAiRecommendations(`
# AI Recommendations for Your Imbalanced Dataset

Your dataset has a significant imbalance ratio of ${datasetInfo.imbalanceRatio}:1, which may negatively impact model performance. Here are my recommendations:

1. Use SMOTE (Synthetic Minority Over-sampling Technique)
   Given the severity of the imbalance, SMOTE would be effective at generating synthetic samples for the minority class while avoiding overfitting.

2. Consider Cost-Sensitive Learning
   Adjust the class weights in your model to penalize misclassification of minority class instances more heavily.

3. Evaluation Strategy
   Use stratified cross-validation and focus on metrics beyond accuracy, such as F1-score, precision, and recall.

4. Model Selection
   Tree-based ensemble methods like XGBoost or Random Forest tend to perform well with imbalanced data after applying the above techniques.
      `);
      
      setLoadingState('isAnalyzing', false);
    }, 2000);
  };

  // Event handler for balancing dataset
  const handleBalanceDataset = (options: BalancingOptions) => {
    setLoadingState('isBalancing', true);
    
    try {
      const balancedDataset = balanceDataset(datasetInfo, options);
      setDatasetInfo(balancedDataset);
      setBalancingOptions(options);
      
      toast.success("Dataset Balanced", {
        description: `Applied ${options.method} balancing technique`
      });
    } catch (error) {
      console.error("Error balancing dataset:", error);
      toast.error("Error", {
        description: "Failed to balance dataset"
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
      toast.success("Synthetic Data Generated", {
        description: `Generated ${newSyntheticData.length} synthetic records`
      });
    }
  };

  // Render different steps based on current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <>
            <DatasetControls
              onFileUpload={handleFileUpload}
              selectedFile={selectedFile}
              onClearFile={handleClearFile}
            />
            {selectedFile && (
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setCurrentStep('configure')}>
                  Continue to Configuration
                </Button>
              </div>
            )}
          </>
        );
      
      case 'configure':
        return (
          <DatasetConfiguration
            onComplete={handleConfigurationComplete}
            onBack={() => setCurrentStep('upload')}
          />
        );
      
      case 'analyze':
        return (
          <>
            <DatasetSummary 
              datasetInfo={datasetInfo} 
              additionalStats={additionalStats}
            />
          </>
        );
    }
  };

  // Configuration for synthetic data generation
  const dummyPreferences = {
    targetColumn: 'class',
    minorityClass: datasetInfo.classes.length > 0 ? 
      datasetInfo.classes[datasetInfo.classes.length - 1].className : '',
    classLabels: datasetInfo.classes.map(c => c.className),
  };

  const dummyModelOptions = {
    syntheticDataPreferences: {
      enabled: true,
      volume: 100,
      diversity: 'medium' as 'low' | 'medium' | 'high',
    },
    enableFeatureEngineering: false,
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Imbalanced Data Handling</h1>
      <p className="mb-6 text-muted-foreground">Balance your datasets using various techniques to improve model performance.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Left column */}
          {renderCurrentStep()}
          
          {currentStep === 'analyze' && (
            <>
              {/* Dataset Visualization Component */}
              <DatasetVisualization datasetInfo={datasetInfo} />
              
              {/* Data Balancing Controls */}
              <DataBalancingControls
                originalDataset={datasetInfo}
                parsedData={parsedData}
                onBalanceDataset={handleBalanceDataset}
                onDownloadBalanced={() => {}}
                hasBalancedData={balancingOptions.method !== 'none'}
                aiRecommendationsAvailable={!!aiRecommendations}
              />
            </>
          )}
        </div>
        
        <div>
          {/* Right column */}
          {currentStep === 'analyze' && (
            <>
              {/* AI Analysis Component */}
              {!aiRecommendations ? (
                <AIAnalysis 
                  apiKeyAvailable={!!apiKey}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={loadingStates.isAnalyzing}
                />
              ) : (
                <>
                  {/* AI Recommendations Component */}
                  <AIRecommendations 
                    recommendations={aiRecommendations}
                    isLoading={loadingStates.isGeneratingRecommendations}
                  />
                  
                  {/* Synthetic Data Generator */}
                  <SyntheticDataGenerator
                    preferences={dummyPreferences}
                    modelOptions={dummyModelOptions}
                    originalData={parsedData}
                    apiKeyAvailable={!!apiKey}
                    onSyntheticDataGenerated={handleSyntheticDataGenerated}
                    originalDataset={datasetInfo}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImbalancedDataPage;
