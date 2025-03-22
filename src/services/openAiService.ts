
import { toast } from "sonner";

export type OpenAIGenerationOptions = {
  aiPrompt?: string;
  seedData?: any[];
  realism?: 'low' | 'medium' | 'high';
  onProgress?: (progress: number) => void;
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
    
    Return ONLY a JSON array with the generated records. No explanations.
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
            content: 'You are an AI data scientist specializing in synthetic data generation.\n    Generate realistic synthetic data according to the provided schema and constraints.'
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
      // Try to extract JSON from the response if it contains markdown or explanations
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                       generatedContent.match(/```\n([\s\S]*?)\n```/) ||
                       generatedContent.match(/\[([\s\S]*?)\]/);
                       
      const jsonStr = jsonMatch ? jsonMatch[1] : generatedContent.trim();
      
      // Clean up the string to ensure it's valid JSON
      const cleanedStr = jsonStr.replace(/^[\s\S]*?\[/, '[').replace(/\][\s\S]*?$/, ']');
      
      const generatedData = JSON.parse(cleanedStr);
      
      // Ensure we always return an array
      return Array.isArray(generatedData) ? generatedData : [generatedData];
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw response:", generatedContent);
      
      // If parsing fails, try to return a structured error message
      return [{
        error: "Failed to parse AI-generated data",
        message: "The AI generated content that could not be parsed as JSON",
        rawResponse: generatedContent.slice(0, 500) + (generatedContent.length > 500 ? '...' : '')
      }];
    }
  } catch (error) {
    console.error("Error in generateSyntheticDataWithAI:", error);
    throw error;
  }
};
