
import { useSupabase } from '@/hooks/useSupabase';
import { PiiData, PiiMaskingOptions, MaskingMethod } from '@/types/piiHandling';

// Function to detect PII in a given dataset
export const detectPiiInData = async (
  data: Record<string, any>[], 
  apiKey: string | null
): Promise<Record<string, string[]>> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required to detect PII');
  }

  if (!data || data.length === 0) {
    throw new Error('No data provided for PII detection');
  }

  // Sample data to avoid token limits if necessary
  const sampleSize = Math.min(data.length, 10);
  const sampleData = data.slice(0, sampleSize);
  
  const systemPrompt = `You are a data privacy expert specializing in identifying Personally Identifiable Information (PII). 
  Analyze the provided dataset and identify all fields that contain PII. 
  Categorize them by PII type (e.g., name, email, phone, address, SSN, etc.).
  Return only a JSON object with column names as keys and an array of detected PII types as values.`;

  const userPrompt = `Analyze this dataset for PII:
  ${JSON.stringify(sampleData, null, 2)}
  
  Identify which columns contain PII and categorize them by PII type.
  Return a JSON object in this format:
  {
    "column_name": ["pii_type1", "pii_type2"],
    ...
  }
  
  Only include columns that actually contain PII. Be thorough and consider subtle forms of PII.`;

  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Response format not recognized');
        }
      } catch (parseError) {
        console.error('Error parsing PII detection response:', parseError);
        throw new Error('Failed to parse PII detection results');
      }
    } else {
      throw new Error('No response received from AI service');
    }
  } catch (error) {
    console.error('Error detecting PII:', error);
    throw error;
  }
};

// Function to mask PII in a dataset
export const maskPiiData = async (
  data: Record<string, any>[],
  piiColumns: Record<string, string[]>,
  options: PiiMaskingOptions,
  apiKey: string | null
): Promise<Record<string, any>[]> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required to mask PII');
  }

  // Clone the data to avoid modifying the original
  const maskedData = JSON.parse(JSON.stringify(data));
  
  // Apply masking methods to each identified PII field
  for (const [column, piiTypes] of Object.entries(piiColumns)) {
    const methodKey = piiTypes[0].toLowerCase() as keyof typeof options.methods;
    let maskingMethod: MaskingMethod = 'redact'; // Default method
    
    // Get the appropriate masking method for this PII type
    if (options.methods && options.methods[methodKey]) {
      maskingMethod = options.methods[methodKey];
    }
    
    // Apply the masking method to each record
    maskedData.forEach((record: Record<string, any>) => {
      if (record[column] !== undefined && record[column] !== null) {
        record[column] = applyMaskingMethod(record[column], maskingMethod);
      }
    });
  }
  
  return maskedData;
};

// Helper function to apply a masking method to a value
const applyMaskingMethod = (value: any, method: MaskingMethod): string => {
  const strValue = String(value);
  
  switch (method) {
    case 'redact':
      return '[REDACTED]';
      
    case 'hash':
      // Simple hash function for demonstration
      return `HASH_${Array.from(strValue)
        .map(c => c.charCodeAt(0))
        .reduce((acc, val) => acc + val, 0)
        .toString(16)}`;
      
    case 'partial':
      if (strValue.includes('@')) {
        // Handling email
        const [username, domain] = strValue.split('@');
        return `${username.substring(0, 2)}***@${domain}`;
      } else if (strValue.match(/^\d+$/)) {
        // Handling numeric values like phone numbers
        return `${strValue.substring(0, 2)}***${strValue.substring(strValue.length - 2)}`;
      } else {
        // General case
        return `${strValue.substring(0, 1)}***${strValue.substring(strValue.length - 1)}`;
      }
      
    case 'tokenize':
      return `TOKEN_${Math.floor(Math.random() * 1000000)}`;
      
    case 'synthetic':
      // For synthetic, we should be consistent
      if (strValue.includes('@')) {
        return 'user@example.com';
      } else if (strValue.match(/^\d+$/)) {
        return '5555555555';
      } else if (strValue.length > 10) {
        return 'Lorem ipsum dolor sit amet';
      } else {
        return 'John Doe';
      }
      
    default:
      return '[REDACTED]';
  }
};

// Function to generate synthetic PII data
export const generateSyntheticPiiData = async (
  count: number,
  dataTypes: string[],
  apiKey: string | null
): Promise<PiiData[]> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required to generate synthetic PII');
  }

  const systemPrompt = `You are a privacy-preserving data generator. Create synthetic PII data that looks realistic but doesn't correspond to real individuals.
  The data should be diverse and representative but completely fictional.`;

  const userPrompt = `Generate ${count} records of synthetic data containing the following PII types: ${dataTypes.join(', ')}.
  
  Return the data as a JSON array of objects, with each object containing the specified PII fields.
  Make sure the data is diverse and realistic but completely fictional.
  Do not include any explanations, just return the JSON array.`;

  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      try {
        // Extract JSON array from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse generated PII data');
        }
      } catch (parseError) {
        console.error('Error parsing synthetic PII data:', parseError);
        throw new Error('Failed to parse synthetic PII data');
      }
    } else {
      throw new Error('No data received from AI service');
    }
  } catch (error) {
    console.error('Error generating synthetic PII data:', error);
    throw error;
  }
};

// Function to suggest PII masking strategies based on detected PII
export const suggestPiiMaskingStrategies = async (
  piiColumns: Record<string, string[]>,
  apiKey: string | null
): Promise<Record<string, MaskingMethod>> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const systemPrompt = `You are a data privacy expert specializing in PII protection strategies. 
  Based on the identified PII fields, recommend appropriate masking methods for each PII type.
  Consider data utility and privacy regulations in your recommendations.`;

  const userPrompt = `For these detected PII fields:
  ${JSON.stringify(piiColumns, null, 2)}
  
  Recommend the most appropriate masking method for each type from these options:
  - redact: Replace with [REDACTED]
  - hash: Replace with a hash value
  - partial: Show only partial information (e.g., first & last char)
  - tokenize: Replace with a token that can be mapped back if needed
  - synthetic: Replace with realistic but fake data
  
  Return your recommendations as a JSON object with PII types as keys and recommended methods as values.
  Format: { "pii_type": "method" }`;

  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    });

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Response format not recognized');
        }
      } catch (parseError) {
        console.error('Error parsing masking strategies response:', parseError);
        throw new Error('Failed to parse masking strategy recommendations');
      }
    } else {
      throw new Error('No response received from AI service');
    }
  } catch (error) {
    console.error('Error suggesting masking strategies:', error);
    throw error;
  }
};
