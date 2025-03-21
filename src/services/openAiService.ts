import { OpenAIModel } from '@/contexts/ApiKeyContext';

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | { type: string; text?: string; image_url?: { url: string; detail: string } }[];
}

interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

export const getCompletion = async (
  apiKey: string | null,
  messages: OpenAiMessage[],
  options: CompletionOptions = {}
): Promise<string> => {
  try {
    console.log("Calling OpenAI API with model:", options.model ?? 'gpt-4o');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: options.model ?? 'gpt-4o',
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 30000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error response:", errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response format:", data);
      throw new Error("Invalid response format from OpenAI API");
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting completion:', error);
    throw error;
  }
};

// Function to clean a JSON string that might be wrapped in markdown code blocks
const cleanJsonResponse = (text: string): string => {
  // If the text starts with markdown code block indicators, remove them
  let cleaned = text.trim();
  
  // Remove markdown code block syntax if present
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = cleaned.match(jsonBlockRegex);
  
  if (match && match[1]) {
    cleaned = match[1].trim();
  }
  
  return cleaned;
};

// Function to parse a potential JSON string safely
const safeJsonParse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Failed text:', text);
    throw new Error('Failed to parse JSON response from OpenAI');
  }
};

export const analyzePiiWithAI = async (
  apiKey: string,
  dataToAnalyze: string
): Promise<{ identifiedPii: string[]; suggestions: string }> => {
  try {
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a PII detection expert. Identify PII (Personally Identifiable Information) in the provided data sample and suggest appropriate handling methods.'
      },
      {
        role: 'user',
        content: `Analyze this data and identify any PII elements: ${dataToAnalyze}... 
    Return your response as a JSON object with two properties: 
    1. "identifiedPii": an array of strings naming each type of PII found
    2. "suggestions": a string with recommendations for handling this data safely`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 30000,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });

    // Clean and parse the response
    const cleanedResponse = cleanJsonResponse(response);
    const result = safeJsonParse(cleanedResponse);

    // Validate the response structure
    if (!result.identifiedPii || !Array.isArray(result.identifiedPii) || !result.suggestions) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      identifiedPii: result.identifiedPii,
      suggestions: result.suggestions
    };
  } catch (error) {
    console.error('Error analyzing PII with AI:', error);
    return {
      identifiedPii: ['Error analyzing PII data'],
      suggestions: 'An error occurred when analyzing the data. Please check your API key and try again.'
    };
  }
};

export const generateMaskedDataWithAI = async (
  apiKey: string,
  data: any[],
  fieldsToMask: string[],
  options: {
    preserveFormat?: boolean;
    customPrompt?: string;
  } = {}
): Promise<any[]> => {
  try {
    const customPrompt = options.customPrompt || 
      "Mask the selected fields to preserve privacy while maintaining data usability.";
    
    const preserveFormat = options.preserveFormat !== undefined ? options.preserveFormat : true;
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are a data privacy expert with experience in masking PII (Personally Identifiable Information).'
      },
      {
        role: 'user',
        content: `${customPrompt}

Here is the original data:
${JSON.stringify(data, null, 2)}

Mask only these fields: ${fieldsToMask.join(', ')}
${preserveFormat ? 'Ensure the masked data maintains the same format as the original.' : ''}

Return ONLY a JSON array with the masked records. Do not include any explanation or additional text.`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 30000,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });

    // Clean and parse the response
    const cleanedResponse = cleanJsonResponse(response);
    const maskedData = safeJsonParse(cleanedResponse);

    // Validate the response is an array
    if (!Array.isArray(maskedData)) {
      throw new Error('Invalid response format from OpenAI: expected an array');
    }

    return maskedData;
  } catch (error) {
    console.error('Error generating masked data with AI:', error);
    throw new Error('Failed to generate masked data. Please try again.');
  }
};

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
    const systemPrompt = `You are an AI data scientist specializing in imbalanced datasets. 
    Analyze the provided dataset for class imbalance issues and provide recommendations.`;
    
    const userPrompt = `
    Analyze this dataset with target column "${targetColumn}" and class labels [${classLabels.join(", ")}].
    ${datasetContext ? `Dataset context: ${datasetContext}` : ''}
    ${performancePriorities ? `Performance priorities: ${performancePriorities.join(", ")}` : ''}
    
    Dataset sample:
    ${JSON.stringify(data.slice(0, 5), null, 2)}
    
    Total samples: ${data.length}
    
    Provide your analysis as a JSON with these fields:
    1. analysis: detailed analysis of the imbalance
    2. recommendations: specific recommendations
    3. suggestedMethods: array of suggested methods to address imbalance
    4. featureImportance: object mapping features to importance scores (0-100)
    5. modelRecommendations: array of recommended models`;
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 30000,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    const cleanedResponse = cleanJsonResponse(response);
    const result = safeJsonParse(cleanedResponse);
    
    return {
      analysis: result.analysis || "Analysis not available",
      recommendations: result.recommendations || "No recommendations available",
      suggestedMethods: result.suggestedMethods || [],
      featureImportance: result.featureImportance,
      modelRecommendations: result.modelRecommendations
    };
  } catch (error) {
    console.error("Error analyzing imbalanced dataset:", error);
    return {
      analysis: "Error analyzing dataset",
      recommendations: "Please try again with a different dataset or approach",
      suggestedMethods: ["SMOTE", "Class weights", "Undersampling"]
    };
  }
};

export const generateSyntheticSamplesForImbalance = async (
  apiKey: string,
  minorityClassSamples: any[],
  targetColumn: string,
  minorityClass: string,
  count: number,
  diversity: 'low' | 'medium' | 'high'
): Promise<any[]> => {
  try {
    const diversityFactors = {
      'low': 0.3,
      'medium': 0.6,
      'high': 0.9
    };
    
    const systemPrompt = `You are an AI data scientist specializing in synthetic data generation
    for imbalanced datasets. Generate realistic synthetic samples for the minority class.`;
    
    const userPrompt = `
    Generate ${count} new synthetic samples for the minority class "${minorityClass}" in column "${targetColumn}".
    Use diversity level: ${diversity} (${diversityFactors[diversity]})
    
    Base your generation on these existing minority samples:
    ${JSON.stringify(minorityClassSamples.slice(0, 5), null, 2)}
    
    Rules:
    1. Keep the target column value as "${minorityClass}"
    2. Maintain the same schema but create realistic variations
    3. Ensure the returned data is a valid JSON array
    4. Respect data types and formats of the original
    `;
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      temperature: diversityFactors[diversity] + 0.2,
      max_tokens: 30000,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    const cleanedResponse = cleanJsonResponse(response);
    const syntheticSamples = safeJsonParse(cleanedResponse);
    
    if (!Array.isArray(syntheticSamples)) {
      throw new Error("Invalid response: expected an array of synthetic samples");
    }
    
    return syntheticSamples;
  } catch (error) {
    console.error("Error generating synthetic samples:", error);
    throw error;
  }
};

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
    const systemPrompt = `You are an AI data scientist specializing in feature engineering. 
    Suggest new features that could improve model performance.`;
    
    const userPrompt = `
    Analyze this dataset with target column "${targetColumn}" and suggest new engineered features.
    
    Existing features: ${existingFeatures.join(", ")}
    
    Dataset sample:
    ${JSON.stringify(data.slice(0, 5), null, 2)}
    
    Return your suggestions as a JSON with these fields:
    1. suggestedFeatures: array of objects with name, description, and formula
    2. expectedImpact: description of expected impact on model performance
    `;
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 30000,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    const cleanedResponse = cleanJsonResponse(response);
    const result = safeJsonParse(cleanedResponse);
    
    return {
      suggestedFeatures: result.suggestedFeatures || [],
      expectedImpact: result.expectedImpact || "No impact information available"
    };
  } catch (error) {
    console.error("Error getting feature engineering suggestions:", error);
    return {
      suggestedFeatures: [],
      expectedImpact: "Error processing feature suggestions"
    };
  }
};

export const generateSyntheticDataWithAI = async (
  apiKey: string,
  schema: Record<string, string>,
  count: number,
  options: {
    constraints?: Record<string, any>;
    seedData?: any[];
    realism?: 'low' | 'medium' | 'high';
  } = {}
): Promise<any[]> => {
  try {
    const realism = options.realism || 'medium';
    const realismFactor = {
      'low': 0.3,
      'medium': 0.6,
      'high': 0.9
    }[realism];
    
    const systemPrompt = `You are an AI data scientist specializing in synthetic data generation.
    Generate realistic synthetic data according to the provided schema and constraints.`;
    
    const userPrompt = `
    Generate ${count} synthetic data records with this schema:
    ${JSON.stringify(schema, null, 2)}
    
    ${options.constraints ? `Constraints: ${JSON.stringify(options.constraints, null, 2)}` : ''}
    ${options.seedData ? `Seed data (use similar patterns): ${JSON.stringify(options.seedData.slice(0, 3), null, 2)}` : ''}
    
    Realism level: ${realism}
    
    Return ONLY a JSON array with the generated records. No explanations.
    `;
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      temperature: realismFactor + 0.2,
      max_tokens: 30000,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    const cleanedResponse = cleanJsonResponse(response);
    const syntheticData = safeJsonParse(cleanedResponse);
    
    if (!Array.isArray(syntheticData)) {
      throw new Error("Invalid response: expected an array of synthetic data records");
    }
    
    return syntheticData;
  } catch (error) {
    console.error("Error generating synthetic data:", error);
    throw error;
  }
};
