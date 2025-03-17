
import { parse } from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import * as openAiService from '@/services/openAiService';
import { SchemaFieldType, DataTypeResult } from './fileTypes';

// Function to read file content as text
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
};

// Function to parse CSV content
export const parseCSV = (csvString: string, options: any = {}): any[] => {
  const result = parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    ...options
  });
  
  return result.data as any[];
};

// Function to parse JSON content
export const parseJSON = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    throw error;
  }
};

// Function to generate a preview URL for an image file
export const generateImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const previewUrl = event.target?.result as string;
      resolve(previewUrl);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
};

// Function to detect the data type of a file
export const detectDataType = async (file: File, apiKey: string): Promise<DataTypeResult> => {
  try {
    const content = await readFileContent(file);
    let parsedData: any;
    
    if (file.name.endsWith('.csv')) {
      parsedData = parseCSV(content);
    } else if (file.name.endsWith('.json')) {
      parsedData = parseJSON(content);
    } else {
      return { type: 'unknown', confidence: 0.5 };
    }
    
    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }
    
    if (parsedData.length === 0) {
      return { type: 'unknown', confidence: 0.5 };
    }
    
    const sampleData = parsedData.slice(0, 5);
    
    // Call OpenAI API to analyze data characteristics
    const response = await openAiService.callOpenAI(
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Analyze data characteristics to determine data type.'
          },
          {
            role: 'user',
            content: `Analyze this sample data and determine if it's time series, categorical, or tabular data: ${JSON.stringify(sampleData)}`
          }
        ]
      },
      apiKey
    );
    
    const analysis = response.choices[0].message.content;
    
    if (analysis.toLowerCase().includes('time series')) {
      const timeColumn = detectTimeColumn(sampleData);
      const valueColumns = detectValueColumns(sampleData);
      
      return {
        type: 'timeseries',
        confidence: 0.8,
        timeColumn,
        valueColumns
      };
    } else if (analysis.toLowerCase().includes('categorical')) {
      const categoricalColumns = detectCategoricalColumns(sampleData);
      
      return {
        type: 'categorical',
        confidence: 0.7,
        categoricalColumns
      };
    } else {
      return {
        type: 'tabular',
        confidence: 0.6
      };
    }
  } catch (error) {
    console.error("Error detecting data type:", error);
    return { type: 'unknown', confidence: 0.3 };
  }
};

// Function to detect time column
export const detectTimeColumn = (data: any[]): string | undefined => {
  if (!data || data.length === 0) return undefined;
  
  const sample = data[0];
  
  for (const key in sample) {
    if (typeof sample[key] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample[key])) {
      return key;
    }
  }
  
  return undefined;
};

// Function to detect value columns
export const detectValueColumns = (data: any[]): string[] => {
  if (!data || data.length === 0) return [];
  
  const sample = data[0];
  const valueColumns: string[] = [];
  
  for (const key in sample) {
    if (typeof sample[key] === 'number') {
      valueColumns.push(key);
    }
  }
  
  return valueColumns;
};

// Function to detect categorical columns
export const detectCategoricalColumns = (data: any[]): string[] => {
  if (!data || data.length === 0) return [];
  
  const sample = data[0];
  const categoricalColumns: string[] = [];
  
  for (const key in sample) {
    if (typeof sample[key] === 'string') {
      categoricalColumns.push(key);
    }
  }
  
  return categoricalColumns;
};

// Function to validate data against a schema
export const validateSchema = (data: any[], schema: Record<string, SchemaFieldType>): string[] => {
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    Object.keys(schema).forEach(key => {
      if (!(key in item)) {
        errors.push(`Row ${index + 1}: Missing field "${key}"`);
      } else {
        const expectedType = schema[key];
        const actualType = typeof item[key];
        
        if (expectedType === 'number' && actualType !== 'number') {
          errors.push(`Row ${index + 1}: Field "${key}" expected number, got ${actualType}`);
        }
        // Add more type validations as needed
      }
    });
  });
  
  return errors;
};

// Function to mask PII data
export const maskPiiData = (data: any[], fieldsToMask: string[]): any[] => {
  return data.map(item => {
    const maskedItem = { ...item };
    fieldsToMask.forEach(field => {
      if (field in maskedItem) {
        maskedItem[field] = 'MASKED'; // Replace with a more sophisticated masking technique
      }
    });
    return maskedItem;
  });
};

// Function to generate synthetic data
export const generateSyntheticData = (schema: Record<string, SchemaFieldType>, count: number): any[] => {
  const syntheticData: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const item: any = {};
    Object.keys(schema).forEach(key => {
      const type = schema[key];
      
      switch (type) {
        case 'string':
          item[key] = uuidv4();
          break;
        case 'number':
          item[key] = Math.random() * 100;
          break;
        case 'boolean':
          item[key] = Math.random() < 0.5;
          break;
        default:
          // Handle other types
          item[key] = `Value for ${key}`;
      }
    });
    syntheticData.push(item);
  }
  
  return syntheticData;
};

export { formatData, downloadData, getFileType } from './fileTypes';
