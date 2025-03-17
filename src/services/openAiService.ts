
import supabaseService from './supabaseService';
import { PiiData, PiiDataMasked } from './piiHandlingService';

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | {
    type: string;
    text?: string;
    image_url?: {
      url: string;
      detail: string;
    };
  }[];
  name?: string;
}

export interface OpenAiRequest {
  messages: OpenAiMessage[];
  model: string;
  temperature?: number;
  apiKey: string;
  stream?: boolean;
  maxTokens?: number;
  functions?: any[];
  functionCall?: 'auto' | 'none' | { name: string };
}

export interface OpenAiCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason: string | null;
  }[];
}

/**
 * OpenAIStream wrapper to handle streaming responses
 */
export class OpenAIStream {
  private apiKey: string;
  private messages: OpenAiMessage[];
  private model: string;
  private temperature: number;
  private maxTokens?: number;
  private functions?: any[];
  private functionCall?: 'auto' | 'none' | { name: string };
  
  constructor(
    apiKey: string,
    messages: OpenAiMessage[],
    model: string = 'gpt-4o',
    temperature: number = 0.5,
    maxTokens?: number,
    functions?: any[],
    functionCall?: 'auto' | 'none' | { name: string }
  ) {
    this.apiKey = apiKey;
    this.messages = messages;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.functions = functions;
    this.functionCall = functionCall;
  }

  async *stream(): AsyncGenerator<string, void, undefined> {
    const encoder = new TextEncoder();
    let functionCallBuffer = { name: '', arguments: '' };
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.messages,
          temperature: this.temperature,
          stream: true,
          max_tokens: this.maxTokens,
          functions: this.functions,
          function_call: this.functionCall
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error.message}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunkText = new TextDecoder().decode(value);
        const chunkLines = chunkText.split('\n').filter(line => line.trim() !== '');

        for (const line of chunkLines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            if (data === '[DONE]') {
              break;
            }

            try {
              const json: OpenAiCompletionChunk = JSON.parse(data);
              const choice = json.choices[0];

              if (choice.delta?.content) {
                yield choice.delta.content;
              } else if (choice.delta?.function_call) {
                const fc = choice.delta.function_call;
                if (fc.name) {
                  functionCallBuffer.name += fc.name;
                }
                if (fc.arguments) {
                  functionCallBuffer.arguments += fc.arguments;
                }
              }
            } catch (err) {
              console.error('Failed to parse JSON data:', err, line);
              yield `Error: Malformed JSON data.\n`;
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      yield `Error: ${error instanceof Error ? error.message : String(error)}\n`;
    } finally {
      if (functionCallBuffer.name && functionCallBuffer.arguments) {
        yield JSON.stringify(functionCallBuffer);
      }
    }
  }
}

/**
 * Creates a parser for OpenAI stream data
 * @param cb Callback function to process each parsed event
 * @returns A function that accepts stream data and parses it
 */
export const createParser = (cb: (event: string) => void) => {
  let buffer = '';
  return (data: string) => {
    buffer += data;
    let start = 0;
    let end = buffer.indexOf('\n');

    while (end !== -1) {
      const line = buffer.substring(start, end).trim();
      start = end + 1;
      end = buffer.indexOf('\n', start);

      if (line.startsWith('data:')) {
        const content = line.substring(5).trim();
        if (content === '[DONE]') {
          break;
        }
        try {
          const payload = JSON.parse(content);
          if (payload.choices && payload.choices[0].delta && payload.choices[0].delta.content) {
            cb(payload.choices[0].delta.content);
          }
        } catch (e) {
          console.error('Could not JSON parse stream event', e, content);
        }
      }
    }
    buffer = buffer.substring(start);
  };
};

/**
 * Makes a direct API call to OpenAI (for non-streaming requests)
 */
export const callOpenAI = async (apiRequest: OpenAiRequest) => {
  try {
    const response = await supabaseService.callOpenAI('chat/completions', 
      {
        messages: apiRequest.messages,
        model: apiRequest.model,
        temperature: apiRequest.temperature,
        max_tokens: apiRequest.maxTokens,
        stream: apiRequest.stream,
        functions: apiRequest.functions,
        function_call: apiRequest.functionCall
      },
      apiRequest.apiKey
    );

    return response;
  } catch (error) {
    console.error('Error in callOpenAI:', error);
    throw error;
  }
};

/**
 * Gets a completion from OpenAI
 */
export const getCompletion = async (
  apiKey: string,
  messages: OpenAiMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> => {
  try {
    const response = await callOpenAI({
      messages,
      apiKey,
      model: options?.model || 'gpt-4o',
      temperature: options?.temperature !== undefined ? options.temperature : 0.5,
      maxTokens: options?.max_tokens
    });
    
    if (response && response.choices && response.choices[0]) {
      return response.choices[0].message.content;
    }
    
    throw new Error('No response content received from OpenAI');
  } catch (error) {
    console.error('Error in getCompletion:', error);
    throw error;
  }
};

/**
 * Analyzes data with AI through the OpenAI API
 */
export const analyzeWithAI = async (
  data: any[],
  prompt: string,
  apiKey: string,
  options?: {
    model?: string;
    temperature?: number;
    responseFormat?: string; // Can be 'text', 'json', or 'analysis'
  }
) => {
  try {
    const sampleData = data.slice(0, Math.min(5, data.length));
    
    const systemPrompt = options?.responseFormat === 'json'
      ? "You are a data analysis expert. Analyze the data provided and return ONLY a JSON response with your findings. No explanations or text outside of the JSON structure."
      : "You are a data analysis expert. Analyze the data provided and give detailed insights.";
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `${prompt}\n\nHere is the data to analyze (${data.length} records in total, showing ${sampleData.length} samples):\n\n${JSON.stringify(sampleData, null, 2)}`
      }
    ];
    
    const response = await supabaseService.callOpenAI('chat/completions', 
      {
        messages,
        model: options?.model || 'gpt-4o',
        temperature: options?.temperature !== undefined ? options.temperature : 0.3,
        stream: false
      },
      apiKey
    );
    
    return response;
  } catch (error) {
    console.error('Error in analyzeWithAI:', error);
    throw error;
  }
};

/**
 * Validates and formats a string to ensure it's JSON-compatible
 */
export const formatJsonString = (str: string | number | boolean): string => {
  // Make sure it's a string
  if (typeof str !== 'string') {
    return JSON.stringify(str);
  }
  return str;
};
