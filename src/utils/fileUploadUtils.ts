/**
 * Utilities for handling file uploads across different data types
 */
// Re-export types from fileTypes
export * from './fileTypes';

// Re-export basic file operations
export * from './fileOperations';

// Re-export data parsing functions
export * from './dataParsing';

<<<<<<< HEAD
// Re-export text extraction utilities
export * from './textExtraction';

// Re-export schema detection utilities
export * from './schemaDetection';
=======
/**
 * Read a file and return its contents as a string
 * @param file The file to read
 * @returns Promise resolving to the file content
 */
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Detect data type from content to help understand the structure
 * @param data The parsed data
 * @returns Object containing detected data properties
 */
export const detectDataType = (data: any[]): { 
  isTimeSeries: boolean; 
  dateField?: string;
  valueFields: string[];
  dataType: 'time-series' | 'tabular' | 'pii' | 'unknown';
} => {
  if (!data || !data.length) {
    return { 
      isTimeSeries: false, 
      valueFields: [], 
      dataType: 'unknown' 
    };
  }
  
  const sampleItem = data[0];
  const fields = Object.keys(sampleItem);
  
  // Look for date/time fields
  const possibleDateFields = fields.filter(field => {
    const value = sampleItem[field];
    
    if (typeof value !== 'string') return false;
    
    return /^\d{4}-\d{2}-\d{2}/.test(value) || // ISO date format
      /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || // MM/DD/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}/.test(value) || // MM-DD-YYYY
      !isNaN(Date.parse(value)) || // Parsable as date
      field.toLowerCase().includes('time') ||
      field.toLowerCase().includes('date') ||
      field.toLowerCase() === 'timestamp';
  });
  
  // Look for numeric fields
  const numericFields = fields.filter(field => {
    const value = sampleItem[field];
    return typeof value === 'number';
  });
  
  // Check for PII data
  const piiFields = ['name', 'email', 'address', 'phone', 'ssn', 'dob', 'birthdate', 'social', 'credit'];
  const potentialPiiFields = fields.filter(field => 
    piiFields.some(pii => field.toLowerCase().includes(pii))
  );
  
  // Determine data type
  const isTimeSeries = possibleDateFields.length > 0 && numericFields.length > 0;
  const isPiiData = potentialPiiFields.length >= 3; // Heuristic: 3+ PII fields suggests PII data
  
  let dataType: 'time-series' | 'tabular' | 'pii' | 'unknown' = 'unknown';
  
  if (isTimeSeries) {
    dataType = 'time-series';
  } else if (isPiiData) {
    dataType = 'pii';
  } else {
    dataType = 'tabular';
  }
  
  return {
    isTimeSeries,
    dateField: possibleDateFields.length > 0 ? possibleDateFields[0] : undefined,
    valueFields: numericFields,
    dataType
  };
};

/**
 * Generate a schema for the data to understand its structure
 * @param data The parsed data
 * @returns Schema object describing the data structure
 */
export const generateSchema = (data: any[]): Record<string, SchemaFieldType> => {
  if (!data || !data.length) return {};
  
  const schema: Record<string, SchemaFieldType> = {};
  const sampleItem = data[0];
  
  Object.keys(sampleItem).forEach(key => {
    const value = sampleItem[key];
    let type = typeof value as SchemaFieldType;
    
    // Enhanced type detection
    if (type === 'string') {
      // Check for date format
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || // ISO date format
          /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || // MM/DD/YYYY
          /^\d{1,2}-\d{1,2}-\d{4}/.test(value) || // MM-DD-YYYY
          !isNaN(Date.parse(value))) { // Parsable as date
        type = 'date';
      }
      // Check for time series
      else if (key.toLowerCase().includes('time') || 
              key.toLowerCase().includes('date') ||
              key.toLowerCase() === 'timestamp') {
        type = 'date';
      }
      // Check for email
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        type = 'email';
      }
      // Check for phone
      else if (/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value)) {
        type = 'phone';
      }
    } else if (type === 'number') {
      // Check if it's an integer or float
      type = Number.isInteger(value) ? 'integer' : 'float';
    }
    
    schema[key] = type;
  });
  
  return schema;
};

/**
 * Format data as a downloadable file
 * @param data The data to format
 * @param format The output format
 * @returns Formatted data string
 */
export const formatData = (data: any[], format: 'csv' | 'json' | 'text'): string => {
  if (!data.length) return '';
  
  switch (format) {
    case 'csv':
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      return [headers, ...rows].join('\n');
      
    case 'json':
      return JSON.stringify(data, null, 2);
      
    case 'text':
      return data.map(item => Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')).join('\n');
      
    default:
      return JSON.stringify(data, null, 2);
  }
};

/**
 * Download data as a file
 * @param data The data content as string
 * @param fileName The name for the downloaded file
 * @param format The file format
 */
export const downloadData = (data: string, fileName: string, format: 'csv' | 'json' | 'text'): void => {
  const mimeTypes = {
    csv: 'text/csv',
    json: 'application/json',
    text: 'text/plain'
  };
  
  const blob = new Blob([data], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
>>>>>>> a951b28 (Fix: Resolve TypeScript type errors)
