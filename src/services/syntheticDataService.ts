
// Fix imports
import { createClient } from '@supabase/supabase-js';
import * as openAiService from './openAiService';
import { SchemaFieldType } from '@/utils/fileTypes';

// Create a supabase client (or import it correctly)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Interfaces for data field and sample templates
export interface DataField {
  name: string;
  type: string;
  included?: boolean;
  sampleValue?: string;
}

export interface SampleTemplate {
  [key: string]: {
    [key: string]: string;
  };
}

export interface SyntheticDataOptions {
  model?: string;
  temperature?: number;
  rowCount: number;
  diversity?: 'low' | 'medium' | 'high';
  preserveSchema?: boolean;
  enhanceRealism?: boolean;
  fields?: DataField[];
  uploadedData?: any[];
  onProgress?: (progress: number) => void;
  aiPrompt?: string;
  outputFormat?: string;
  includeNulls?: boolean;
  nullPercentage?: number;
  distributionType?: string;
  dataType?: string;
}

// Default schemas for common data types
export const defaultSchemas: Record<string, DataField[]> = {
  user: [
    { name: 'id', type: 'string', included: true },
    { name: 'firstName', type: 'name', included: true },
    { name: 'lastName', type: 'name', included: true },
    { name: 'email', type: 'email', included: true },
    { name: 'phone', type: 'phone', included: true },
    { name: 'address', type: 'address', included: true },
    { name: 'registrationDate', type: 'date', included: true },
    { name: 'loyaltyPoints', type: 'integer', included: true },
    { name: 'isActive', type: 'boolean', included: true }
  ],
  transaction: [
    { name: 'id', type: 'string', included: true },
    { name: 'customerId', type: 'string', included: true },
    { name: 'productId', type: 'string', included: true },
    { name: 'date', type: 'date', included: true },
    { name: 'amount', type: 'float', included: true },
    { name: 'paymentMethod', type: 'string', included: true },
    { name: 'isRefunded', type: 'boolean', included: true }
  ],
  product: [
    { name: 'id', type: 'string', included: true },
    { name: 'name', type: 'string', included: true },
    { name: 'category', type: 'string', included: true },
    { name: 'price', type: 'float', included: true },
    { name: 'inStock', type: 'boolean', included: true },
    { name: 'description', type: 'string', included: true },
    { name: 'rating', type: 'float', included: true }
  ],
  customer: [
    { name: 'id', type: 'string', included: true },
    { name: 'firstName', type: 'name', included: true },
    { name: 'lastName', type: 'name', included: true },
    { name: 'email', type: 'email', included: true },
    { name: 'phone', type: 'phone', included: true },
    { name: 'address', type: 'address', included: true },
    { name: 'registrationDate', type: 'date', included: true },
    { name: 'loyaltyPoints', type: 'integer', included: true },
    { name: 'isActive', type: 'boolean', included: true }
  ]
};

/**
 * Generate synthetic data based on options
 */
export const generateSyntheticData = async (options: SyntheticDataOptions, apiKey: string): Promise<string> => {
  try {
    if (!options.fields || options.fields.filter(f => f.included).length === 0) {
      throw new Error('No fields selected for generation');
    }
    
    // Update progress
    if (options.onProgress) {
      options.onProgress(10);
    }
    
    // Prepare the fields for the prompt
    const fieldDescriptions = options.fields
      .filter(field => field.included)
      .map(field => `${field.name} (${field.type})`)
      .join(', ');
    
    // Create the prompt for the AI
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a synthetic data generator that creates realistic but fake data for testing purposes.'
      },
      {
        role: 'user' as const,
        content: `${options.aiPrompt || 'Generate synthetic data'} with the following fields: ${fieldDescriptions}.
        
Generate ${options.rowCount || 10} synthetic data records in ${options.outputFormat || 'json'} format.

The data should be diverse but realistic, with internal consistency.
${options.includeNulls ? `Include null values randomly in about ${options.nullPercentage || 10}% of fields.` : 'Do not include null values.'}

Please ONLY return the ${options.outputFormat || 'json'} data without any additional text.`
      }
    ];
    
    // Update progress
    if (options.onProgress) {
      options.onProgress(30);
    }
    
    // Call the OpenAI API
    const response = await openAiService.callOpenAI({
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: 4000
    }, apiKey);
    
    // Update progress
    if (options.onProgress) {
      options.onProgress(90);
    }
    
    const generatedText = response.choices[0].message.content;
    
    // Update progress
    if (options.onProgress) {
      options.onProgress(100);
    }
    
    return generatedText;
  } catch (error) {
    console.error('Error generating synthetic data:', error);
    throw error;
  }
};

/**
 * Save synthetic data to the database
 */
export const saveSyntheticDataToDatabase = async (
  data: string,
  tableName = 'synthetic_data'
): Promise<{success: boolean; message: string; count?: number}> => {
  try {
    // Parse the data if it's a string
    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      return { success: false, message: 'Invalid JSON data' };
    }
    
    if (!Array.isArray(parsedData)) {
      return { success: false, message: 'Data must be an array of objects' };
    }
    
    // Insert data into Supabase
    const { error } = await supabaseClient
      .from(tableName)
      .insert(parsedData);
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true, 
      message: `Successfully saved ${parsedData.length} records to ${tableName}`,
      count: parsedData.length
    };
  } catch (error) {
    console.error('Error saving synthetic data to database:', error);
    return { 
      success: false, 
      message: `Failed to save data: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Detect schema from data
 */
export const detectSchemaFromData = (data: any[]): DataField[] => {
  if (!data || data.length === 0) {
    return [];
  }
  
  const fields: DataField[] = [];
  const sample = data[0];
  
  Object.entries(sample).forEach(([key, value]) => {
    let type: string = 'string'; // Default type
    
    if (value === null || value === undefined) {
      type = 'string'; // Default for null values
    } else {
      const valueType = typeof value;
      
      if (valueType === 'string') {
        // Check for date format
        if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d{3}Z)?)?$/.test(value as string)) {
          type = 'date';
        } 
        // Check for email format
        else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
          type = 'email';
        } 
        // Check for phone format
        else if (/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value as string)) {
          type = 'phone';
        }
        else {
          type = 'string';
        }
      } else if (valueType === 'number') {
        // Check if it's an integer
        type = Number.isInteger(value) ? 'integer' : 'float';
      } else if (valueType === 'boolean') {
        type = 'boolean';
      } else if (Array.isArray(value)) {
        type = 'array';
      } else if (valueType === 'object') {
        type = 'object';
      } else {
        type = valueType; // Use the JS typeof result for other types
      }
    }
    
    fields.push({ 
      name: key,
      type,
      included: true,
      sampleValue: String(value || '')
    });
  });
  
  return fields;
};

/**
 * Download synthetic data
 */
export const downloadSyntheticData = (
  data: string, 
  filename = 'synthetic_data',
  format: 'json' | 'csv' = 'json'
): void => {
  try {
    let content: string;
    let contentType: string;
    let extension: string;
    let parsedData: any[];
    
    // Parse data if it's a string
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      // If can't parse as JSON, assume it's already in the correct format (e.g. CSV)
      parsedData = [];
      content = data;
      contentType = format === 'json' ? 'application/json' : 'text/csv';
      extension = format;
    }
    
    if (parsedData && parsedData.length > 0) {
      if (format === 'json') {
        content = JSON.stringify(parsedData, null, 2);
        contentType = 'application/json';
        extension = 'json';
      } else {
        // CSV format
        const headers = Object.keys(parsedData[0]).join(',');
        const rows = parsedData.map(item => {
          return Object.values(item).map(value => {
            if (typeof value === 'string') {
              // Escape quotes in string fields
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',');
        });
        content = [headers, ...rows].join('\n');
        contentType = 'text/csv';
        extension = 'csv';
      }
    } else {
      // If we couldn't parse data but have content from the catch block above
      if (!content) {
        throw new Error('Invalid data format');
      }
    }
    
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading synthetic data:', error);
    throw error;
  }
};

/**
 * Enhanced synthetic data generation with specific parameters
 */
export const generateEnhancedSyntheticData = async (
  template: SampleTemplate,
  fields: DataField[],
  options: SyntheticDataOptions,
  apiKey: string
): Promise<any[]> => {
  try {
    const { model, temperature, count, diversity, preserveSchema, enhanceRealism } = options;
    
    // Included fields only
    const includedFields = fields.filter(field => field.included !== false);
    
    // Create a detailed prompt with specific instructions
    const messages = [
      {
        role: 'system' as const,
        content: `You are a synthetic data generator AI specialized in creating ${
          diversity === 'high' ? 'highly diverse' : 
          diversity === 'medium' ? 'moderately diverse' : 'consistent'
        } but realistic fake data for testing and development purposes.`
      },
      {
        role: 'user' as const,
        content: `Generate ${count} synthetic data records with these specifications:

Fields to include: ${includedFields.map(f => `${f.name} (${f.type})`).join(', ')}

Sample template:
${JSON.stringify(template, null, 2)}

Requirements:
${preserveSchema ? '- Strictly preserve the schema structure and data types' : '- Allow reasonable schema variations'}
${enhanceRealism ? '- Maximize realism and plausibility of the data' : '- Focus on variety over strict realism'}
- Ensure ${diversity === 'high' ? 'high diversity' : diversity === 'medium' ? 'moderate diversity' : 'low diversity'} between records
- Create internally consistent records where field relationships make sense
- Return ONLY a valid JSON array of objects without any additional text
`
      }
    ];
    
    // Call the OpenAI API
    const response = await openAiService.callOpenAI('completions', {
      model: model || 'gpt-4o-mini',
      messages,
      temperature: temperature || 0.7,
      max_tokens: 4000
    }, apiKey);
    
    const generatedText = response.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Find JSON in the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in the response');
      }
      
      const jsonString = jsonMatch[0];
      const syntheticData = JSON.parse(jsonString);
      
      // Add synthetic_id and metadata
      return syntheticData.map((record: any, index: number) => ({
        ...record,
        synthetic_id: `syn_${Date.now()}_${index}`,
        synthetic_metadata: {
          generated_at: new Date().toISOString(),
          model,
          diversity,
          enhanceRealism
        }
      }));
    } catch (parseError) {
      console.error('Error parsing enhanced generated data:', parseError);
      throw new Error('Failed to parse the generated data');
    }
  } catch (error) {
    console.error('Error generating enhanced synthetic data:', error);
    throw error;
  }
};
