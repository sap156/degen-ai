
import { toast } from "sonner";

export type OpenAIGenerationOptions = {
  aiPrompt?: string;
  seedData?: any[];
  realism?: 'low' | 'medium' | 'high';
  onProgress?: (progress: number) => void;
};

// Define OpenAiMessage type needed by several services
export type OpenAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{type: string; [key: string]: any}>;
};

// Function to generate synthetic data with AI
export const generateSyntheticDataWithAI = async (
  apiKey: string, 
  schema: Record<string, string> = {}, 
  rowCount: number = 10,
  options: OpenAIGenerationOptions = {}
): Promise<any[]> => {
  try {
    const { aiPrompt, seedData, realism = 'medium' } = options;
    
    // Construct the prompt for the AI model
    let promptContent = `
    Generate ${rowCount} synthetic data records with this schema:
    ${Object.keys(schema).length > 0 ? JSON.stringify(schema, null, 2) : ''}
    `;
    
    // Add seed data to the prompt if provided
    if (seedData && seedData.length > 0) {
      promptContent += `
      Use these examples as reference:
      ${JSON.stringify(seedData, null, 2)}
      `;
    }
    
    // Add AI prompt if provided
    if (aiPrompt && aiPrompt.trim()) {
      promptContent += `
      
      Additional requirements: ${aiPrompt}
      `;
    }
    
    // Add realism level
    promptContent += `
    
    Realism level: ${realism}
    
    Return ONLY a JSON array with the generated records. No explanations or additional text.
    The response must be a valid JSON array starting with [ and ending with ] without any markdown formatting.
    `;
    
    // For prompt-only mode, prioritize the AI prompt
    if (Object.keys(schema).length === 0 && aiPrompt && aiPrompt.trim()) {
      // Create a more specific prompt for prompt-only mode
      promptContent = `
      Generate ${rowCount} synthetic data records based on this description:
      ${aiPrompt}
      
      Create data with realistic field names and values that match the description.
      Include diverse fields and relationships between them.
      Each record should be a complete JSON object with meaningful field names and appropriate data types.
      
      Realism level: ${realism}
      
      Return ONLY a JSON array with the ${rowCount} generated records. No explanations or additional text.
      The response must be a valid JSON array starting with [ and ending with ] without any markdown formatting.
      `;
    }
    
    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI data scientist specializing in synthetic data generation. Generate realistic synthetic data according to the provided schema and constraints. Your response must be a valid JSON array only, with no additional text or markdown formatting.'
          },
          {
            role: 'user',
            content: promptContent
          }
        ],
        temperature: 0.8,
        max_tokens: 16384,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // First try direct JSON parsing
      try {
        const directParse = JSON.parse(generatedContent.trim());
        if (Array.isArray(directParse)) {
          return directParse;
        }
      } catch (e) {
        // If direct parsing fails, we'll try more sophisticated approaches below
        console.log("Direct JSON parsing failed, trying alternative methods");
      }
      
      // Try to extract JSON from the response if it contains markdown or explanations
      let jsonContent = generatedContent;
      
      // Remove markdown code blocks if present
      const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1].trim();
      }
      
      // Find the first [ and last ] to extract the JSON array
      const startIdx = jsonContent.indexOf('[');
      const endIdx = jsonContent.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonContent = jsonContent.substring(startIdx, endIdx + 1);
      }
      
      // Clean up common issues in the JSON string
      jsonContent = jsonContent
        .replace(/\\'/g, "'") // Replace escaped single quotes
        .replace(/,\s*}/g, '}') // Remove trailing commas in objects
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/}\s*{/g, '},{') // Fix missing commas between objects
        .replace(/]\s*\[/g, '],[') // Fix missing commas between arrays
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"\s*\n\s*"/g, '","') // Fix newlines in strings
        .replace(/"\s*,\s*,\s*"/g, '","'); // Fix double commas
      
      try {
        const parsedData = JSON.parse(jsonContent);
        if (Array.isArray(parsedData)) {
          return parsedData;
        } else {
          // If we got an object but not an array, see if it contains an array property
          for (const key in parsedData) {
            if (Array.isArray(parsedData[key])) {
              return parsedData[key];
            }
          }
          // If we can't find an array, wrap the object in an array
          return [parsedData];
        }
      } catch (parseError) {
        console.error("Error parsing JSON after cleanup:", parseError);
        
        // Last resort: try to fix the JSON with a more aggressive approach
        try {
          // Remove all whitespace and try again with a regex-based approach
          const arrayMatch = generatedContent.match(/\[\s*{[\s\S]*}\s*\]/);
          if (arrayMatch) {
            const arrayContent = arrayMatch[0];
            return JSON.parse(arrayContent);
          }
        } catch (lastError) {
          console.error("All JSON parsing attempts failed");
        }
        
        // If all parsing attempts fail, return an error structure
        console.log("Raw response:", generatedContent);
        return [{
          error: "Failed to parse AI-generated data",
          message: "The AI generated content that could not be parsed as JSON",
          rawResponse: generatedContent
        }];
      }
    } catch (error) {
      console.error("Error in JSON extraction logic:", error);
      console.log("Raw response:", generatedContent);
      
      // If parsing fails, try to return a structured error message
      return [{
        error: "Failed to parse AI-generated data",
        message: "The AI generated content that could not be parsed as JSON",
        rawResponse: generatedContent
      }];
    }
  } catch (error) {
    console.error("Error in generateSyntheticDataWithAI:", error);
    throw error;
  }
};

// Generic function to get completion from OpenAI used by many services
export const getCompletion = async (
  apiKey: string | null, 
  messages: OpenAiMessage[], 
  options: { 
    model?: string;
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  } = {}
): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  const {
    model = 'gpt-4o',
    temperature = 0.7,
    max_tokens = 4000,
    ...otherOptions
  } = options;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        ...otherOptions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};

// Function for analyzing PII data with AI
export const analyzePiiWithAI = async (
  apiKey: string,
  sampleData: string
): Promise<{ identifiedPii: string[], suggestions: string }> => {
  try {
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are an AI specialized in identifying Personally Identifiable Information (PII) in datasets.'
      },
      {
        role: 'user',
        content: `Analyze this sample data and identify any PII fields:\n\n${sampleData}\n\nReturn a JSON object with "identifiedPii" (array of field names) and "suggestions" (string with masking recommendations).`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      model: 'gpt-4o'
    });

    try {
      const result = JSON.parse(response);
      return {
        identifiedPii: Array.isArray(result.identifiedPii) ? result.identifiedPii : [],
        suggestions: typeof result.suggestions === 'string' ? result.suggestions : 'No specific suggestions provided'
      };
    } catch (parseError) {
      console.error("Error parsing analyzePiiWithAI response:", parseError);
      return {
        identifiedPii: ['Error: Could not parse PII analysis results'],
        suggestions: 'Error analyzing data. Please try again with a different sample.'
      };
    }
  } catch (error) {
    console.error("Error in analyzePiiWithAI:", error);
    throw error;
  }
};

// Function for generating masked data with AI
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
    const sampleData = JSON.stringify(data, null, 2);
    const preserveFormat = options.preserveFormat !== undefined ? options.preserveFormat : true;
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are an AI specialized in data privacy and masking PII information.'
      },
      {
        role: 'user',
        content: options.customPrompt || 
          `Mask the following fields in this data: ${fieldsToMask.join(', ')}
           ${preserveFormat ? 'Preserve the format of each field.' : 'You can change formats if needed.'}
           Return the modified data as a JSON array.\n\n${sampleData}`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      model: 'gpt-4o'
    });

    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error("Error parsing generateMaskedDataWithAI response:", parseError);
      throw new Error("Failed to parse masked data response");
    }
  } catch (error) {
    console.error("Error in generateMaskedDataWithAI:", error);
    throw error;
  }
};

// Functions for aiDataAnalysisService.ts
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
    const sampleData = JSON.stringify(data.slice(0, 10), null, 2);
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are an AI specialized in analyzing imbalanced datasets for machine learning.'
      },
      {
        role: 'user',
        content: `Analyze this imbalanced dataset with target column "${targetColumn}" and class labels ${JSON.stringify(classLabels)}.
        ${datasetContext ? `Dataset context: ${datasetContext}` : ''}
        ${performancePriorities ? `Performance priorities: ${performancePriorities.join(', ')}` : ''}
        Return analysis, recommendations, and suggested methods as a JSON object.
        
        Sample data: ${sampleData}`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      model: 'gpt-4o'
    });

    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error("Error parsing analyzeImbalancedDataset response:", parseError);
      return {
        analysis: "Error parsing analysis results",
        recommendations: "Please try again with a different dataset",
        suggestedMethods: []
      };
    }
  } catch (error) {
    console.error("Error in analyzeImbalancedDataset:", error);
    throw error;
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
    const sampleData = JSON.stringify(minorityClassSamples.slice(0, 5), null, 2);
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are an AI specialized in generating synthetic data samples for imbalanced datasets.'
      },
      {
        role: 'user',
        content: `Generate ${count} synthetic samples for the minority class "${minorityClass}" in column "${targetColumn}".
        Diversity level: ${diversity}
        Use these examples as reference: ${sampleData}
        Return ONLY a JSON array with the generated samples.`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: diversity === 'low' ? 0.3 : diversity === 'medium' ? 0.6 : 0.9,
      model: 'gpt-4o'
    });

    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error("Error parsing generateSyntheticSamplesForImbalance response:", parseError);
      throw new Error("Failed to parse synthetic samples response");
    }
  } catch (error) {
    console.error("Error in generateSyntheticSamplesForImbalance:", error);
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
    const sampleData = JSON.stringify(data.slice(0, 5), null, 2);
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: 'You are an AI specialized in feature engineering for machine learning.'
      },
      {
        role: 'user',
        content: `Suggest feature engineering ideas for a dataset with target column "${targetColumn}".
        Existing features: ${JSON.stringify(existingFeatures)}
        Sample data: ${sampleData}
        Return suggestions as a JSON object with "suggestedFeatures" array and "expectedImpact" string.`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.5,
      model: 'gpt-4o'
    });

    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error("Error parsing getFeatureEngineeringSuggestions response:", parseError);
      return {
        suggestedFeatures: [],
        expectedImpact: "Error parsing feature engineering suggestions"
      };
    }
  } catch (error) {
    console.error("Error in getFeatureEngineeringSuggestions:", error);
    throw error;
  }
};
