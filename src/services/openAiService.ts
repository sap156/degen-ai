
import OpenAI from 'openai';

// Export common types
export interface CompletionOptions {
  model: string;
  messages: OpenAiMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// New interface for OpenAI messages
export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Call OpenAI API for text completion
 */
export const callOpenAI = async (
  options: CompletionOptions,
  apiKey: string
) => {
  try {
    // Check for required options
    if (!options.model || !options.messages || !apiKey) {
      throw new Error('Missing required parameters for OpenAI API call');
    }

    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Allow in browser environment
    });

    // Make API call
    const response = await openai.chat.completions.create({
      model: options.model,
      messages: options.messages as any, // Type casting to handle OpenAI API types
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      top_p: options.top_p,
      frequency_penalty: options.frequency_penalty,
      presence_penalty: options.presence_penalty,
    });

    return response;
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    
    // Enhanced error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      if (statusCode === 401) {
        throw new Error('API key is invalid or expired');
      }
      else if (statusCode === 429) {
        throw new Error('Rate limit exceeded or insufficient quota');
      }
      else {
        throw new Error(`OpenAI API error (${statusCode}): ${errorData?.error?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from OpenAI API. Please check your network connection.');
    } else {
      // Something happened in setting up the request
      throw new Error(`Error setting up OpenAI request: ${error.message}`);
    }
  }
};

/**
 * Helper function to get completion from OpenAI
 */
export const getCompletion = async (
  messages: OpenAiMessage[],
  model: string = 'gpt-4o-mini',
  apiKey: string,
  options: Partial<CompletionOptions> = {}
) => {
  const response = await callOpenAI(
    {
      model,
      messages,
      ...options
    },
    apiKey
  );
  
  return response.choices[0].message.content;
};
