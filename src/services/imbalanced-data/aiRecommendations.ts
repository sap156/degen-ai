
import { DatasetInfo } from './types';

// Get AI recommendations for handling imbalanced data
export const getAIRecommendations = async (
  dataset: DatasetInfo,
  apiKey: string | null
): Promise<string> => {
  if (!apiKey) {
    return "AI recommendations require an OpenAI API key. Please set up your API key to use this feature.";
  }
  
  try {
    const { createMessages } = await import("../openAiService");
    const { getCompletion } = await import("../openAiService");
    
    const systemPrompt = "You are an expert in machine learning and data science specializing in handling imbalanced datasets. Provide practical recommendations for the given dataset.";
    
    const userPrompt = `I have a dataset with the following class distribution:
        
    ${dataset.classes.map(c => `${c.className}: ${c.count} samples (${c.percentage}%)`).join('\n')}
    
    Total samples: ${dataset.totalSamples}
    Imbalance ratio: ${dataset.imbalanceRatio}
    
    Please provide specific recommendations for handling this imbalanced dataset, including:
    1. Which sampling techniques might work best
    2. Algorithm recommendations
    3. Evaluation metrics to use
    4. Any other best practices`;
    
    const messages = createMessages(systemPrompt, userPrompt);
    
    return await getCompletion(apiKey, messages, {
      temperature: 0.7,
      max_tokens: 800
    });
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return "An error occurred while fetching AI recommendations. Please try again later.";
  }
};

// New function to analyze imbalanced dataset and provide recommendations
export const analyzeImbalancedDataset = async (
  apiKey: string | null,
  dataset: any[],
  targetColumn: string,
  classLabels: string[],
  datasetContext?: string,
  performancePriorities?: string[]
): Promise<{
  analysis: string,
  recommendations: string,
  suggestedMethods: string[],
  featureImportance?: Record<string, number>,
  modelRecommendations?: string[]
}> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  // Create a system prompt that instructs the AI to analyze the imbalanced dataset
  const systemPrompt = `You are an expert data scientist specializing in imbalanced datasets. 
Your task is to analyze the dataset provided and offer specific recommendations for handling class imbalance.
Provide detailed, actionable insights tailored to the dataset context and the user's performance priorities.`;

  // Sample a small subset of data to send to API (to avoid token limits)
  const sampleSize = Math.min(20, dataset.length);
  const sampledData = dataset.slice(0, sampleSize);
  
  // Calculate basic class distribution statistics
  const classDistribution: Record<string, number> = {};
  dataset.forEach(item => {
    const classLabel = String(item[targetColumn]);
    classDistribution[classLabel] = (classDistribution[classLabel] || 0) + 1;
  });

  // Identify dataset schema
  const schema: Record<string, string> = {};
  if (sampledData.length > 0) {
    Object.keys(sampledData[0]).forEach(key => {
      const value = sampledData[0][key];
      schema[key] = typeof value;
    });
  }

  // Prepare the user prompt with dataset information
  let userPrompt = `Please analyze this imbalanced dataset with the following characteristics:

Dataset Information:
- Total samples: ${dataset.length}
- Target column: "${targetColumn}"
- Class labels: ${classLabels.join(', ')}
- Class distribution: ${Object.entries(classDistribution).map(([label, count]) => 
    `${label}: ${count} (${((count / dataset.length) * 100).toFixed(1)}%)`).join(', ')}
${datasetContext ? `- Dataset context: ${datasetContext}` : ''}
${performancePriorities ? `- Performance priorities: ${performancePriorities.join(', ')}` : ''}

Schema:
${Object.entries(schema).map(([key, type]) => `- ${key}: ${type}`).join('\n')}

Sample data (first ${sampleSize} records):
${JSON.stringify(sampledData, null, 2)}

Please provide:
1. A brief analysis of the imbalance and its potential impact
2. Specific recommendations for handling this imbalance
3. A ranked list of suggested balancing methods (undersampling, oversampling, SMOTE, etc.)
4. Estimated feature importance for predicting the target variable
5. Recommended model types suitable for this dataset

Return your response as a valid JSON object with the following fields:
- analysis: descriptive text analysis of the dataset and imbalance
- recommendations: specific strategies to handle the imbalance
- suggestedMethods: array of recommended balancing methods in order of preference
- featureImportance: object mapping feature names to estimated importance scores (0-1)
- modelRecommendations: array of recommended model types in order of preference`;

  const { createMessages, getCompletion } = await import("../openAiService");
  const messages = createMessages(systemPrompt, userPrompt);
  
  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || "gpt-3.5-turbo";
  
  try {
    const response = await getCompletion(apiKey, messages, {
      model,
      temperature: 0.4, // Lower temperature for more focused analysis
      max_tokens: 2000  // Allow for detailed response
    });
    
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", e);
      // Attempt to extract the most important parts from non-JSON response
      return {
        analysis: "The AI analysis could not be structured properly. Please try again.",
        recommendations: response.substring(0, 500) + "...",
        suggestedMethods: ["undersampling", "oversampling", "SMOTE"],
      };
    }
  } catch (error) {
    console.error("Error analyzing imbalanced dataset with AI:", error);
    throw error;
  }
};

// Generate synthetic data for imbalanced dataset
export const generateSyntheticSamplesForImbalance = async (
  apiKey: string | null,
  minorityClassSamples: any[],
  targetColumn: string,
  minorityClassName: string,
  count: number,
  diversityLevel: 'low' | 'medium' | 'high' = 'medium'
): Promise<any[]> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  if (minorityClassSamples.length === 0) {
    throw new Error("No minority class samples provided");
  }

  // Create sample examples for the AI to learn from
  const examples = minorityClassSamples.slice(0, Math.min(5, minorityClassSamples.length));
  
  // Adjust temperature based on diversity level
  const temperatureMap = {
    'low': 0.3,
    'medium': 0.7,
    'high': 0.9
  };

  const systemPrompt = `You are a data synthesis expert. Generate realistic synthetic data samples for the minority class in an imbalanced dataset.
The synthetic samples should:
1. Be diverse but realistic variations of the provided examples
2. Maintain the statistical properties of the original minority class
3. Introduce reasonable variations to help improve model generalization
4. Always include the target column with the minority class label
5. Return ONLY valid JSON data with no additional text`;

  const userPrompt = `Generate ${count} synthetic data samples for the minority class "${minorityClassName}" in the target column "${targetColumn}".
Diversity level requested: ${diversityLevel}

Here are sample examples from the minority class:
${JSON.stringify(examples, null, 2)}

Return ONLY a JSON array containing ${count} synthetic data points with the same structure as the examples.`;

  const { createMessages, getCompletion } = await import("../openAiService");
  const messages = createMessages(systemPrompt, userPrompt);

  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || "gpt-3.5-turbo";
  
  try {
    const response = await getCompletion(apiKey, messages, {
      model,
      temperature: temperatureMap[diversityLevel],
      max_tokens: 2000
    });
    
    try {
      const syntheticSamples = JSON.parse(response);
      
      // Ensure all samples have the correct minority class label
      return syntheticSamples.map((sample: any, index: number) => ({
        ...sample,
        [targetColumn]: minorityClassName,
        // Add a synthetic ID flag that can be used to identify synthetic samples
        synthetic_id: `syn_${index + 1}`
      }));
    } catch (e) {
      console.error("Failed to parse synthetic data response:", e);
      throw new Error("Failed to generate valid synthetic data");
    }
  } catch (error) {
    console.error("Error generating synthetic samples with AI:", error);
    throw error;
  }
};

// Get AI-powered feature engineering suggestions
export const getFeatureEngineeringSuggestions = async (
  apiKey: string | null,
  dataset: any[],
  targetColumn: string,
  existingFeatures: string[]
): Promise<{
  suggestedFeatures: Array<{name: string, description: string, formula: string}>,
  expectedImpact: string
}> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  // Sample a small subset of data to send to API (to avoid token limits)
  const sampleSize = Math.min(10, dataset.length);
  const sampledData = dataset.slice(0, sampleSize);

  const systemPrompt = `You are a feature engineering expert specializing in machine learning for imbalanced datasets.
Your task is to suggest new features that could improve model performance on the target variable.
Focus on practical, implementable features that address class imbalance issues.`;

  const userPrompt = `Based on the following dataset sample, suggest new features that could improve prediction of the target variable "${targetColumn}".

Existing features: ${existingFeatures.join(', ')}

Sample data (${sampleSize} records):
${JSON.stringify(sampledData, null, 2)}

Please provide:
1. 3-5 new feature suggestions that could help with the imbalanced classification problem
2. A brief description of each feature and how it might help
3. A simple formula or pseudocode for how to implement each feature
4. The expected impact on model performance

Return your response as a valid JSON object with these fields:
- suggestedFeatures: array of objects with {name, description, formula}
- expectedImpact: string describing the expected improvement`;

  const { createMessages, getCompletion } = await import("../openAiService");
  const messages = createMessages(systemPrompt, userPrompt);

  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || "gpt-3.5-turbo";
  
  try {
    const response = await getCompletion(apiKey, messages, {
      model,
      temperature: 0.5,
      max_tokens: 1500
    });
    
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error("Failed to parse feature engineering suggestions:", e);
      return {
        suggestedFeatures: [],
        expectedImpact: "Could not generate structured suggestions. Please try again."
      };
    }
  } catch (error) {
    console.error("Error getting feature engineering suggestions:", error);
    throw error;
  }
};
