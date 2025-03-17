/**
 * AI Data Analysis Service
 * Provides functionality for analyzing datasets and improving ML models
 */

import { useSupabase } from '@/hooks/useSupabase';
import { getCompletion, OpenAiMessage } from './openAiService';

export interface DatasetPreferences {
  targetColumn?: string;
  minorityClass?: string;
  majorityClass?: string;
  datasetName?: string;
  classLabels?: string[];
  datasetContext?: string;
  primaryKeys?: string[]; // Added primaryKeys field
}

export interface ModelOptions {
  balancingTechnique?: 'oversampling' | 'undersampling' | 'hybrid';
  balancingRatio?: number;
  syntheticDataPreferences?: {
    enabled: boolean;
    volume: number;
    diversity: 'low' | 'medium' | 'high';
  };
  featureEngineeringEnabled?: boolean;
}

export interface DatasetAnalysis {
  columns?: Array<{ name: string; type: string; nullPercentage: number }>;
  rowCount?: number;
  potentialTargetColumns?: string[];
  classDistribution?: Record<string, number>;
  correlations?: Record<string, Record<string, number>>;
  recommendations?: string;
  potentialIssues?: string[];
  detectedTarget?: string;
  schema?: Record<string, string>;
  preview?: any[];
  summary?: {
    totalSamples: number;
    missingValues: number;
    duplicates: number;
    outliers: number;
  };
  potentialPrimaryKeys?: string[];
}

export interface FeatureSuggestion {
  name: string;
  description: string;
  formula: string;
  impact: number; // 0-1 score representing expected impact
}

export interface BalancingRecommendation {
  technique: 'oversampling' | 'undersampling' | 'hybrid';
  ratio: number;
  explanation: string;
}

// Analyze dataset class distribution
export const analyzeClassDistribution = async (
  data: any[],
  targetColumn: string,
  apiKey: string
): Promise<{
  classDistribution: Array<{ className: string; count: number; percentage: number }>;
  imbalanceRatio: number;
  minorityClass: string;
  majorityClass: string;
  recommendations: string;
}> => {
  // Calculate class distribution
  const classes: Record<string, number> = {};
  
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    classes[classValue] = (classes[classValue] || 0) + 1;
  });
  
  // Convert to array format
  const classDistribution = Object.entries(classes).map(([className, count]) => ({
    className,
    count,
    percentage: (count / data.length) * 100
  }));
  
  // Sort by count (ascending)
  classDistribution.sort((a, b) => a.count - b.count);
  
  // Get minority and majority classes
  const minorityClass = classDistribution[0].className;
  const majorityClass = classDistribution[classDistribution.length - 1].className;
  
  // Calculate imbalance ratio
  const imbalanceRatio = classDistribution[classDistribution.length - 1].count / classDistribution[0].count;
  
  // Get AI recommendations if API key is provided
  let recommendations = '';
  
  if (apiKey) {
    try {
      const { processWithOpenAI } = useSupabase();
      
      const systemPrompt = `You are an expert in machine learning and imbalanced datasets.
      Analyze the class distribution provided and offer recommendations for handling the imbalance.`;
      
      const userPrompt = `Here is the class distribution for a dataset:
      ${JSON.stringify(classDistribution, null, 2)}
      
      Minority class: ${minorityClass} (${classDistribution[0].count} samples, ${classDistribution[0].percentage.toFixed(2)}%)
      Majority class: ${majorityClass} (${classDistribution[classDistribution.length - 1].count} samples, ${classDistribution[classDistribution.length - 1].percentage.toFixed(2)}%)
      Imbalance ratio: ${imbalanceRatio.toFixed(2)}
      
      Provide brief recommendations for handling this class imbalance. Keep your answer concise and practical.`;
      
      const messages: OpenAiMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const response = await getCompletion(apiKey, messages, {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 200
      });
      
      recommendations = response;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      recommendations = 'Error generating recommendations. Please try again.';
    }
  } else {
    recommendations = 'Set OpenAI API key to get AI-powered recommendations.';
  }
  
  return {
    classDistribution,
    imbalanceRatio,
    minorityClass,
    majorityClass,
    recommendations
  };
};

// Get recommendations for handling imbalanced data
export const getBalancingRecommendations = async (
  dataInfo: {
    classDistribution: Array<{ className: string; count: number; percentage: number }>;
    imbalanceRatio: number;
  },
  apiKey: string
): Promise<BalancingRecommendation> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  try {
    const systemPrompt = `You are an AI assistant specializing in machine learning and imbalanced datasets.
    Based on the class distribution provided, recommend the best approach for balancing the dataset.`;
    
    const userPrompt = `Here is the class distribution for a dataset:
    ${JSON.stringify(dataInfo.classDistribution, null, 2)}
    
    Imbalance ratio: ${dataInfo.imbalanceRatio.toFixed(2)}
    
    Recommend the best balancing technique (oversampling, undersampling, or hybrid) and provide a specific balancing ratio.
    Return your recommendation in this JSON format:
    {
      "technique": "oversampling|undersampling|hybrid",
      "ratio": 0.5,
      "explanation": "Brief explanation of your recommendation"
    }
    
    Note that the ratio should be between 0 and 1, where:
    - For oversampling, 1 means fully balance to equal classes
    - For undersampling, 1 means fully balance to equal classes
    - For hybrid, the ratio represents the balance between over and undersampling`;
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      model: 'gpt-4o',
      temperature: 0.2
    });
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Response format not recognized');
      }
    } catch (parseError) {
      console.error('Error parsing balancing recommendations:', parseError);
      return {
        technique: 'oversampling',
        ratio: 0.5,
        explanation: 'Error processing response. Using default recommendation.'
      };
    }
  } catch (error) {
    console.error('Error getting balancing recommendations:', error);
    return {
      technique: 'oversampling',
      ratio: 0.5,
      explanation: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Generate feature engineering suggestions
export const getFeatureEngineeringSuggestions = async (
  data: any[],
  preferences: DatasetPreferences,
  apiKey: string
): Promise<{
  suggestedFeatures: FeatureSuggestion[];
  expectedImpact: string;
}> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  // Sample the data to avoid token limits
  const sampleSize = Math.min(data.length, 10);
  const sample = data.slice(0, sampleSize);
  
  // Get column names and types
  const columns: Record<string, string> = {};
  
  if (sample.length > 0) {
    const firstRow = sample[0];
    Object.entries(firstRow).forEach(([key, value]) => {
      if (key !== preferences.targetColumn) {
        columns[key] = typeof value;
      }
    });
  }
  
  try {
    const systemPrompt = `You are an expert in feature engineering for machine learning.
    Given a dataset sample and information about its columns, suggest new features that could improve model performance for imbalanced classification.`;
    
    const userPrompt = `Here is a sample of the dataset:
    ${JSON.stringify(sample, null, 2)}
    
    Columns and their types:
    ${JSON.stringify(columns, null, 2)}
    
    Target column: ${preferences.targetColumn}
    
    Suggest 3-5 new features that could be engineered from the existing columns to improve performance on the imbalanced classification task.
    For each feature, provide:
    1. A descriptive name
    2. An explanation of why it would be useful
    3. The formula or transformation to create it
    
    Return your suggestions in this JSON format:
    {
      "suggestedFeatures": [
        {
          "name": "feature_name",
          "description": "How this feature helps",
          "formula": "column_a / column_b",
          "impact": 0.8
        }
      ],
      "expectedImpact": "Brief explanation of how these features might help with the imbalanced dataset"
    }`;
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      model: 'gpt-4o',
      temperature: 0.3
    });
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Response format not recognized');
      }
    } catch (parseError) {
      console.error('Error parsing feature suggestions:', parseError);
      return {
        suggestedFeatures: [],
        expectedImpact: 'Error processing response. Please try again.'
      };
    }
  } catch (error) {
    console.error('Error generating feature suggestions:', error);
    return {
      suggestedFeatures: [],
      expectedImpact: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Analyze a dataset
export const analyzeDataset = async (
  data: any[],
  apiKey: string
): Promise<DatasetAnalysis | null> => {
  if (!apiKey || !data.length) return null;
  
  try {
    const sampleData = data.slice(0, Math.min(5, data.length));
    
    const systemPrompt = `You are a data science expert. Your task is to analyze the provided dataset and
    extract key insights, including potential target columns, data distributions, and recommendations.`;
    
    const userPrompt = `Analyze this dataset with ${data.length} rows.
    Here's a sample of the data:
    ${JSON.stringify(sampleData, null, 2)}
    
    Provide:
    1. Basic statistics about the columns (types, null percentages)
    2. Potential target columns for ML tasks
    3. Initial recommendations for preprocessing
    4. Potential issues in the data
    5. A schema representation of the dataset
    
    Format your response as valid JSON with the following structure:
    {
      "columns": [
        { "name": "column_name", "type": "data_type", "nullPercentage": 0.0 }
      ],
      "rowCount": 1000,
      "potentialTargetColumns": ["column1", "column2"],
      "recommendations": "Your preprocessing suggestions here",
      "potentialIssues": ["issue1", "issue2"],
      "detectedTarget": "most_likely_target_column",
      "schema": { "column1": "type1", "column2": "type2" },
      "summary": {
        "totalSamples": 1000,
        "missingValues": 50,
        "duplicates": 10,
        "outliers": 20
      },
      "potentialPrimaryKeys": ["id", "record_id"]
    }`;
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      model: 'gpt-4o',
      temperature: 0.2
    });
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Response format not recognized');
      }
    } catch (parseError) {
      console.error('Error parsing dataset analysis:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error analyzing dataset:', error);
    return null;
  }
};
