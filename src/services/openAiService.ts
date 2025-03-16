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

// Utility function for PII handling with OpenAI
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

// New function to generate AI-masked PII data
export const generateMaskedDataWithAI = async (
  apiKey: string | null,
  sampleData: PiiData[],
  fieldsToMask: Array<keyof Omit<PiiData, 'id'>>,
  options: {
    preserveFormat?: boolean;
    randomizationLevel?: 'low' | 'medium' | 'high';
    customPrompt?: string;
  } = {}
): Promise<PiiDataMasked[]> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  const { preserveFormat = true, randomizationLevel = 'medium', customPrompt } = options;

  // Create a system prompt that instructs the AI on masking behavior
  const systemPrompt = `You are an expert in PII (Personally Identifiable Information) data masking and anonymization. 
Your task is to generate realistic but fictional masked versions of sensitive data that:
1. Maintain the same general format and pattern as the original
2. Are completely fictional and cannot be traced back to the original data
3. Follow field-specific patterns (emails look like emails, phone numbers look like phone numbers, etc.)
4. Apply a ${randomizationLevel} level of randomization
${preserveFormat ? "5. Preserve the exact format of the original data (length, special characters, etc.)" : ""}

Only modify the fields specified. Return your response as a valid JSON array.`;

  // Prepare the user prompt with the data to mask and instructions
  const userPrompt = `I need to mask the following PII fields: ${fieldsToMask.join(', ')}.
${customPrompt ? `Follow these specific instructions: ${customPrompt}` : ''}

Here's a sample of my data:
${JSON.stringify(sampleData, null, 2)}

Please generate masked versions of this data where only the specified fields are changed.
Return ONLY valid JSON as your response, with no additional text or explanations.`;

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  
  // Get the model from localStorage
  const model = localStorage.getItem('openai-model') || defaultOptions.model;
  
  try {
    const response = await getCompletion(apiKey, messages, {
      model,
      // Higher temperature for more creative masking
      temperature: randomizationLevel === 'low' ? 0.3 : randomizationLevel === 'medium' ? 0.7 : 1.0,
      max_tokens: 3000
    });
    
    try {
      // Parse and validate the response
      const maskedData = JSON.parse(response) as PiiDataMasked[];
      
      // Ensure we have valid data
      if (!Array.isArray(maskedData) || maskedData.length === 0) {
        throw new Error("Invalid response format from AI");
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
