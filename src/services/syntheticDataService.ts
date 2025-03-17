import { useSupabase } from '@/hooks/useSupabase';

// Create our own utility functions instead of importing from schemaDetection
// to avoid circular dependencies
const validateSchema = (schema: Record<string, string | Record<string, any>>): void => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new Error('Schema must be a non-array object');
  }
  
  // Check if schema has at least one property
  if (Object.keys(schema).length === 0) {
    throw new Error('Schema cannot be empty');
  }
  
  // Validate each field
  Object.entries(schema).forEach(([key, value]) => {
    if (!key || typeof key !== 'string') {
      throw new Error('Field names must be non-empty strings');
    }
    
    if (typeof value !== 'string' && typeof value !== 'object') {
      throw new Error(`Field "${key}" has invalid type definition`);
    }
  });
};

const prepareSchemaForAI = (schema: Record<string, string | Record<string, any>>): Record<string, any> => {
  const preparedSchema: Record<string, any> = {};
  
  Object.entries(schema).forEach(([field, definition]) => {
    if (typeof definition === 'string') {
      // For simple string type definitions
      preparedSchema[field] = { type: definition };
    } else if (typeof definition === 'object') {
      // Keep complex definitions as they are
      preparedSchema[field] = definition;
    }
  });
  
  return preparedSchema;
};

export interface DataField {
  name: string;
  type: string;
  included: boolean;
}

export interface SyntheticDataConfig {
  schema: Record<string, string | Record<string, any>>;
  rowCount: number;
  options?: {
    locale?: string;
    uniqueConstraints?: string[];
    customRules?: Record<string, string>;
  };
}

export interface SyntheticDataOptions {
  dataType: string;
  rowCount: number;
  distributionType: string;
  includeNulls: boolean;
  nullPercentage: number;
  outputFormat: 'json' | 'csv';
  customSchema?: string;
  aiPrompt: string;
  fields: DataField[];
  uploadedData?: any[];
  onProgress?: (progress: number) => void;
}

// Default schemas for different data types
export const defaultSchemas: Record<string, DataField[]> = {
  user: [
    { name: "id", type: "id", included: true },
    { name: "name", type: "name", included: true },
    { name: "email", type: "email", included: true },
    { name: "age", type: "integer", included: true },
    { name: "address", type: "address", included: true },
    { name: "phone", type: "phone", included: true },
    { name: "created_at", type: "date", included: true },
  ],
  transaction: [
    { name: "id", type: "id", included: true },
    { name: "user_id", type: "id", included: true },
    { name: "amount", type: "float", included: true },
    { name: "currency", type: "string", included: true },
    { name: "status", type: "string", included: true },
    { name: "transaction_date", type: "date", included: true },
    { name: "payment_method", type: "string", included: true },
  ],
  product: [
    { name: "id", type: "id", included: true },
    { name: "name", type: "string", included: true },
    { name: "description", type: "string", included: true },
    { name: "price", type: "float", included: true },
    { name: "category", type: "string", included: true },
    { name: "stock", type: "integer", included: true },
    { name: "created_at", type: "date", included: true },
  ],
  health: [
    { name: "patient_id", type: "id", included: true },
    { name: "age", type: "integer", included: true },
    { name: "gender", type: "string", included: true },
    { name: "blood_pressure", type: "string", included: true },
    { name: "heart_rate", type: "integer", included: true },
    { name: "temperature", type: "float", included: true },
    { name: "diagnosis", type: "string", included: true },
    { name: "visit_date", type: "date", included: true },
  ],
  custom: []
};

// This function will generate synthetic data using AI
export const generateSyntheticData = async (options: SyntheticDataOptions, apiKey: string | null) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required to generate synthetic data');
  }

  // Prepare the schema from fields
  const schema: Record<string, string> = {};
  options.fields
    .filter(field => field.included && field.name)
    .forEach(field => {
      schema[field.name] = field.type;
    });

  // Validate schema format
  validateSchema(schema);

  // Convert schema for OpenAI processing
  const preparedSchema = prepareSchemaForAI(schema);

  // Report progress
  options.onProgress?.(10);

  // Prepare the prompt for OpenAI
  const systemPrompt = `You are a data generation assistant. Generate synthetic data based on the provided schema. 
  Each field should follow its type constraints, and any additional information or rules should be respected.
  Return ONLY a valid JSON array with ${options.rowCount} items, matching the schema format below:`;

  const schemaDescription = JSON.stringify(preparedSchema, null, 2);
  
  const additionalOptions = {
    includeNulls: options.includeNulls,
    nullPercentage: options.nullPercentage,
  };

  let sampleData = '';
  if (options.uploadedData && options.uploadedData.length > 0) {
    sampleData = `\nSample data for reference:\n${JSON.stringify(options.uploadedData, null, 2)}`;
  }

  const userPrompt = `${options.aiPrompt}\n\nSchema:\n${schemaDescription}
  
  Additional options: ${JSON.stringify(additionalOptions, null, 2)}
  ${sampleData}
  
  Generate ${options.rowCount} sample records in ${options.outputFormat === 'json' ? 'JSON array' : 'CSV'} format.
  Ensure all data follows realistic patterns and distributions.
  Do not include any explanations in your response, only return the ${options.outputFormat === 'json' ? 'JSON array' : 'CSV data'}.`;

  options.onProgress?.(30);

  // Call OpenAI via Supabase Edge Function
  try {
    const { processWithOpenAI } = useSupabase();
    
    options.onProgress?.(50);
    
    const response = await processWithOpenAI('chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    options.onProgress?.(80);

    // Process and return the generated data
    if (response.choices && response.choices.length > 0) {
      const generatedContent = response.choices[0].message.content;
      try {
        if (options.outputFormat === 'json') {
          // Extract the JSON array from the response
          const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            options.onProgress?.(100);
            // Check if it's valid JSON
            const parsedData = JSON.parse(jsonMatch[0]);
            return JSON.stringify(parsedData, null, 2);
          } else {
            throw new Error('Unable to parse JSON response from AI');
          }
        } else {
          // For CSV, just return the content
          options.onProgress?.(100);
          return generatedContent;
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
export const saveGeneratedDataToDatabase = async (data: string): Promise<string> => {
  try {
    let parsedData;
    let name = `Synthetic Dataset ${new Date().toLocaleString()}`;
    
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // If not JSON, treat as CSV
      const lines = data.split('\n');
      const headers = lines[0].split(',');
      
      parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        
        parsedData.push(row);
      }
    }
    
    // Get schema from first row
    const schema: Record<string, string> = {};
    if (parsedData.length > 0) {
      const firstRow = parsedData[0];
      Object.keys(firstRow).forEach(key => {
        const value = firstRow[key];
        if (typeof value === 'number') {
          schema[key] = Number.isInteger(value) ? 'integer' : 'float';
        } else if (typeof value === 'boolean') {
          schema[key] = 'boolean';
        } else if (typeof value === 'string') {
          if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            schema[key] = 'date';
          } else if (value.includes('@')) {
            schema[key] = 'email';
          } else {
            schema[key] = 'string';
          }
        } else {
          schema[key] = 'string';
        }
      });
    }
    
    // Call Supabase to save the dataset
    const { useSupabase } = require('@/hooks/useSupabase');
    const { supabase } = useSupabase();
    
    const { data: dataset, error } = await supabase
      .from('datasets')
      .insert({
        name,
        schema,
        data: parsedData.slice(0, 100) // Store at most 100 rows
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return dataset.id;
  } catch (error) {
    console.error('Error saving dataset to database:', error);
    throw error;
  }
};

// Function to download the generated data
export const downloadSyntheticData = (data: string, format: 'json' | 'csv'): void => {
  const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `synthetic_data.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Detect schema from uploaded data
export const detectSchemaFromData = (data: any[]): DataField[] => {
  if (!data || data.length === 0) return [];
  
  const fields: DataField[] = [];
  const firstRow = data[0];
  
  Object.keys(firstRow).forEach(key => {
    const value = firstRow[key];
    let type = 'string';
    
    if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'float';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'string') {
      // Try to detect common patterns
      if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        type = 'date';
      } else if (value.includes('@')) {
        type = 'email';
      } else if (key.toLowerCase().includes('phone')) {
        type = 'phone';
      } else if (key.toLowerCase().includes('address')) {
        type = 'address';
      } else if (key.toLowerCase().includes('name')) {
        type = 'name';
      } else if (key.toLowerCase().includes('id')) {
        type = 'id';
      }
    }
    
    fields.push({
      name: key,
      type,
      included: true
    });
  });
  
  return fields;
};
