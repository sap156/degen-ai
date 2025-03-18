
import { OpenAIModel } from '@/contexts/ApiKeyContext';

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionOptions {
  temperature?: number;
  max_tokens?: number;
}

export const getCompletion = async (
  apiKey: string,
  messages: OpenAiMessage[],
  options: CompletionOptions = {}
): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
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
      max_tokens: 1000
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
      max_tokens: 2000
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
