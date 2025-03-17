
import { OpenAiMessage, createMessages, getCompletion } from '@/services/openAiService';

// Helper function to standardize API calls across the application
export const processWithOpenAI = async (
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string = 'gpt-4o-mini'
): Promise<string> => {
  const messages = createMessages(systemPrompt, userPrompt);
  return await getCompletion(messages, model, apiKey);
};

// Helper to extract JSON from OpenAI response
export const extractJsonFromResponse = (response: string): any => {
  try {
    // Try to extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/);
    
    const jsonContent = jsonMatch ? jsonMatch[1] : response;
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Failed to extract JSON from response:', error);
    return null;
  }
};
