
/**
 * Utilities for schema detection and data type analysis
 */
import { SchemaFieldType } from './fileTypes';

/**
 * Detect data type and properties of a dataset
 * @param data Array of data objects to analyze
 * @returns Data type analysis
 */
export const detectDataType = (data: any[]): { 
  dataType: 'tabular' | 'timeseries' | 'categorical' | 'text' | 'mixed'; 
  properties: Record<string, any>;
} => {
  if (!data || data.length === 0) {
    return { dataType: 'mixed', properties: {} };
  }

  const sample = data[0];
  const keys = Object.keys(sample);
  
  // Check for timestamp fields which indicate time series data
  const timeKeys = keys.filter(key => {
    const value = sample[key];
    return (
      key.toLowerCase().includes('time') || 
      key.toLowerCase().includes('date') || 
      (typeof value === 'string' && !isNaN(Date.parse(value)))
    );
  });
  
  const numericKeys = keys.filter(key => typeof sample[key] === 'number');
  const stringKeys = keys.filter(key => typeof sample[key] === 'string');
  const booleanKeys = keys.filter(key => typeof sample[key] === 'boolean');
  
  // Count types of each column across all rows for better accuracy
  const columnTypes: Record<string, Set<string>> = {};
  
  keys.forEach(key => {
    columnTypes[key] = new Set();
  });
  
  data.forEach(row => {
    keys.forEach(key => {
      if (key in row) {
        columnTypes[key].add(typeof row[key]);
      }
    });
  });
  
  // Determine data type based on column composition
  if (timeKeys.length > 0 && numericKeys.length > 0) {
    return { 
      dataType: 'timeseries', 
      properties: { 
        timeFields: timeKeys,
        valueFields: numericKeys.filter(k => !timeKeys.includes(k))
      }
    };
  } 
  
  if (numericKeys.length > stringKeys.length) {
    return { 
      dataType: 'tabular', 
      properties: { 
        numericColumns: numericKeys.length,
        categoricalColumns: stringKeys.length,
        booleanColumns: booleanKeys.length
      }
    };
  }
  
  if (stringKeys.length > 0 && keys.length <= 3) {
    return { 
      dataType: 'categorical', 
      properties: { 
        categories: [...new Set(data.map(item => stringKeys.map(k => item[k]).join(' ')))].length
      }
    };
  }
  
  // Check if it's predominantly text data
  const longTextFields = stringKeys.filter(key => {
    // Sample a few rows to check for long text
    return data.slice(0, Math.min(5, data.length)).some(row => {
      const val = row[key];
      return typeof val === 'string' && val.length > 100;
    });
  });
  
  if (longTextFields.length > 0) {
    return { 
      dataType: 'text', 
      properties: { 
        textFields: longTextFields
      }
    };
  }
  
  return { 
    dataType: 'mixed', 
    properties: {
      numericColumns: numericKeys.length,
      stringColumns: stringKeys.length,
      booleanColumns: booleanKeys.length,
      timeFields: timeKeys
    }
  };
};

/**
 * Generate a schema from a dataset by analyzing field types
 * @param data Array of data objects to analyze
 * @returns Schema with field types
 */
export const generateSchema = (data: any[]): Record<string, SchemaFieldType> => {
  if (!data || data.length === 0) {
    return {};
  }
  
  const schema: Record<string, SchemaFieldType> = {};
  const sample = data[0];
  const keys = Object.keys(sample);
  
  // Helper function to determine if a string value is a date
  const isDateString = (value: string): boolean => {
    // Check common date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{4}|^\d{1,2}-\d{1,2}-\d{4}/;
    if (dateRegex.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  };
  
  // Helper function to guess if a string field is an email
  const isEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
  
  // Helper function to guess if a string field is a phone number
  const isPhone = (value: string): boolean => {
    return /^[\d\+\-\(\)\s]{7,20}$/.test(value);
  };
  
  // Helper function to guess if a string field is an address
  const isAddress = (value: string): boolean => {
    // Simple heuristic: contains numbers and some address keywords
    return /\d+/.test(value) && 
      /street|road|avenue|lane|drive|boulevard|ave|rd|st|blvd|ln|dr/i.test(value);
  };
  
  // Helper function to guess if a string field is a name
  const isName = (value: string): boolean => {
    // Simple heuristic: all words start with capital letter, no numbers
    return /^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/.test(value) && !/\d/.test(value);
  };
  
  // Analyze each field across multiple rows for better accuracy
  keys.forEach(key => {
    // Get unique types for this field
    const types = new Set<string>();
    const values = [];
    
    // Sample up to 50 rows for type detection
    const sampleSize = Math.min(50, data.length);
    for (let i = 0; i < sampleSize; i++) {
      if (data[i] && data[i][key] !== undefined && data[i][key] !== null) {
        types.add(typeof data[i][key]);
        values.push(data[i][key]);
      }
    }
    
    // If we have multiple types, determine the dominant one
    if (types.size > 1) {
      const typeCounts: Record<string, number> = {};
      values.forEach(val => {
        const type = typeof val;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      // Find the most common type
      let dominantType = '';
      let maxCount = 0;
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantType = type;
        }
      });
      
      if (dominantType === 'string') {
        // For string fields, try to detect subtypes
        const stringValues = values.filter(v => typeof v === 'string') as string[];
        
        // Check if values are dates
        if (stringValues.some(v => isDateString(v))) {
          schema[key] = 'date';
        }
        // Check if values are emails
        else if (stringValues.some(v => isEmail(v))) {
          schema[key] = 'email';
        }
        // Check if values are phone numbers
        else if (stringValues.some(v => isPhone(v))) {
          schema[key] = 'phone';
        }
        // Check if values are addresses
        else if (stringValues.some(v => isAddress(v))) {
          schema[key] = 'address';
        }
        // Check if values are names
        else if (stringValues.some(v => isName(v))) {
          schema[key] = 'name';
        }
        else {
          schema[key] = 'string';
        }
      }
      else if (dominantType === 'number') {
        // Check if numbers are integers or floats
        const allIntegers = values
          .filter(v => typeof v === 'number')
          .every(v => Number.isInteger(v));
          
        schema[key] = allIntegers ? 'integer' : 'float';
      }
      else {
        schema[key] = dominantType as SchemaFieldType;
      }
    }
    // If we have only one type, it's simpler
    else if (types.size === 1) {
      const type = Array.from(types)[0];
      
      if (type === 'string') {
        // For string fields, check if key name or values hint at special types
        const stringValues = values as string[];
        const keyLower = key.toLowerCase();
        
        if (keyLower.includes('date') || keyLower.includes('time') || 
            stringValues.some(v => isDateString(v))) {
          schema[key] = 'date';
        }
        else if (keyLower.includes('email') || stringValues.some(v => isEmail(v))) {
          schema[key] = 'email';
        }
        else if (keyLower.includes('phone') || stringValues.some(v => isPhone(v))) {
          schema[key] = 'phone';
        }
        else if (keyLower.includes('address') || stringValues.some(v => isAddress(v))) {
          schema[key] = 'address';
        }
        else if ((keyLower.includes('name') || keyLower.includes('customer')) && 
                 stringValues.some(v => isName(v))) {
          schema[key] = 'name';
        }
        else {
          schema[key] = 'string';
        }
      }
      else if (type === 'number') {
        // Check if all numbers are integers
        const allIntegers = values.every(v => Number.isInteger(v));
        schema[key] = allIntegers ? 'integer' : 'float';
      }
      else if (type === 'boolean') {
        schema[key] = 'boolean';
      }
      else {
        schema[key] = type as SchemaFieldType;
      }
    }
    else {
      // No values found, default to string
      schema[key] = 'string';
    }
  });
  
  return schema;
};
