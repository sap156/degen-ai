
// Define OpenAI client type locally instead of importing from @/types
export interface OpenAIClient {
  id: string;
  created: number;
  model: string;
  object: string;
  choices: Array<{
    index: number;
    message: OpenAiMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | {type: string, text?: string, image_url?: {url: string, detail?: string}}[];
}

interface OpenAiOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * OpenAI Chat Completion API call
 */
export const getCompletion = async (
  apiKey: string,
  messages: OpenAiMessage[],
  options?: OpenAiOptions
): Promise<string> => {
  try {
    const model = options?.model || 'gpt-4o-mini';
    const temperature = options?.temperature !== undefined ? options.temperature : 0.7;
    const max_tokens = options?.max_tokens || 2000;

    console.log(`Calling OpenAI API with model: ${model}`);

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

/**
 * Analyze imbalanced dataset to provide recommendations
 */
export const analyzeImbalancedDataset = async (
  apiKey: string,
  data: any[],
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
  try {
    // Create a sample of the data to avoid sending too much data
    const sampleSize = Math.min(data.length, 50);
    const sampleData = data.slice(0, sampleSize);
    
    // Generate class distribution stats
    const classDistribution: Record<string, number> = {};
    data.forEach(item => {
      const className = String(item[targetColumn]);
      classDistribution[className] = (classDistribution[className] || 0) + 1;
    });
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a data science expert specializing in imbalanced datasets. Analyze the provided dataset and give recommendations.'
      },
      {
        role: 'user',
        content: `Analyze this imbalanced dataset and provide specific recommendations for handling the class imbalance.
        
        Dataset Info:
        - Total samples: ${data.length}
        - Target column: ${targetColumn}
        - Class labels: ${classLabels.join(', ')}
        - Class distribution: ${JSON.stringify(classDistribution)}
        ${datasetContext ? `- Dataset context: ${datasetContext}` : ''}
        ${performancePriorities ? `- Performance priorities: ${performancePriorities.join(', ')}` : ''}
        
        Sample data (first ${sampleSize} rows): ${JSON.stringify(sampleData)}
        
        Please provide:
        1. A brief analysis of the imbalance
        2. Specific recommendations for addressing the imbalance
        3. A list of suggested methods or techniques (as an array)
        4. Relative feature importance if possible (as a JSON object)
        5. Model recommendations (as an array)
        
        Format your response as a JSON object with keys: analysis, recommendations, suggestedMethods, featureImportance, and modelRecommendations.`
      }
    ];

    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini',
      temperature: 0.3
    });
    
    try {
      return JSON.parse(response);
    } catch {
      // If JSON parsing fails, create a structured response
      return {
        analysis: "Analysis could not be properly formatted. Please see raw response.",
        recommendations: response,
        suggestedMethods: ["SMOTE", "RandomUnderSampling", "ClassWeights"],
        modelRecommendations: ["RandomForest", "XGBoost"]
      };
    }
  } catch (error) {
    console.error('Error analyzing imbalanced dataset:', error);
    throw error;
  }
};

/**
 * Generate synthetic samples for imbalanced datasets
 */
export const generateSyntheticSamplesForImbalance = async (
  apiKey: string,
  minorityClassSamples: any[],
  targetColumn: string,
  minorityClass: string,
  count: number,
  diversity: 'low' | 'medium' | 'high'
): Promise<any[]> => {
  try {
    // Take a small sample of minority class samples to use as examples
    const sampleSize = Math.min(minorityClassSamples.length, 5);
    const sampleData = minorityClassSamples.slice(0, sampleSize);
    
    // Calculate temperature based on desired diversity
    const temperature = diversity === 'low' ? 0.3 : diversity === 'medium' ? 0.7 : 0.9;
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a data generation expert specializing in creating synthetic samples for imbalanced datasets.'
      },
      {
        role: 'user',
        content: `Generate ${count} synthetic samples for the minority class in this imbalanced dataset.
        
        Target column: ${targetColumn}
        Minority class value: ${minorityClass}
        Sample minority class records: ${JSON.stringify(sampleData)}
        
        Create new samples that are diverse but realistic for this class. The diversity level requested is: ${diversity}.
        
        Return ONLY a JSON array containing the new synthetic samples. Each sample should have the same fields as the examples provided.
        Ensure that every generated sample has the minority class value in the target column.`
      }
    ];

    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini',
      temperature
    });
    
    try {
      const samples = JSON.parse(response);
      // Ensure each sample has the correct minority class value
      return samples.map((sample: any) => ({
        ...sample,
        [targetColumn]: minorityClass
      }));
    } catch (error) {
      console.error('Error parsing synthetic samples:', error);
      throw new Error('Failed to generate synthetic samples: Invalid response format');
    }
  } catch (error) {
    console.error('Error generating synthetic samples:', error);
    throw error;
  }
};

/**
 * Get feature engineering suggestions for a dataset
 */
export const getFeatureEngineeringSuggestions = async (
  apiKey: string,
  data: any[],
  targetColumn: string,
  existingFeatures: string[]
): Promise<{
  suggestedFeatures: Array<{name: string, description: string, formula: string}>,
  expectedImpact: string
}> => {
  try {
    // Use a sample of the data for the API call
    const sampleSize = Math.min(data.length, 20);
    const sampleData = data.slice(0, sampleSize);
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a data science expert specializing in feature engineering.'
      },
      {
        role: 'user',
        content: `Suggest new features to engineer for this dataset to improve model performance.
        
        Dataset sample: ${JSON.stringify(sampleData)}
        Target column: ${targetColumn}
        Existing features: ${existingFeatures.join(', ')}
        
        Please provide:
        1. A list of suggested new features to engineer, each with:
           - name: a concise name for the new feature
           - description: what the feature represents and why it's useful
           - formula: how to calculate the feature using existing features
        
        2. The expected impact of these features on model performance
        
        Format your response as a JSON object with keys: suggestedFeatures (array) and expectedImpact (string).`
      }
    ];

    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini',
      temperature: 0.5
    });
    
    try {
      return JSON.parse(response);
    } catch {
      // If JSON parsing fails, create a structured response
      return {
        suggestedFeatures: [
          {
            name: "feature_ratio",
            description: "Ratio of two key numeric features",
            formula: "feature1 / feature2"
          }
        ],
        expectedImpact: "These features may help the model better capture relationships in the data."
      };
    }
  } catch (error) {
    console.error('Error getting feature engineering suggestions:', error);
    throw error;
  }
};

/**
 * Analyze PII data using AI to identify sensitive information
 */
export const analyzePiiWithAI = async (
  apiKey: string, 
  sampleData: string
): Promise<{
  identifiedPii: string[],
  suggestions: string
}> => {
  try {
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a privacy and data security expert. Analyze the provided data for PII (Personally Identifiable Information).'
      },
      {
        role: 'user',
        content: `Analyze this sample data and identify all PII (Personally Identifiable Information) fields:
        
        ${sampleData}
        
        Please provide:
        1. A list of identified PII fields or patterns
        2. Suggestions for how to handle this sensitive data
        
        Format your response as a JSON object with keys: identifiedPii (array of strings) and suggestions (string).`
      }
    ];

    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini',
      temperature: 0.3
    });
    
    try {
      return JSON.parse(response);
    } catch {
      // If JSON parsing fails, create a structured response
      return {
        identifiedPii: ["Error: Could not parse response"],
        suggestions: response
      };
    }
  } catch (error) {
    console.error('Error analyzing PII data:', error);
    return {
      identifiedPii: [`Error during analysis: ${error instanceof Error ? error.message : String(error)}`],
      suggestions: "An error occurred during analysis. Please try again."
    };
  }
};

/**
 * Generate masked PII data using AI
 */
export const generateMaskedDataWithAI = async (
  apiKey: string,
  data: any[],
  fieldsToMask: string[],
  options?: {
    preserveFormat?: boolean,
    customPrompt?: string
  }
): Promise<any[]> => {
  try {
    // Use sample data for the API call
    const sampleSize = Math.min(data.length, 10);
    const sampleData = data.slice(0, sampleSize);
    
    const preserveFormat = options?.preserveFormat !== undefined ? options.preserveFormat : true;
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a privacy and data masking expert. Generate masked versions of the provided data.'
      },
      {
        role: 'user',
        content: `${options?.customPrompt || 'Mask the PII fields in this data while preserving data format.'}
        
        Original data: ${JSON.stringify(sampleData)}
        Fields to mask: ${fieldsToMask.join(', ')}
        Preserve format: ${preserveFormat}
        
        Please generate masked versions of this data where the specified fields are masked to protect privacy.
        Return ONLY a JSON array with the masked data items, maintaining the same structure as the original.`
      }
    ];

    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini',
      temperature: 0.4
    });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing masked data:', error);
      throw new Error('Failed to generate masked data: Invalid response format');
    }
  } catch (error) {
    console.error('Error generating masked data:', error);
    throw error;
  }
};

/**
 * Generate synthetic data with AI
 */
export const generateSyntheticDataWithAI = async (
  apiKey: string,
  schema: Record<string, string>,
  count: number,
  options?: {
    seedData?: any[]
  }
): Promise<any[]> => {
  try {
    const seedData = options?.seedData || [];
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a synthetic data generation expert. Generate realistic synthetic data based on the provided schema.'
      },
      {
        role: 'user',
        content: `Generate ${count} synthetic data records based on this schema:
        
        Schema: ${JSON.stringify(schema)}
        ${seedData.length > 0 ? `Example data: ${JSON.stringify(seedData)}` : ''}
        
        Create realistic and diverse synthetic data following the provided schema.
        Return ONLY a JSON array containing the synthetic records.`
      }
    ];

    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini',
      temperature: 0.7
    });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing synthetic data:', error);
      throw new Error('Failed to generate synthetic data: Invalid response format');
    }
  } catch (error) {
    console.error('Error generating synthetic data:', error);
    throw error;
  }
};
