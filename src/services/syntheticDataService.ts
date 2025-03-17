
import { useSupabase } from '@/hooks/useSupabase';
import { prepareSchemaForAI, validateSchema } from '@/utils/schemaDetection';

interface SyntheticDataConfig {
  schema: Record<string, string | Record<string, any>>;
  rowCount: number;
  options?: {
    locale?: string;
    uniqueConstraints?: string[];
    customRules?: Record<string, string>;
  };
}

// This function will generate synthetic data using AI
export const generateSyntheticData = async (config: SyntheticDataConfig, apiKey: string | null) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required to generate synthetic data');
  }

  // Validate schema format
  validateSchema(config.schema);

  // Convert schema for OpenAI processing
  const preparedSchema = prepareSchemaForAI(config.schema);

  // Prepare the prompt for OpenAI
  const systemPrompt = `You are a data generation assistant. Generate synthetic data based on the provided schema. 
  Each field should follow its type constraints, and any additional information or rules should be respected.
  Return ONLY a valid JSON array with ${config.rowCount} items, matching the schema format below:`;

  const schemaDescription = JSON.stringify(preparedSchema, null, 2);
  
  const optionsDescription = config.options 
    ? `\nAdditional Options:\n${JSON.stringify(config.options, null, 2)}`
    : '';

  const userPrompt = `${schemaDescription}${optionsDescription}
  
  Generate ${config.rowCount} sample records in JSON array format.
  Ensure all data follows realistic patterns and distributions.
  Do not include any explanations in your response, only return the JSON array.`;

  // Call OpenAI via Supabase Edge Function
  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // Process and return the generated data
    if (response.choices && response.choices.length > 0) {
      const generatedContent = response.choices[0].message.content;
      try {
        // Extract the JSON array from the response
        const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Unable to parse JSON response from AI');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse synthetic data from AI response');
      }
    } else {
      throw new Error('No data received from AI service');
    }
  } catch (error) {
    console.error('Error generating synthetic data:', error);
    throw error;
  }
};

// Function to save the generated dataset to Supabase
export const saveGeneratedDataset = async (
  name: string, 
  schema: Record<string, any>, 
  userId: string,
  supabase: any
) => {
  try {
    // Call Supabase to save the dataset
    const { data, error } = await supabase
      .from('datasets')
      .insert({
        name,
        schema,
        user_id: userId
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving dataset to Supabase:', error);
    throw error;
  }
};
