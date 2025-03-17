
import { supabaseClient } from './supabaseService';
import * as openAiService from './openAiService';

// Interfaces for data field and sample templates
export interface DataField {
  name: string;
  type: string;
  included?: boolean;
}

export interface SampleTemplate {
  [key: string]: {
    [key: string]: string;
  };
}

export interface SyntheticDataOptions {
  model: string;
  temperature: number;
  count: number;
  diversity: 'low' | 'medium' | 'high';
  preserveSchema: boolean;
  enhanceRealism: boolean;
}

// Default schemas for common data types
export const defaultSchemas = {
  customer: {
    id: 'string',
    firstName: 'name',
    lastName: 'name',
    email: 'email',
    phone: 'phone',
    address: 'address',
    registrationDate: 'date',
    loyaltyPoints: 'integer',
    isActive: 'boolean'
  },
  transaction: {
    id: 'string',
    customerId: 'string',
    productId: 'string',
    date: 'date',
    amount: 'float',
    paymentMethod: 'string',
    isRefunded: 'boolean'
  },
  product: {
    id: 'string',
    name: 'string',
    category: 'string',
    price: 'float',
    inStock: 'boolean',
    description: 'string',
    rating: 'float'
  }
};

/**
 * Generate synthetic data based on a template and schema
 */
export const generateSyntheticData = async (
  template: SampleTemplate,
  fields: DataField[],
  count: number,
  apiKey: string
): Promise<any[]> => {
  try {
    // Prepare the fields for the prompt
    const fieldDescriptions = fields
      .filter(field => field.included !== false)
      .map(field => `${field.name} (${field.type})`)
      .join(', ');
    
    // Create a sample data point for reference
    const sampleData: Record<string, any> = {};
    
    // Extract a sample from the template
    Object.entries(template).forEach(([category, items]) => {
      Object.entries(items).forEach(([field, value]) => {
        sampleData[field] = value;
      });
    });
    
    // Create the prompt for the AI
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a synthetic data generator that creates realistic but fake data for testing purposes.'
      },
      {
        role: 'user' as const,
        content: `Generate ${count} synthetic data records with the following fields: ${fieldDescriptions}.
        
The data should be returned as a valid JSON array of objects.
Each object should have all the fields mentioned above.

Here's a sample data point for reference:
${JSON.stringify(sampleData, null, 2)}

Make sure the generated data:
1. Has realistic values for each field based on its type
2. Has internal consistency (e.g., dates make sense, related fields are logical)
3. Is diverse but realistic
4. Is returned as a valid JSON array that I can parse directly

Please ONLY return the JSON array without any additional text.`
      }
    ];
    
    // Call the OpenAI API
    const response = await openAiService.callOpenAI('completions', {
      model: 'gpt-4o-mini',
      messages
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
      
      // Add a synthetic_id field to each record
      return syntheticData.map((record: any, index: number) => ({
        ...record,
        synthetic_id: `syn_${index + 1}`
      }));
    } catch (parseError) {
      console.error('Error parsing generated data:', parseError);
      throw new Error('Failed to parse the generated data');
    }
  } catch (error) {
    console.error('Error generating synthetic data:', error);
    throw error;
  }
};

/**
 * Save synthetic data to the database
 */
export const saveSyntheticDataToDatabase = async (
  data: any[],
  tableName: string
): Promise<{success: boolean; message: string; count?: number}> => {
  try {
    // Insert data into Supabase
    const { error } = await supabaseClient
      .from(tableName)
      .insert(data);
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true, 
      message: `Successfully saved ${data.length} records to ${tableName}`,
      count: data.length
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
export const detectSchemaFromData = (data: any[]): Record<string, string> => {
  if (!data || data.length === 0) {
    return {};
  }
  
  const schema: Record<string, string> = {};
  const sample = data[0];
  
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
      } 
      // Check for phone format
      else if (/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value as string)) {
        schema[key] = 'phone';
      }
      else {
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

/**
 * Download synthetic data
 */
export const downloadSyntheticData = (data: any[], format: 'json' | 'csv'): void => {
  try {
    let content: string;
    let contentType: string;
    let extension: string;
    
    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      extension = 'json';
    } else {
      // CSV format
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => {
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
    
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthetic_data_${new Date().getTime()}.${extension}`;
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
