
import { OpenAIClient } from '@/types/openai';

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
