import { toast } from "sonner";

export type OpenAIGenerationOptions = {
  aiPrompt?: string;
  seedData?: any[];
  realism?: 'low' | 'medium' | 'high';
  onProgress?: (progress: number) => void;
};

export type OpenAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: {
      url: string;
      detail?: 'auto' | 'low' | 'high';
    };
  }>;
};

export interface OpenAiCompletionOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
  stream?: boolean;
}

export const generateSyntheticDataWithAI = async (
  apiKey: string, 
  schema: Record<string, string> = {}, 
  rowCount: number = 10,
  options: OpenAIGenerationOptions = {}
): Promise<any[]> => {
  try {
    const { aiPrompt, seedData, realism = 'medium' } = options;
    
    let promptContent = `
    Generate ${rowCount} synthetic data records with this schema:
    ${Object.keys(schema).length > 0 ? JSON.stringify(schema, null, 2) : ''}
    `;
    
    if (seedData && seedData.length > 0) {
      promptContent += `
      Use these examples as reference:
      ${JSON.stringify(seedData, null, 2)}
      `;
    }
    
    if (aiPrompt && aiPrompt.trim()) {
      promptContent += `
      
      Additional requirements: ${aiPrompt}
      `;
    }
    
    promptContent += `
    
    Realism level: ${realism}
    
    Return ONLY a JSON array with the generated records. No explanations or additional text.
    The response must be a valid JSON array starting with [ and ending with ] without any markdown formatting.
    `;
    
    if (Object.keys(schema).length === 0 && aiPrompt && aiPrompt.trim()) {
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
    
    try {
      try {
        const directParse = JSON.parse(generatedContent.trim());
        if (Array.isArray(directParse)) {
          return directParse;
        }
      } catch (e) {
        console.log("Direct JSON parsing failed, trying alternative methods");
      }
      
      let jsonContent = generatedContent;
      
      const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1].trim();
      }
      
      const startIdx = jsonContent.indexOf('[');
      const endIdx = jsonContent.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonContent = jsonContent.substring(startIdx, endIdx + 1);
      }
      
      jsonContent = jsonContent
        .replace(/\\'/g, "'")
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/}\s*{/g, '},{')
        .replace(/]\s*\[/g, '],[')
        .replace(/\\/g, '\\\\')
        .replace(/"\s*\n\s*"/g, '","')
        .replace(/"\s*,\s*,\s*"/g, '","');
      
      try {
        const parsedData = JSON.parse(jsonContent);
        if (Array.isArray(parsedData)) {
          return parsedData;
        } else {
          for (const key in parsedData) {
            if (Array.isArray(parsedData[key])) {
              return parsedData[key];
            }
          }
          return [parsedData];
        }
      } catch (parseError) {
        console.error("Error parsing JSON after cleanup:", parseError);
        
        try {
          const arrayMatch = generatedContent.match(/\[\s*{[\s\S]*}\s*\]/);
          if (arrayMatch) {
            const arrayContent = arrayMatch[0];
            return JSON.parse(arrayContent);
          }
        } catch (lastError) {
          console.error("All JSON parsing attempts failed");
        }
        
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

export const getCompletion = async (
  apiKey: string,
  messages: OpenAiMessage[],
  options: OpenAiCompletionOptions = {}
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

export const detectPiiFields = async (
  apiKey: string,
  sampleData: any[]
): Promise<any> => {
  try {
    const sampleDataString = JSON.stringify(sampleData.slice(0, 5), null, 2);
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: `You are an expert in personally identifiable information (PII) detection. 
        You need to analyze a dataset and identify potential PII fields.
        For each identified field, provide:
        1. The field name
        2. Your confidence level (high, medium, low)
        3. A suggested masking technique
        4. Example values from the data
        
        Also suggest an appropriate masking prompt for the detected fields.
        Return your analysis in a valid JSON format according to this structure:
        {
          "detectedFields": [
            {
              "fieldName": "string",
              "confidence": "high|medium|low",
              "suggestedMaskingTechnique": "character-masking|truncation|tokenization|encryption|redaction|synthetic-replacement",
              "examples": ["string"]
            }
          ],
          "suggestedPrompt": "string",
          "undetectedFields": ["string"]
        }`
      },
      {
        role: 'user',
        content: `Please analyze this dataset and identify potential PII fields:\n\n${sampleDataString}`
      }
    ];

    const response = await getCompletion(apiKey, messages, {
      temperature: 0.1,
      model: 'gpt-4o-mini'
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Error parsing PII detection result:", error);
      return {
        detectedFields: [],
        suggestedPrompt: "",
        undetectedFields: Object.keys(sampleData[0] || {})
      };
    }
  } catch (error) {
    console.error("Error in PII detection:", error);
    throw error;
  }
};

export const analyzePiiWithAI = async (
  apiKey: string, 
  sampleData: string
): Promise<{ identifiedPii: string[], suggestions: string }> => {
  const messages: OpenAiMessage[] = [
    {
      role: 'system',
      content: `You are an expert in personally identifiable information (PII) detection.
      Analyze the provided data sample and identify any PII fields.
      Also provide specific suggestions for how each type of PII should be masked.
      Return your analysis in a valid JSON format according to this structure:
      {
        "identifiedPii": ["array of field names that contain PII"],
        "suggestions": "detailed suggestions for masking each PII type"
      }`
    },
    {
      role: 'user',
      content: `Please analyze this data sample and identify PII fields:\n\n${sampleData}`
    }
  ];

  try {
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.1,
      model: 'gpt-4o-mini'
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Error parsing PII analysis result:", error);
      return {
        identifiedPii: [],
        suggestions: "Unable to generate suggestions. Please check the data format."
      };
    }
  } catch (error) {
    console.error("Error in PII analysis:", error);
    throw error;
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
  const sampleData = JSON.stringify(data.slice(0, 3), null, 2);
  const fieldsStr = fieldsToMask.join(", ");
  const preserveFormat = options.preserveFormat !== undefined ? options.preserveFormat : true;
  
  const customPrompt = options.customPrompt || 
    "Mask the PII data while preserving the format and ensuring privacy.";
  
  const messages: OpenAiMessage[] = [
    {
      role: 'system',
      content: `You are an expert in PII data masking.
      You will be given a sample of data records and a list of fields to mask.
      ${customPrompt}
      
      The fields to mask are: ${fieldsStr}
      ${preserveFormat ? 'IMPORTANT: Preserve the format (length, structure) of each field when masking.' : ''}
      
      Return ONLY a valid JSON array of the masked records with the same structure.`
    },
    {
      role: 'user',
      content: `Please mask the following data:\n\n${sampleData}`
    }
  ];

  try {
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.2,
      model: 'gpt-4o-mini'
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error("Error parsing masked data result:", error);
      throw new Error("Failed to generate masked data with AI");
    }
  } catch (error) {
    console.error("Error in generating masked data:", error);
    throw error;
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
