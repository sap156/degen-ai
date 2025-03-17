
/**
 * Utilities for handling file uploads across different data types
 */
// Re-export types from fileTypes
export * from './fileTypes';

// Re-export basic file operations
export * from './fileOperations';

// Re-export data parsing functions
export * from './dataParsing';

// Re-export text extraction utilities
export * from './textExtraction';

// Re-export schema detection utilities
export * from './schemaDetection';

/**
 * Result type for data type detection
 */
export interface DataTypeResult {
  dataType: 'timeseries' | 'categorical' | 'tabular' | 'unknown';
}

/**
 * Detects the type of data in a file
 * @param data The parsed data from a file
 * @returns The detected data type result
 */
export const detectDataType = (data: any[]): DataTypeResult => {
  if (!data || data.length === 0) {
    return { dataType: 'unknown' };
  }
  
  const sampleRecord = data[0];
  const keys = Object.keys(sampleRecord);
  
  // Check for time series data (has date/time fields)
  const dateFields = keys.filter(key => {
    const value = sampleRecord[key];
    if (typeof value !== 'string') return false;
    
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) || 
           /^\d{4}-\d{2}-\d{2}/.test(value) ||
           /timestamp|date|time/i.test(key);
  });
  
  if (dateFields.length > 0) {
    return { dataType: 'timeseries' };
  }
  
  // Check for categorical data (mostly string values)
  let stringCount = 0;
  let numericCount = 0;
  
  keys.forEach(key => {
    const value = sampleRecord[key];
    if (typeof value === 'string' && !/^\d+$/.test(value)) {
      stringCount++;
    } else if (typeof value === 'number' || /^\d+$/.test(value)) {
      numericCount++;
    }
  });
  
  if (stringCount > numericCount) {
    return { dataType: 'categorical' };
  }
  
  // Default to tabular
  return { dataType: 'tabular' };
};

/**
 * Generates a schema from sample data
 * This is a re-export from schemaDetection for convenience
 */
export const generateSchema = (data: any[]): Record<string, string> => {
  // Import from the actual implementation to maintain DRY principle
  const { generateSchema: importedGenerateSchema } = require('./schemaDetection');
  return importedGenerateSchema(data);
};
