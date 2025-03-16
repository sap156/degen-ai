
import { 
  analyzeImbalancedDataset, 
  generateSyntheticSamplesForImbalance,
  getFeatureEngineeringSuggestions 
} from './openAiService';
import { ClassDistribution, DatasetInfo } from './imbalancedDataService';

// Types for dataset analysis
export interface DatasetAnalysis {
  summary: {
    totalSamples: number;
    missingValues: number;
    duplicates: number;
    outliers: number;
  };
  schema: Record<string, string>;
  preview: any[];
  potentialIssues: string[];
  detectedTarget?: string;
}

// Types for dataset preferences
export interface DatasetPreferences {
  targetColumn: string;
  classLabels: string[];
  minorityClass?: string;
  majorityClass?: string;
  datasetContext?: string;
}

// Types for performance preferences
export interface PerformancePreferences {
  desiredOutcome: 'precision' | 'balanced' | 'recall' | 'min_false_negatives' | 'min_false_positives';
  priorityMetrics: string[];
  explainabilityRequired: boolean;
}

// Types for model options
export interface ModelOptions {
  enableFeatureEngineering: boolean;
  modelType?: string;
  syntheticDataPreferences?: {
    enabled: boolean;
    volume: number;
    diversity: 'low' | 'medium' | 'high';
  };
}

// Function to analyze an uploaded dataset
export const analyzeUploadedDataset = (data: any[]): DatasetAnalysis => {
  if (!data || data.length === 0) {
    throw new Error("Empty dataset provided");
  }

  // Create schema from first item
  const schema: Record<string, string> = {};
  const firstItem = data[0];
  
  Object.keys(firstItem).forEach(key => {
    const value = firstItem[key];
    schema[key] = typeof value;
  });

  // Count missing values
  let missingValues = 0;
  data.forEach(item => {
    Object.values(item).forEach(value => {
      if (value === null || value === undefined || value === '') {
        missingValues++;
      }
    });
  });

  // Check for duplicates (simplified)
  const uniqueItems = new Set(data.map(item => JSON.stringify(item)));
  const duplicates = data.length - uniqueItems.size;

  // Simple outlier detection (using numeric fields only)
  let outliers = 0;
  Object.entries(schema).forEach(([key, type]) => {
    if (type === 'number') {
      const values = data.map(item => item[key]).filter(val => typeof val === 'number');
      if (values.length > 0) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );
        
        // Count values more than 3 standard deviations from the mean as outliers
        values.forEach(val => {
          if (Math.abs(val - mean) > 3 * stdDev) {
            outliers++;
          }
        });
      }
    }
  });

  // Try to detect potential target columns (categorical columns with few unique values)
  const potentialTargets: string[] = [];
  Object.entries(schema).forEach(([key, type]) => {
    if (type === 'string' || type === 'number') {
      const uniqueValues = new Set(data.map(item => item[key]));
      // If column has between 2 and 10 unique values, it might be a target
      if (uniqueValues.size >= 2 && uniqueValues.size <= 10) {
        potentialTargets.push(key);
      }
    }
  });

  // Generate list of potential issues
  const potentialIssues: string[] = [];
  if (missingValues > 0) {
    potentialIssues.push(`Dataset contains ${missingValues} missing values`);
  }
  if (duplicates > 0) {
    potentialIssues.push(`Dataset contains ${duplicates} duplicate records`);
  }
  if (outliers > 0) {
    potentialIssues.push(`Dataset contains approximately ${outliers} potential outliers`);
  }

  return {
    summary: {
      totalSamples: data.length,
      missingValues,
      duplicates,
      outliers
    },
    schema,
    preview: data.slice(0, 5),
    potentialIssues,
    detectedTarget: potentialTargets.length > 0 ? potentialTargets[0] : undefined
  };
};

// Function to get detailed AI analysis of the dataset
export const getAIDatasetAnalysis = async (
  apiKey: string | null,
  data: any[],
  preferences: DatasetPreferences,
  performancePrefs?: PerformancePreferences
): Promise<{
  analysis: string,
  recommendations: string,
  suggestedMethods: string[],
  featureImportance?: Record<string, number>,
  modelRecommendations?: string[]
}> => {
  if (!apiKey) {
    throw new Error("AI analysis requires an OpenAI API key");
  }

  const performancePriorities = performancePrefs ? [
    performancePrefs.desiredOutcome,
    ...performancePrefs.priorityMetrics
  ] : undefined;

  try {
    return await analyzeImbalancedDataset(
      apiKey,
      data,
      preferences.targetColumn,
      preferences.classLabels,
      preferences.datasetContext,
      performancePriorities
    );
  } catch (error) {
    console.error("Error getting AI dataset analysis:", error);
    throw error;
  }
};

// Function to generate synthetic samples for minority classes
export const generateSyntheticSamples = async (
  apiKey: string | null,
  data: any[],
  preferences: DatasetPreferences,
  options: {
    count: number,
    diversity: 'low' | 'medium' | 'high'
  }
): Promise<any[]> => {
  if (!apiKey) {
    throw new Error("Synthetic data generation requires an OpenAI API key");
  }

  if (!preferences.minorityClass) {
    throw new Error("Minority class must be specified");
  }

  // Filter data to get only samples from the minority class
  const minorityClassSamples = data.filter(
    item => String(item[preferences.targetColumn]) === preferences.minorityClass
  );

  if (minorityClassSamples.length === 0) {
    throw new Error(`No samples found for minority class '${preferences.minorityClass}'`);
  }

  try {
    return await generateSyntheticSamplesForImbalance(
      apiKey,
      minorityClassSamples,
      preferences.targetColumn,
      preferences.minorityClass,
      options.count,
      options.diversity
    );
  } catch (error) {
    console.error("Error generating synthetic samples:", error);
    throw error;
  }
};

// Function to get feature engineering suggestions
export const getFeatureSuggestions = async (
  apiKey: string | null,
  data: any[],
  preferences: DatasetPreferences
): Promise<{
  suggestedFeatures: Array<{name: string, description: string, formula: string}>,
  expectedImpact: string
}> => {
  if (!apiKey) {
    throw new Error("Feature engineering requires an OpenAI API key");
  }

  const existingFeatures = Object.keys(data[0]).filter(
    key => key !== preferences.targetColumn
  );

  try {
    return await getFeatureEngineeringSuggestions(
      apiKey,
      data,
      preferences.targetColumn,
      existingFeatures
    );
  } catch (error) {
    console.error("Error getting feature engineering suggestions:", error);
    throw error;
  }
};

// Helper function to convert AI analysis results to DatasetInfo format
export const convertToDatasetInfo = (
  data: any[],
  targetColumn: string,
  classLabels: string[]
): DatasetInfo => {
  // Count occurrences of each class
  const classCounts: Record<string, number> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    classCounts[classValue] = (classCounts[classValue] || 0) + 1;
  });

  // Available colors for the classes
  const CLASS_COLORS = [
    '#4f46e5', '#0891b2', '#16a34a', '#ca8a04', 
    '#dc2626', '#9333ea', '#2563eb', '#059669', 
    '#d97706', '#db2777',
  ];

  // Create class distribution array
  const classes: ClassDistribution[] = Object.entries(classCounts)
    .map(([className, count], index) => ({
      className,
      count,
      percentage: parseFloat(((count / data.length) * 100).toFixed(1)),
      color: CLASS_COLORS[index % CLASS_COLORS.length]
    }))
    .sort((a, b) => b.count - a.count); // Sort by count (descending)

  // Calculate imbalance ratio
  const maxClassSize = classes[0].count;
  const minClassSize = classes[classes.length - 1].count;
  const imbalanceRatio = parseFloat((maxClassSize / minClassSize).toFixed(2));

  return {
    totalSamples: data.length,
    classes,
    isImbalanced: imbalanceRatio > 1.5,
    imbalanceRatio
  };
};

// Function to implement AI-suggested feature engineering
export const implementFeatureEngineering = (
  data: any[],
  suggestedFeatures: Array<{name: string, description: string, formula: string}>
): any[] => {
  // This is a simplified implementation that would need to be expanded
  // for more complex feature engineering formulas
  
  // Create a deep copy of the data to avoid modifying the original
  const enhancedData = JSON.parse(JSON.stringify(data));
  
  suggestedFeatures.forEach(feature => {
    try {
      // Very simple formula parser - this would need to be much more robust
      // for real-world use cases with complex formulas
      enhancedData.forEach((item: any, index: number) => {
        // For demonstration, we'll implement a few basic formulas
        if (feature.formula.includes('log(')) {
          const matches = feature.formula.match(/log\(([^)]+)\)/);
          if (matches && matches[1]) {
            const fieldName = matches[1].trim();
            if (fieldName in item && typeof item[fieldName] === 'number' && item[fieldName] > 0) {
              item[feature.name] = Math.log(item[fieldName]);
            } else {
              item[feature.name] = 0;
            }
          }
        } else if (feature.formula.includes('+') || feature.formula.includes('-') || 
                  feature.formula.includes('*') || feature.formula.includes('/')) {
          // For simple arithmetic between fields
          // Note: This is an extremely simplified implementation
          const fields = feature.formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
          
          if (fields.every(field => field in item)) {
            try {
              // Create a function to evaluate the formula
              // (Warning: this is not safe for production use)
              const values: Record<string, number> = {};
              fields.forEach(field => {
                values[field] = parseFloat(item[field]);
              });
              
              const fn = new Function(...Object.keys(values), `return ${feature.formula}`);
              item[feature.name] = fn(...Object.values(values));
            } catch (e) {
              console.error(`Failed to implement formula for ${feature.name}:`, e);
              item[feature.name] = null;
            }
          } else {
            item[feature.name] = null;
          }
        } else {
          // For categorical features or other transformations
          // Just add a placeholder value
          item[feature.name] = `feature_${index % 3}`;
        }
      });
    } catch (e) {
      console.error(`Error implementing feature ${feature.name}:`, e);
    }
  });
  
  return enhancedData;
};
