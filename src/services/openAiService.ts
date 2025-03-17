
export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const createMessages = (systemPrompt: string, userPrompt: string): OpenAiMessage[] => {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
};

export const getCompletion = async (
  messages: OpenAiMessage[], 
  model: string = 'gpt-4o-mini', 
  apiKey: string
): Promise<string> => {
  try {
    // Check if messages is already in the correct format
    const formattedMessages = Array.isArray(messages) ? 
      messages : 
      createMessages("You are a helpful assistant.", messages as unknown as string);
    
    // Implementation of API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};
