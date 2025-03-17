
import type { SchemaFieldType } from '@/utils/fileTypes';
import supabaseService from './supabaseService';

export interface DataField {
  name: string;
  type: string;
  included: boolean;
}

export interface SyntheticDataOptions {
  dataType: string;
  rowCount: number;
  distributionType?: string;
  includeNulls?: boolean;
  nullPercentage?: number;
  outputFormat?: string;
  fields: DataField[];
  uploadedData?: any[];
  aiPrompt?: string;
  onProgress?: (progress: number) => void;
}

// Default schemas for different data types
export const defaultSchemas: Record<string, DataField[]> = {
  user: [
    { name: 'id', type: 'id', included: true },
    { name: 'firstName', type: 'name', included: true },
    { name: 'lastName', type: 'name', included: true },
    { name: 'email', type: 'email', included: true },
    { name: 'age', type: 'integer', included: true },
    { name: 'phoneNumber', type: 'phone', included: true },
    { name: 'address', type: 'address', included: true },
    { name: 'createdAt', type: 'date', included: true }
  ],
  transaction: [
    { name: 'id', type: 'id', included: true },
    { name: 'userId', type: 'id', included: true },
    { name: 'amount', type: 'float', included: true },
    { name: 'currency', type: 'string', included: true },
    { name: 'description', type: 'string', included: true },
    { name: 'category', type: 'string', included: true },
    { name: 'date', type: 'date', included: true },
    { name: 'status', type: 'string', included: true }
  ],
  product: [
    { name: 'id', type: 'id', included: true },
    { name: 'name', type: 'string', included: true },
    { name: 'description', type: 'string', included: true },
    { name: 'price', type: 'float', included: true },
    { name: 'category', type: 'string', included: true },
    { name: 'inStock', type: 'boolean', included: true },
    { name: 'rating', type: 'float', included: true },
    { name: 'createdAt', type: 'date', included: true }
  ],
  health: [
    { name: 'id', type: 'id', included: true },
    { name: 'patientId', type: 'id', included: true },
    { name: 'bloodPressure', type: 'string', included: true },
    { name: 'heartRate', type: 'integer', included: true },
    { name: 'temperature', type: 'float', included: true },
    { name: 'weight', type: 'float', included: true },
    { name: 'height', type: 'float', included: true },
    { name: 'notes', type: 'string', included: true },
    { name: 'date', type: 'date', included: true }
  ],
  customer: [
    { name: 'id', type: 'id', included: true },
    { name: 'firstName', type: 'name', included: true },
    { name: 'lastName', type: 'name', included: true },
    { name: 'email', type: 'email', included: true },
    { name: 'age', type: 'integer', included: true },
    { name: 'registrationDate', type: 'date', included: true },
    { name: 'loyaltyPoints', type: 'integer', included: true },
    { name: 'isActive', type: 'boolean', included: true }
  ]
};

export const detectSchemaFromData = (data: any[]): DataField[] => {
  if (!data || data.length === 0) return [];
  
  const sample = data[0];
  return Object.entries(sample).map(([key, value]) => {
    let type = 'string';
    
    if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'float';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        type = 'date';
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        type = 'email';
      } else if (/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) {
        type = 'phone';
      }
    }
    
    return {
      name: key,
      type,
      included: true
    };
  });
};

export const generateSyntheticData = async (
  options: SyntheticDataOptions, 
  apiKey: string
): Promise<string> => {
  const { fields, rowCount, includeNulls, nullPercentage, aiPrompt, onProgress } = options;
  
  // Progress reporting
  if (onProgress) onProgress(10);
  
  try {
    const openAIService = await import('./openAiService');
    
    // Prepare field schema for the AI
    const fieldSchema = fields
      .filter(field => field.included)
      .map(field => `${field.name} (${field.type})`)
      .join(', ');
    
    const nullInstructions = includeNulls 
      ? `Include null values in approximately ${nullPercentage}% of fields.` 
      : 'Do not include any null values.';
    
    // Sample data if provided
    const sampleDataInstruction = options.uploadedData && options.uploadedData.length > 0
      ? `Base the generated data on this sample: ${JSON.stringify(options.uploadedData.slice(0, 2))}`
      : '';
    
    // Create the prompt
    const messages = [
      {
        role: 'system' as const,
        content: `You are a synthetic data generation assistant. Generate realistic, random data based on the schema provided. ${nullInstructions}`
      },
      {
        role: 'user' as const,
        content: `Generate a dataset with ${rowCount} records in JSON format with these fields: ${fieldSchema}. ${sampleDataInstruction} ${aiPrompt || ''}`
      }
    ];
    
    if (onProgress) onProgress(30);
    
    const response = await openAIService.callOpenAI('chat', {
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 4000
    }, apiKey);
    
    if (onProgress) onProgress(80);
    
    // Post-process to ensure we get clean JSON
    let cleanedResponse = response;
    
    // Try to extract JSON if the response contains markdown code blocks
    if (response.includes('```json')) {
      cleanedResponse = response.split('```json')[1].split('```')[0].trim();
    } else if (response.includes('```')) {
      cleanedResponse = response.split('```')[1].split('```')[0].trim();
    }
    
    // Verify the response is valid JSON
    try {
      JSON.parse(cleanedResponse);
    } catch (e) {
      // If parsing fails, try to fix common issues
      if (cleanedResponse.startsWith('[') && cleanedResponse.endsWith(']')) {
        return cleanedResponse;
      }
      throw new Error('Generated data is not valid JSON');
    }
    
    if (onProgress) onProgress(100);
    
    return cleanedResponse;
  } catch (error) {
    console.error('Error generating synthetic data:', error);
    throw error;
  }
};

export const downloadSyntheticData = (
  data: string,
  filename: string = 'synthetic_data',
  format: 'json' | 'csv' = 'json'
): void => {
  try {
    let formattedData: string;
    const downloadFilename = `${filename}`;
    
    // Parse the JSON string to an array of objects
    const jsonData = JSON.parse(data);
    
    if (format === 'json') {
      formattedData = JSON.stringify(jsonData, null, 2);
      
      // Create and trigger download
      const blob = new Blob([formattedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFilename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert JSON to CSV
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('Data must be an array of objects');
      }
      
      // Extract headers
      const headers = Object.keys(jsonData[0]);
      
      // Create CSV rows
      const csvRows = [
        headers.join(','),
        ...jsonData.map(row => 
          headers.map(header => {
            const value = row[header];
            const stringValue = value === null || value === undefined
              ? ''
              : String(value);
              
            // Escape quotes and wrap values with commas in quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ];
      
      // Join rows with newlines
      formattedData = csvRows.join('\n');
      
      // Create and trigger download
      const blob = new Blob([formattedData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFilename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
  } catch (error) {
    console.error('Error downloading synthetic data:', error);
    throw error;
  }
};

export const saveSyntheticDataToDatabase = async (
  data: string,
  tableName: string = 'synthetic_data'
): Promise<{ success: boolean; message?: string; count?: number }> => {
  try {
    const jsonData = JSON.parse(data);
    
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return { success: false, message: 'Data must be an array of objects' };
    }
    
    // Use supabaseService to save the data
    const client = supabaseService.getClient();
    
    // Create a new table (this would normally be handled by a more complex process)
    // For demonstration, we'll insert into an existing table or create one
    const { error, count } = await client
      .from(tableName)
      .insert(jsonData);
    
    if (error) {
      console.error('Error saving to database:', error);
      return { success: false, message: error.message };
    }
    
    return { 
      success: true, 
      message: `Successfully saved ${jsonData.length} records to ${tableName}`,
      count: count
    };
  } catch (error) {
    console.error('Error saving to database:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
