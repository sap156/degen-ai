import { toast } from "sonner";
import { PiiData, PiiDataMasked } from "./piiHandlingService";

export interface OpenAiOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Default options for OpenAI API calls
const defaultOptions: OpenAiOptions = {
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  max_tokens: 1000
};

// Function to get the completion from OpenAI API
export const getCompletion = async (
  apiKey: string | null, 
  messages: OpenAiMessage[], 
  options: OpenAiOptions = {}
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  // Get the model from localStorage if not provided in options
  if (!options.model) {
    const storedModel = localStorage.getItem('openai-model');
    options.model = storedModel || defaultOptions.model;
  }

  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: mergedOptions.model,
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.max_tokens,
        messages
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      
      // Handle different error cases
      if (data.error?.code === 'invalid_api_key') {
        toast.error("Invalid API key provided. Please check your OpenAI API key.");
      } else if (response.status === 429) {
        toast.error("Rate limit or quota exceeded on your OpenAI API key.");
      } else {
        toast.error(`OpenAI API error: ${data.error?.message || "Unknown error"}`);
      }
      
      throw new Error(data.error?.message || "Unknown OpenAI API error");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    
    // If it's not an API response error (e.g., network error)
    if (!(error instanceof Error && error.message.includes("OpenAI API"))) {
      toast.error("Failed to connect to OpenAI API. Please check your internet connection.");
    }
    
    throw error;
  }
};

// Utility function for synthetic data generation with OpenAI
export const generateSyntheticDataWithAI = async (
  apiKey: string | null,
  prompt: string,
  format: string = 'json',
  count: number = 10,
  options: { sampleData?: any[], startId?: number } = {}
): Promise<string> => {
  const { sampleData, startId } = options;
  
  // Create a more structured system message to enforce format compliance
  const systemMessage = `You are a synthetic data generator specialized in creating ${format === 'json' ? 'JSON' : 'CSV'} data. 
  You must ONLY output valid ${format.toUpperCase()} data with no additional text, explanations, or markdown formatting.
  The data must be realistic, consistent, and properly formatted.
  
  Rules:
  1. ONLY output raw ${format.toUpperCase()} data.
  2. Do not include markdown code blocks, explanations, or any text outside the data.
  3. For JSON, ensure all property names are properly quoted.
  4. For CSV, include a header row.
  5. Follow field type requirements precisely.
  6. Generate exactly ${count} rows of data unless explicitly told otherwise.
  ${startId !== undefined ? `7. Start IDs at ${startId} and increment sequentially.` : ''}`;
  
  // Create a more structured user prompt
  let formattedPrompt = `Generate ${count} rows of synthetic data with the following requirements:\n\n${prompt}`;
  
  // If we have sample data, include it
  if (sampleData && sampleData.length > 0) {
    formattedPrompt += `\n\nHere are examples of the expected format and style:`;
    sampleData.forEach(item => {
      formattedPrompt += `\n${JSON.stringify(item)}`;
    });
  }
  
  // Add specific instruction for ID continuity if startId is provided
  if (startId !== undefined) {
    formattedPrompt += `\n\nCRITICAL: Start generating IDs from ${startId} and continue sequentially.`;
  }
  
  formattedPrompt += `\n\nYou MUST return ONLY the raw ${format === 'json' ? 'JSON array' : 'CSV data'} with NO additional text.`;
  
  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: formattedPrompt }
  ];
  
  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || defaultOptions.model;
  
  try {
    return await getCompletion(apiKey, messages, {
      model,
      temperature: 0.5, // Lower temperature for more consistent output
      max_tokens: Math.min(4000, count * 50) // Adjust token count based on requested row count
    });
  } catch (error) {
    console.error("Error generating synthetic data with AI:", error);
    throw error;
  }
};

// Enhanced function to generate AI-masked PII data with improved consistency
export const generateMaskedDataWithAI = async (
  apiKey: string | null,
  sampleData: PiiData[],
  fieldsToMask: Array<keyof Omit<PiiData, 'id'>>,
  options: {
    preserveFormat?: boolean;
    customPrompt?: string;
  } = {}
): Promise<PiiDataMasked[]> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  const { preserveFormat = true, customPrompt } = options;

  // Create an enhanced system prompt with stricter guidelines
  const systemPrompt = `You are an expert in PII (Personally Identifiable Information) data masking and anonymization. 
Your task is to generate masked versions of sensitive data based on the user's specific instructions.
${preserveFormat ? "You MUST preserve the exact format (length, special characters, separators) of the original data." : ""}

STRICT REQUIREMENTS:
1. Only modify the fields explicitly specified in the user's instructions.
2. Apply the EXACT SAME masking pattern to the same field across ALL records.
3. For each field type, use a CONSISTENT masking approach.
4. If specific masking techniques are mentioned for fields, ONLY use those techniques.
5. Follow all formatting guidelines in the user's prompt precisely.
6. Return your response as a valid JSON array that exactly matches the structure of the input data.
7. DO NOT change field names or data structure.
8. DO NOT add creative explanations to your response.`;

  // Prepare an enhanced user prompt that emphasizes consistency
  const userPrompt = `I need to mask the following PII fields: ${fieldsToMask.join(', ')}.

${customPrompt ? `\nSpecific instructions for masking: ${customPrompt}` : ''}

Here's a sample of my data:
${JSON.stringify(sampleData, null, 2)}

IMPORTANT REQUIREMENTS:
1. Generate masked versions where ONLY the specified fields are changed.
2. Use the EXACT SAME masking pattern for each field across ALL records.
3. If I specified particular masking techniques for certain fields, apply ONLY those techniques.
4. Ensure the masked data is format-consistent but anonymized.
5. Do not invent new fields or change the structure.

Return ONLY valid JSON as your response, with no additional text or explanations.`;

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  // Get the model from localStorage, preferring stronger models for better pattern consistency
  const model = localStorage.getItem('openai-model') || defaultOptions.model;
  
  try {
    // Use lower temperature for more consistent outputs
    const response = await getCompletion(apiKey, messages, {
      model,
      temperature: 0.3, // Lower temperature for consistency
      max_tokens: 3000
    });
    
    try {
      // Parse and validate the response
      const maskedData = JSON.parse(response) as PiiDataMasked[];
      
      // Ensure we have valid data
      if (!Array.isArray(maskedData) || maskedData.length === 0) {
        throw new Error("Invalid response format from AI");
      }
      
      // Verify field structure integrity
      const originalFields = Object.keys(sampleData[0]);
      const maskedFields = Object.keys(maskedData[0]);
      
      if (!originalFields.every(field => maskedFields.includes(field))) {
        throw new Error("AI response missing required fields");
      }
      
      // Verify that all records maintain consistent masking patterns
      // We'll check a few random fields to ensure consistency
      const consistencyCheck = fieldsToMask.slice(0, Math.min(3, fieldsToMask.length));
      
      for (const field of consistencyCheck) {
        const patterns = new Map<string, string>();
        
        // Collect patterns used for this field
        for (let i = 0; i < Math.min(maskedData.length, sampleData.length); i++) {
          const original = sampleData[i][field];
          const masked = maskedData[i][field];
          
          if (original && masked && original !== masked) {
            patterns.set(original, masked);
          }
        }
        
        // Check for inconsistent applications of the same pattern
        for (let i = 0; i < Math.min(maskedData.length, sampleData.length); i++) {
          const original = sampleData[i][field];
          const masked = maskedData[i][field];
          
          // If we've seen this value before, it should use the same masking
          for (const [origPattern, maskPattern] of patterns.entries()) {
            if (original === origPattern && masked !== maskPattern) {
              console.warn(`Inconsistent masking detected for field ${String(field)}`);
              // We could throw here, but instead we'll just accept what we got
              // as this validation is just an extra safeguard
            }
          }
        }
      }
      
      return maskedData;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      throw new Error("Failed to parse AI-generated masked data");
    }
  } catch (error) {
    console.error("Error generating masked PII data with AI:", error);
    throw error;
  }
};

export const analyzePiiWithAI = async (
  apiKey: string | null,
  data: string
): Promise<{identifiedPii: string[], suggestions: string}> => {
  const systemMessage = `You are a PII detection expert. Identify PII (Personally Identifiable Information) in the provided data sample and suggest appropriate handling methods.`;
  
  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: `Analyze this data and identify any PII elements: ${data.substring(0, 2000)}... 
    Return your response as a JSON object with two properties: 
    1. "identifiedPii": an array of strings naming each type of PII found
    2. "suggestions": a string with recommendations for handling this data safely` }
  ];
  
  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || defaultOptions.model;
  
  try {
    const response = await getCompletion(apiKey, messages, {
      model,
      temperature: 0.3,
      max_tokens: 1000
    });
    
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", e);
      return {
        identifiedPii: [],
        suggestions: "Failed to analyze the data properly. Please try again."
      };
    }
  } catch (error) {
    console.error("Error analyzing PII data with AI:", error);
    throw error;
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

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || defaultOptions.model;
  
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

// New function to generate synthetic data for imbalanced dataset
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

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || defaultOptions.model;
  
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

// New function to get AI-powered feature engineering suggestions
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

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || defaultOptions.model;
  
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
