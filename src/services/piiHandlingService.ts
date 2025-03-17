import { useSupabase } from '@/hooks/useSupabase';
import { 
  PiiData, 
  PiiMaskingOptions, 
  MaskingMethod, 
  PiiDataMasked,
  FieldMaskingConfig,
  PerFieldMaskingOptions
} from '@/types/piiHandling';

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
  data: PiiData[],
  piiColumns: PerFieldMaskingOptions,
  options: PiiMaskingOptions,
  apiKey: string | null
): Promise<PiiDataMasked[]> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required to mask PII');
  }

  // Clone the data to avoid modifying the original
  const maskedData: PiiDataMasked[] = JSON.parse(JSON.stringify(data));
  
  // Apply masking methods to each identified PII field
  for (const [column, config] of Object.entries(piiColumns)) {
    if (!config.enabled) continue;
    
    // Default masking method
    let maskingMethod: MaskingMethod = 'redact';
    
    // Get the appropriate masking method for this field if specified in options
    if (options.methods && options.methods[column]) {
      maskingMethod = options.methods[column];
    }
    
    // Apply the masking method to each record
    maskedData.forEach((record: PiiDataMasked) => {
      if (record[column] !== undefined && record[column] !== null) {
        record[column] = applyMaskingMethod(String(record[column]), maskingMethod);
      }
    });
  }
  
  return maskedData;
};

// Helper function to apply a masking method to a value
const applyMaskingMethod = (value: string, method: MaskingMethod): string => {
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

// Sample data generation for UI testing
export const generateSamplePiiData = (count: number): PiiData[] => {
  const data: PiiData[] = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      phone: `555-${String(i).padStart(3, '0')}-${String(1000 + i).substring(1)}`,
      address: `${100 + i} Main St, Anytown, ST ${10000 + i}`,
      ssn: `${100 + (i % 900)}-${20 + (i % 80)}-${1000 + (i % 9000)}`,
      credit_card: `4532-${String(1000 + (i % 9000))}-${String(1000 + (i % 9000))}-${String(1000 + i % 9000)}`,
      date_of_birth: `${1960 + (i % 40)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    });
  }
  
  return data;
};

// Data export utilities
export const exportAsJson = (data: PiiData[] | PiiDataMasked[]): string => {
  return JSON.stringify(data, null, 2);
};

export const exportAsCsv = (data: PiiData[] | PiiDataMasked[]): string => {
  if (data.length === 0) return '';
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Handle strings with commas by wrapping in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
};

export const downloadData = (data: string, filename: string, format: 'json' | 'csv'): void => {
  // Create a blob with the data
  const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format}`;
  
  // Trigger the download by simulating a click
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Analyze PII data for deeper insights
export const analyzePiiData = async (
  data: PiiData[],
  apiKey: string | null
): Promise<{identifiedPii: string[], suggestions: string}> => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required for PII analysis');
  }
  
  // Take a sample of the data to analyze
  const sampleSize = Math.min(data.length, 5);
  const sample = data.slice(0, sampleSize);
  
  const systemPrompt = `You are a data privacy expert specializing in identifying and protecting Personally Identifiable Information (PII).
  Analyze the provided data sample and identify all types of PII present.
  Also provide recommendations for how each type of PII should be handled according to privacy best practices.`;
  
  const userPrompt = `Analyze this data sample for PII:
  ${JSON.stringify(sample, null, 2)}
  
  1. List all types of PII you can identify
  2. Provide specific recommendations for handling each PII type
  
  Return your analysis in this JSON format:
  {
    "identifiedPii": ["type1", "type2", ...],
    "suggestions": "Your detailed recommendations for handling the PII"
  }`;
  
  try {
    const { processWithOpenAI } = useSupabase();
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
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
        console.error('Error parsing PII analysis response:', parseError);
        return {
          identifiedPii: ['Unable to parse response'],
          suggestions: 'Error analyzing data. Please try again.'
        };
      }
    } else {
      throw new Error('No response received from AI service');
    }
  } catch (error) {
    console.error('Error analyzing PII data:', error);
    return {
      identifiedPii: ['Error'],
      suggestions: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
