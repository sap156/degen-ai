
/**
 * Utilities for handling file uploads across different data types
 */
import { OpenAiMessage } from '../services/openAiService';

/**
 * Custom schema field type that extends JavaScript's typeof types
 */
export type SchemaFieldType = 
  | 'string' 
  | 'number' 
  | 'bigint' 
  | 'boolean' 
  | 'symbol' 
  | 'undefined' 
  | 'object' 
  | 'function'
  | 'date'
  | 'integer'
  | 'float'
  | 'email'
  | 'phone'
  | 'address'
  | 'name'
  | 'ssn'
  | 'creditcard';

/**
 * Supported file types for uploading
 */
export type SupportedFileType = 
  | 'csv' 
  | 'json' 
  | 'txt' 
  | 'pdf' 
  | 'docx' 
  | 'xlsx' 
  | 'pptx';

/**
 * Check if a file type is supported
 */
export const isSupportedFileType = (file: File): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return [
    'csv', 'json', 'txt', 
    'pdf', 'doc', 'docx', 
    'xls', 'xlsx', 
    'ppt', 'pptx'
  ].includes(extension);
};

/**
 * Get the file type from a file object
 */
export const getFileType = (file: File): SupportedFileType => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  if (['csv'].includes(extension)) return 'csv';
  if (['json'].includes(extension)) return 'json';
  if (['txt', 'text', 'md'].includes(extension)) return 'txt';
  if (['pdf'].includes(extension)) return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'docx';
  if (['xls', 'xlsx'].includes(extension)) return 'xlsx';
  if (['ppt', 'pptx'].includes(extension)) return 'pptx';
  
  // Default to txt for unknown types
  return 'txt';
};

/**
 * Parse a CSV file into an array of objects
 * @param content The CSV content as string
 * @param hasHeader Whether the CSV has a header row
 * @returns Parsed CSV data as array of objects
 */
export const parseCSV = (content: string, hasHeader: boolean = true): any[] => {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }
  
  // Parse header if present
  const headers = hasHeader 
    ? lines[0].split(',').map(h => h.trim())
    : lines[0].split(',').map((_, i) => `column${i}`);
  
  // Parse data rows
  const data = [];
  const startIdx = hasHeader ? 1 : 0;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, any> = {};
    
    // Match values to headers
    headers.forEach((header, idx) => {
      if (idx < values.length) {
        // Try to convert numeric values
        const value = values[idx];
        if (!isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
        } else if (value.toLowerCase() === 'true') {
          row[header] = true;
        } else if (value.toLowerCase() === 'false') {
          row[header] = false;
        } else {
          row[header] = value;
        }
      } else {
        row[header] = null; // Handle missing values
      }
    });
    
    data.push(row);
  }
  
  return data;
};

/**
 * Parse a JSON file into an object or array
 * @param content The JSON content as string
 * @returns Parsed JSON data
 */
export const parseJSON = (content: string): any => {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

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
 * Read a file as ArrayBuffer
 * @param file The file to read
 * @returns Promise resolving to the file content as ArrayBuffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as ArrayBuffer);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Format data as a downloadable file
 * @param data The data to format
 * @param format The output format
 * @returns Formatted data string
 */
export const formatData = (data: any[], format: 'csv' | 'json' | 'text'): string => {
  if (!data || !data.length) return '';
  
  switch (format) {
    case 'csv':
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => {
          if (value === null || value === undefined) return '';
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
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

/**
 * Extract text content from a file using appropriate method based on file type
 * @param file The file to process
 * @param apiKey OpenAI API key for processing complex file types
 * @returns Promise resolving to the extracted text content
 */
export const extractTextFromFile = async (
  file: File, 
  apiKey: string | null
): Promise<{ text: string; metadata: Record<string, any> }> => {
  const fileType = getFileType(file);
  const fileName = file.name;
  const fileSize = file.size;
  const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
  
  // Basic metadata that's available for all files
  const metadata: Record<string, any> = {
    fileName,
    fileType,
    fileSize: `${fileSizeInMB} MB`,
    dateProcessed: new Date().toISOString()
  };
  
  try {
    switch (fileType) {
      case 'csv':
      case 'json':
      case 'txt':
        // For text-based formats, just read the content directly
        const content = await readFileContent(file);
        return { text: content, metadata };
        
      case 'pdf':
      case 'docx':
      case 'xlsx':
      case 'pptx':
        // For complex file types, use AI to extract text
        if (!apiKey) {
          throw new Error("API key is required to process this file type");
        }
        
        return await extractTextWithAI(file, apiKey, metadata);
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
};

/**
 * Extract text from complex file types using AI
 */
const extractTextWithAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<{ text: string; metadata: Record<string, any> }> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    
    // For PDF, DOCX, etc. - simulate extraction
    const messages: OpenAiMessage[] = [
      { 
        role: 'system' as const, 
        content: 'You are a document text extraction assistant. Extract text content from the document I describe.'
      },
      { 
        role: 'user' as const, 
        content: `This is a ${file.type || 'document'} file named "${file.name}". In a real implementation, I would extract the contents. For this simulation, please generate some plausible text content that might be found in such a document.`
      }
    ];
    
    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini'
    });
    
    return {
      text: response,
      metadata: {
        ...baseMetadata,
        processingMethod: 'Simulated extraction',
        note: 'In a production environment, specialized libraries would be used for each file type'
      }
    };
    
  } catch (error) {
    console.error('Error extracting text with AI:', error);
    throw error;
  }
};

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
