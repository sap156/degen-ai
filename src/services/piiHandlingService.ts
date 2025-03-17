import { getCompletion } from './openAiService';
import supabaseService from './supabaseService';

export interface PiiData {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  ssn?: string;
  creditCard?: string;
  dob?: string;
  [key: string]: any;
}

export interface PiiDataMasked {
  id: string;
  [key: string]: any;
}

export type MaskingTechnique = 'redaction' | 'tokenization' | 'hashing' | 'encryption' | 'partial';
export type EncryptionMethod = 'aes' | 'rsa' | 'none';

export interface FieldMaskingConfig {
  technique: MaskingTechnique;
  showPartial?: boolean;
  partialFormat?: string;
  encryptionMethod?: EncryptionMethod;
  encryptionKey?: string;
}

export interface MaskingOptions {
  fields: Record<string, FieldMaskingConfig>;
  preserveFormat?: boolean;
  keepOriginal?: boolean;
}

/**
 * Apply PII masking to datasets using OpenAI
 */
export const maskPiiData = async (
  data: PiiData[],
  fieldOptions: PerFieldMaskingOptions,
  maskingOptions: {
    aiPrompt?: string;
    preserveFormat?: boolean;
  },
  apiKey: string
): Promise<PiiDataMasked[]> => {
  // Get the fields that should be masked
  const fieldsToMask = Object.entries(fieldOptions)
    .filter(([_, config]) => config.enabled)
    .map(([field]) => field);

  if (fieldsToMask.length === 0) {
    // If no fields selected, return the original data
    return data as PiiDataMasked[];
  }

  try {
    // Create a sample of data for AI to understand the structure
    const sampleData = data.slice(0, Math.min(3, data.length));
    
    // Set up the AI request
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: `You are a data privacy expert. Your task is to mask personally identifiable information (PII) in the provided dataset. 
        ${maskingOptions.aiPrompt ? `Follow these specific instructions: ${maskingOptions.aiPrompt}` : ''}
        ${maskingOptions.preserveFormat ? 'Preserve the original format of the data (e.g., XXX-XX-1234 for SSN).' : ''}
        Return ONLY the transformed data in JSON format, with no additional explanation.`
      },
      {
        role: 'user',
        content: `Here is a sample of my dataset with ${data.length} records. I need you to mask the following fields: ${fieldsToMask.join(', ')}.
        
        Sample data:
        ${JSON.stringify(sampleData, null, 2)}
        
        Please provide a masking strategy for each field and then return the complete dataset with PII properly masked.`
      }
    ];

    // Call OpenAI via Supabase Edge Function
    const response = await supabaseService.functions.invoke('openai-proxy', {
      body: {
        messages,
        apiKey,
        model: 'gpt-4o',
        temperature: 0.2,
        stream: false
      } as OpenAiRequest
    });

    if (response.error) {
      console.error('Error masking PII data:', response.error);
      throw new Error(`Failed to mask PII data: ${response.error.message}`);
    }

    // Process the response
    let maskedData: PiiDataMasked[];
    
    try {
      // Try to extract the masked data from the response
      const aiResponse = response.data as { content: string };
      
      // Find JSON in the response
      const jsonMatch = aiResponse.content.match(/```json\n([\s\S]*?)\n```/) || 
                        aiResponse.content.match(/```\n([\s\S]*?)\n```/) ||
                        [null, aiResponse.content];
      
      const jsonContent = jsonMatch[1] || aiResponse.content;
      maskedData = JSON.parse(jsonContent);
      
      // Ensure all records have IDs
      maskedData = maskedData.map((record, index) => ({
        id: record.id || data[index]?.id || String(index + 1),
        ...record
      }));
    } catch (error) {
      console.error('Error parsing masked PII data:', error);
      throw new Error('Failed to parse the masked data from AI response');
    }

    return maskedData;
  } catch (error) {
    console.error('Error in maskPiiData:', error);
    throw error;
  }
}

/**
 * Analyzes data with AI to identify potential PII fields and suggest masking strategies
 */
export const analyzePiiData = async (
  data: PiiData[],
  apiKey: string
): Promise<{ identifiedPii: string[]; suggestions: string }> => {
  try {
    const sampleData = data.slice(0, Math.min(5, data.length));
    
    const messages: OpenAiMessage[] = [
      {
        role: 'system',
        content: `You are an expert in data privacy and security. Your task is to analyze a dataset sample and identify fields that may contain Personally Identifiable Information (PII).
        Provide a list of the identified PII types and suggest masking strategies for each. Return ONLY the identified PII types and suggestions. No explanations or text outside of the identified PII types and suggestions.`
      },
      {
        role: 'user',
        content: `Here is a sample of my dataset with ${data.length} records. Please analyze it and identify potential PII fields and suggest masking strategies for each.
        
        Sample data:
        ${JSON.stringify(sampleData, null, 2)}`
      }
    ];
    
    const response = await supabaseService.functions.invoke('openai-proxy', {
      body: {
        messages,
        apiKey,
        model: 'gpt-4o',
        temperature: 0.3,
        stream: false
      } as OpenAiRequest
    });
    
    if (response.error) {
      console.error('Error analyzing data with AI:', response.error);
      throw new Error(`Failed to analyze data: ${response.error.message}`);
    }
    
    // Process the response
    const aiResponse = response.data as { content: string };
    
    // Extract identified PII types and suggestions from the response
    const identifiedPii: string[] = [];
    let suggestions: string = '';
    
    try {
      // Try to parse the response as JSON
      const jsonContent = JSON.parse(aiResponse.content);
      
      if (Array.isArray(jsonContent.identifiedPii)) {
        identifiedPii.push(...jsonContent.identifiedPii);
      }
      
      if (typeof jsonContent.suggestions === 'string') {
        suggestions = jsonContent.suggestions;
      }
    } catch (error) {
      // If JSON parsing fails, treat the entire response as suggestions
      suggestions = aiResponse.content;
    }
    
    return {
      identifiedPii,
      suggestions
    };
  } catch (error) {
    console.error('Error in analyzePiiData:', error);
    throw error;
  }
};

/**
 * Generates sample PII data for testing purposes
 */
export const generateSamplePiiData = (count: number = 10): PiiData[] => {
  const data: PiiData[] = [];
  
  for (let i = 1; i <= count; i++) {
    data.push({
      id: String(i),
      name: `User ${i}`,
      email: `user${i}@example.com`,
      phone: `555-123-${String(i).padStart(4, '0')}`,
      address: `${i} Main St, Anytown`,
      ssn: `${String(i).padStart(3, '0')}-${String(i * 2).padStart(2, '0')}-${String(i * 3).padStart(4, '0')}`,
      creditCard: `411111111111${String(i).padStart(4, '0')}`
    });
  }
  
  return data;
};

/**
 * Exports data as JSON
 * @param data The data to export
 * @returns JSON string
 */
export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Exports data as CSV
 * @param data The data to export
 * @returns CSV string
 */
export const exportAsCsv = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  
  // Get headers from first item
  const headers = Object.keys(data[0]);
  
  // Convert each data row to CSV
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle CSV special characters
      const cellValue = value === null || value === undefined ? '' : String(value);
      
      // Quote values with commas, quotes, or newlines
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        return `"${cellValue.replace(/"/g, '""')}"`;
      }
      
      return cellValue;
    }).join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Downloads data as a file
 * @param data The data content to download
 * @param filename The name of the file without extension
 * @param format The file format ('json' or 'csv')
 */
export const downloadData = (data: string, filename: string, format: 'json' | 'csv'): void => {
  // Create file extension based on format
  const extension = format === 'json' ? 'json' : 'csv';
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  
  // Create a blob and download link
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  
  // Append to the document, click, and clean up
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
