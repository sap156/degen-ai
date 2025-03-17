
import supabaseService from './supabaseService';
import { callOpenAI } from './openAiService';
import { prepareSchemaForAI, validateSchema } from '@/utils/schemaDetection';

// Export these interfaces for use in other components
export interface DataField {
  name: string;
  type: string;
  attributes?: Record<string, any>;
  included?: boolean; // Make sure this property is defined
}

export interface SyntheticDataOptions {
  recordCount: number;
  dataSchema: Record<string, any>;
  distribution?: string;
  locale?: string;
  seed?: number;
  tableName?: string;
}

/**
 * Save synthetic data to the database
 * @param data The synthetic data to save
 * @param tableName The name of the table to save to
 * @returns Success status and count
 */
export const saveSyntheticDataToDatabase = async (
  data: any[],
  tableName: string
): Promise<{ success: boolean; count: number; message?: string }> => {
  if (!data || data.length === 0) {
    return { success: false, count: 0, message: 'No data to save' };
  }

  try {
    const { error, count } = await supabaseService.getClient()
      .from(tableName)
      .insert(data);

    if (error) {
      console.error('Error saving data to database:', error);
      return {
        success: false,
        count: 0,
        message: `Failed to save data: ${error.message}`
      };
    }

    return {
      success: true,
      count: count || data.length,
      message: `Successfully saved ${count || data.length} records to ${tableName}`
    };
  } catch (error) {
    console.error('Error in saveSyntheticDataToDatabase:', error);
    return {
      success: false,
      count: 0,
      message: `Error: ${(error as Error).message}`
    };
  }
};

/**
 * Generates synthetic data based on a data schema using AI
 * @param options Options for generating synthetic data
 * @param apiKey OpenAI API key
 * @returns An array of generated data records
 */
export const generateSyntheticData = async (
  options: SyntheticDataOptions,
  apiKey: string
): Promise<any[]> => {
  try {
    // Validate the schema
    validateSchema(options.dataSchema);

    // Prepare the schema for AI consumption
    const aiSchema = prepareSchemaForAI(options.dataSchema);

    // Construct the prompt for the AI
    const prompt = `Generate ${options.recordCount} records of synthetic data based on the following schema: ${JSON.stringify(
      aiSchema
    )}. Return the data as a JSON array.`;

    // Call the OpenAI API
    const aiResponse = await callOpenAI({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert data generator. Your task is to generate synthetic data based on a provided schema. Return the data as a JSON array.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'gpt-4o',
      temperature: 0.7,
      apiKey: apiKey
    });

    // Parse the AI response
    let generatedData: any[];
    try {
      generatedData = JSON.parse(aiResponse.content);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse the generated data from AI response');
    }

    return generatedData;
  } catch (error) {
    console.error('Error in generateSyntheticData:', error);
    throw error;
  }
};

/**
 * Export the generated data as JSON or CSV and download it
 * @param data The data to export
 * @param filename The filename to use
 * @param format The format to export (json or csv)
 */
export const downloadSyntheticData = (
  data: any[],
  filename: string,
  format: 'json' | 'csv'
) => {
  let content: string;
  let mimeType: string;
  
  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  } else {
    // CSV format
    if (!data || data.length === 0) {
      content = '';
    } else {
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(field => {
            const value = row[field];
            // Handle values that need quoting
            return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
              ? `"${value.replace(/"/g, '""')}"`
              : value === null || value === undefined ? '' : value;
          }).join(',')
        )
      ];
      content = csvRows.join('\n');
    }
    mimeType = 'text/csv';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Sample schema definitions
export const defaultSchemas = {
  customer: {
    id: 'string',
    firstName: 'string',
    lastName: 'string',
    email: 'email',
    age: 'integer',
    registrationDate: 'date',
    loyaltyPoints: 'integer',
    isActive: 'boolean'
  },
  transaction: {
    id: 'string',
    customerId: 'string',
    amount: 'float',
    date: 'date',
    category: 'string',
    status: 'string',
    isRefunded: 'boolean'
  },
  product: {
    id: 'string',
    name: 'string',
    description: 'string',
    price: 'float',
    category: 'string',
    inStock: 'boolean',
    quantity: 'integer',
    lastUpdated: 'date'
  }
};

/**
 * Detect a schema from sample data
 * @param data Sample data to analyze
 * @returns A schema definition
 */
export const detectSchemaFromData = (data: any[]): Record<string, string> => {
  if (!data || !data.length) {
    return {};
  }
  
  const sample = data[0];
  const schema: Record<string, string> = {};
  
  Object.entries(sample).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      schema[key] = 'string'; // Default for null values
      return;
    }
    
    const type = typeof value;
    
    if (type === 'string') {
      // Check for date format
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d{3}Z)?)?$/.test(value as string)) {
        schema[key] = 'date';
      } 
      // Check for email format
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
        schema[key] = 'email';
      } else {
        schema[key] = 'string';
      }
    } else if (type === 'number') {
      // Check if it's an integer
      schema[key] = Number.isInteger(value) ? 'integer' : 'float';
    } else if (type === 'boolean') {
      schema[key] = 'boolean';
    } else if (Array.isArray(value)) {
      schema[key] = 'array';
    } else if (type === 'object') {
      schema[key] = 'object';
    } else {
      schema[key] = 'string'; // Default fallback
    }
  });
  
  return schema;
};
