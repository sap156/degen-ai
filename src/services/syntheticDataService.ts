import { OpenAiMessage, createMessages, getCompletion } from './openAiService';

// Update the SyntheticDataOptions interface to include count
export interface SyntheticDataOptions {
  count: number;
  diversity: 'low' | 'medium' | 'high';
  preserveRelationships: boolean;
  targetClass?: string;
  apiKey: string;
  // Add any other options needed
}

// Fix the method signature for the problematic function
export const generateSyntheticData = async (
  data: any[],
  options: SyntheticDataOptions
): Promise<any[]> => {
  if (!data || data.length === 0 || !options.apiKey) {
    console.error('Invalid data or missing API key for synthetic data generation');
    return [];
  }

  try {
    // Sample the data to avoid token limits
    const sampleSize = Math.min(5, data.length);
    const samples = data.slice(0, sampleSize);
    
    // Determine the diversity level
    const temperature = options.diversity === 'low' ? 0.3 : 
                        options.diversity === 'medium' ? 0.7 : 0.9;
    
    // Create a system message
    const systemPrompt = `You are an AI specialized in generating synthetic data that matches the patterns and distributions of real data.
    Your task is to create realistic synthetic records that preserve the statistical properties and relationships of the original data.`;
    
    // Create a user message with instructions
    const userPrompt = `Generate ${options.count} synthetic records that look similar to these samples but with different values.
    The synthetic data should maintain the same schema and data types as the original data.
    
    Diversity level: ${options.diversity} (${temperature})
    ${options.preserveRelationships ? 'Preserve relationships between fields.' : 'Fields can be more independent.'}
    ${options.targetClass ? `Target class: ${options.targetClass}` : ''}
    
    Sample records:
    ${JSON.stringify(samples, null, 2)}
    
    Return ONLY a valid JSON array with the generated records. No explanations or additional text.`;
    
    const messages = createMessages(systemPrompt, userPrompt);
    
    // Call the API
    const response = await getCompletion(messages, 'gpt-4o-mini', options.apiKey);
    
    // Try to extract JSON
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/);
                      
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    try {
      const generatedData = JSON.parse(jsonStr);
      return Array.isArray(generatedData) ? generatedData : [];
    } catch (error) {
      console.error('Failed to parse generated data:', error);
      return [];
    }
  } catch (error) {
    console.error('Error generating synthetic data:', error);
    return [];
  }
};

// Fix the problematic function that has incorrect arguments
export const transformGeneratedData = (originalData: any[], generatedData: any[]): any[] => {
  if (!originalData.length || !generatedData.length) {
    return generatedData;
  }
  
  // Get schema from original data
  const schema = inferSchema(originalData);
  
  // Transform generated data to match schema
  return generatedData.map(item => {
    const transformedItem: Record<string, any> = {};
    
    // Process each field according to its inferred type
    for (const [field, type] of Object.entries(schema)) {
      if (!(field in item)) {
        // Field missing in generated data, use a default or sample from original
        transformedItem[field] = getSampleValue(originalData, field);
        continue;
      }
      
      const value = item[field];
      
      switch (type) {
        case 'number':
          transformedItem[field] = typeof value === 'number' ? value : 
                                  typeof value === 'string' ? parseFloat(value) : 0;
          break;
        case 'integer':
          transformedItem[field] = typeof value === 'number' ? Math.round(value) : 
                                  typeof value === 'string' ? parseInt(value, 10) : 0;
          break;
        case 'boolean':
          transformedItem[field] = Boolean(value);
          break;
        case 'date':
          transformedItem[field] = value instanceof Date ? value.toISOString() : 
                                  typeof value === 'string' ? value : new Date().toISOString();
          break;
        case 'string':
        default:
          transformedItem[field] = String(value);
      }
    }
    
    return transformedItem;
  });
};

// Helper function to infer schema from data
const inferSchema = (data: any[]): Record<string, string> => {
  if (!data.length) return {};
  
  const schema: Record<string, string> = {};
  const sample = data[0];
  
  for (const [key, value] of Object.entries(sample)) {
    if (typeof value === 'number') {
      schema[key] = Number.isInteger(value) ? 'integer' : 'number';
    } else if (typeof value === 'boolean') {
      schema[key] = 'boolean';
    } else if (value instanceof Date) {
      schema[key] = 'date';
    } else if (typeof value === 'string') {
      // Check if string is a date
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value))) {
        schema[key] = 'date';
      } else {
        schema[key] = 'string';
      }
    } else if (value === null || value === undefined) {
      // Try to infer from other records
      schema[key] = inferTypeFromOtherRecords(data, key);
    } else {
      schema[key] = 'string'; // Default
    }
  }
  
  return schema;
};

// Helper to infer type from other records when first record has null
const inferTypeFromOtherRecords = (data: any[], field: string): string => {
  for (let i = 1; i < data.length; i++) {
    const value = data[i][field];
    if (value !== null && value !== undefined) {
      if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'number';
      } else if (typeof value === 'boolean') {
        return 'boolean';
      } else if (value instanceof Date) {
        return 'date';
      } else if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value))) {
          return 'date';
        }
        return 'string';
      }
    }
  }
  return 'string'; // Default
};

// Helper to get a sample value for a field
const getSampleValue = (data: any[], field: string): any => {
  // Find a non-null value
  for (const item of data) {
    if (item[field] !== null && item[field] !== undefined) {
      return item[field];
    }
  }
  return null;
};

// Generate synthetic data with specific characteristics
export const generateSyntheticDataWithCharacteristics = async (
  data: any[],
  characteristics: {
    outliers?: boolean;
    missingValues?: boolean;
    duplicates?: boolean;
    noise?: number;
  },
  options: SyntheticDataOptions
): Promise<any[]> => {
  // First generate base synthetic data
  const syntheticData = await generateSyntheticData(data, options);
  
  if (!syntheticData.length) {
    return [];
  }
  
  let result = [...syntheticData];
  
  // Apply characteristics
  if (characteristics.outliers) {
    result = addOutliers(result, 0.05); // Add outliers to 5% of records
  }
  
  if (characteristics.missingValues) {
    result = addMissingValues(result, 0.1); // Add missing values to 10% of fields
  }
  
  if (characteristics.duplicates) {
    result = addDuplicates(result, 0.03); // Add 3% duplicates
  }
  
  if (characteristics.noise && characteristics.noise > 0) {
    result = addNoise(result, characteristics.noise);
  }
  
  return result;
};

// Helper to add outliers
const addOutliers = (data: any[], percentage: number): any[] => {
  if (!data.length) return data;
  
  const result = [...data];
  const numericFields: string[] = [];
  
  // Find numeric fields
  Object.entries(data[0]).forEach(([key, value]) => {
    if (typeof value === 'number') {
      numericFields.push(key);
    }
  });
  
  if (!numericFields.length) return data;
  
  // Calculate number of records to modify
  const recordsToModify = Math.max(1, Math.round(data.length * percentage));
  
  // Randomly select records to modify
  const indices = Array.from({ length: data.length }, (_, i) => i);
  shuffleArray(indices);
  const selectedIndices = indices.slice(0, recordsToModify);
  
  // Add outliers
  selectedIndices.forEach(index => {
    const field = numericFields[Math.floor(Math.random() * numericFields.length)];
    const originalValue = result[index][field];
    
    // Create an outlier (multiply by 5-10x or divide by 5-10x)
    const multiplier = Math.random() > 0.5 ? 
      5 + Math.random() * 5 : // 5-10x
      1 / (5 + Math.random() * 5); // 1/5 - 1/10
    
    result[index][field] = originalValue * multiplier;
  });
  
  return result;
};

// Helper to add missing values
const addMissingValues = (data: any[], percentage: number): any[] => {
  if (!data.length) return data;
  
  const result = data.map(item => ({ ...item }));
  const fields = Object.keys(data[0]);
  
  // For each record
  result.forEach(record => {
    // Randomly select fields to nullify
    const fieldsToNullify = Math.max(1, Math.round(fields.length * percentage));
    const selectedFields = shuffleArray([...fields]).slice(0, fieldsToNullify);
    
    // Set fields to null
    selectedFields.forEach(field => {
      record[field] = null;
    });
  });
  
  return result;
};

// Helper to add duplicates
const addDuplicates = (data: any[], percentage: number): any[] => {
  if (!data.length) return data;
  
  const result = [...data];
  const recordsToDuplicate = Math.max(1, Math.round(data.length * percentage));
  
  // Randomly select records to duplicate
  const indices = Array.from({ length: data.length }, (_, i) => i);
  shuffleArray(indices);
  const selectedIndices = indices.slice(0, recordsToDuplicate);
  
  // Add duplicates
  selectedIndices.forEach(index => {
    result.push({ ...data[index] });
  });
  
  return result;
};

// Helper to add noise to numeric fields
const addNoise = (data: any[], noiseLevel: number): any[] => {
  if (!data.length) return data;
  
  const result = data.map(item => ({ ...item }));
  const numericFields: string[] = [];
  
  // Find numeric fields
  Object.entries(data[0]).forEach(([key, value]) => {
    if (typeof value === 'number') {
      numericFields.push(key);
    }
  });
  
  if (!numericFields.length) return data;
  
  // Add noise to each record
  result.forEach(record => {
    numericFields.forEach(field => {
      if (typeof record[field] === 'number') {
        const originalValue = record[field];
        const noise = (Math.random() * 2 - 1) * noiseLevel * Math.abs(originalValue || 1);
        record[field] = originalValue + noise;
      }
    });
  });
  
  return result;
};

// Helper to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
