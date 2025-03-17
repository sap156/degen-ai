
import { 
  SchemaFieldType, 
  SupportedFileType, 
  FileProcessingResult,
  DataTypeResult
} from './fileTypes';

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
  if (['xml'].includes(extension)) return 'xml';
  
  // Default to unknown for unsupported types
  return 'unknown';
};

/**
 * Extract text content from a file using appropriate method based on file type
 */
export const extractTextFromFile = async (
  file: File, 
  apiKey: string | null
): Promise<FileProcessingResult> => {
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
        return { success: true, text: content, metadata };
        
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
): Promise<FileProcessingResult> => {
  try {
    const openAiService = await import('../services/openAiService');
    
    // For PDF, DOCX, etc. - simulate extraction
    const messages = [
      { 
        role: 'system' as const, 
        content: 'You are a document text extraction assistant. Extract text content from the document I describe.'
      },
      { 
        role: 'user' as const, 
        content: `This is a ${file.type || 'document'} file named "${file.name}". In a real implementation, I would extract the contents. For this simulation, please generate some plausible text content that might be found in such a document.`
      }
    ];
    
    const response = await openAiService.callOpenAI('completions', {
      model: 'gpt-4o-mini',
      messages
    }, apiKey);
    
    return {
      success: true,
      text: response.choices[0].message.content,
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
 * Read file content as a string
 */
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
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

// Function to generate a schema from data
export const generateSchema = (data: any[]): Record<string, SchemaFieldType> => {
  if (!data || data.length === 0) {
    return {};
  }
  
  const schema: Record<string, SchemaFieldType> = {};
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

// Function to detect data type
export const detectDataType = (data: any[]): DataTypeResult => {
  if (!data || data.length === 0) {
    return { type: 'unknown', confidence: 0 };
  }

  // Sample the data (use up to 100 records for detection)
  const sampleSize = Math.min(data.length, 100);
  const sample = data.slice(0, sampleSize);
  
  // Check for time series data
  let dateColumns = [];
  let numericColumns = [];
  
  // First, detect column types
  const firstRow = sample[0];
  for (const key in firstRow) {
    // Check if it's a date column
    if (typeof firstRow[key] === 'string') {
      // Check date format
      const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d{3}Z)?)?$/;
      if (datePattern.test(firstRow[key])) {
        dateColumns.push(key);
      }
    } 
    // Check if it's a numeric column
    else if (typeof firstRow[key] === 'number') {
      numericColumns.push(key);
    }
  }
  
  // Check for time series pattern (need date column and at least one numeric column)
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    // Check if dates are sequential
    if (dateColumns.length === 1) {
      const dateColumn = dateColumns[0];
      const dates = sample.map(item => new Date(item[dateColumn]).getTime());
      
      // Sort dates
      const sortedDates = [...dates].sort((a, b) => a - b);
      
      // Check if dates are somewhat sequential (80% of the time)
      let sequentialCount = 0;
      for (let i = 1; i < sortedDates.length; i++) {
        if (sortedDates[i] > sortedDates[i-1]) {
          sequentialCount++;
        }
      }
      
      const sequentialRatio = sequentialCount / (sortedDates.length - 1);
      
      if (sequentialRatio > 0.8) {
        return {
          type: 'timeseries',
          dataType: 'timeseries',
          confidence: 0.9,
          timeColumn: dateColumn,
          valueColumns: numericColumns
        };
      }
    }
  }
  
  // Check for categorical data
  const categoricalColumns = [];
  for (const key in firstRow) {
    if (typeof firstRow[key] === 'string' && key !== dateColumns[0]) {
      // Check if the column has a limited number of unique values
      const uniqueValues = new Set(sample.map(item => item[key]));
      if (uniqueValues.size < Math.min(sample.length * 0.3, 20)) {
        categoricalColumns.push(key);
      }
    }
  }
  
  if (categoricalColumns.length > 0 && categoricalColumns.length < Object.keys(firstRow).length * 0.7) {
    return {
      type: 'categorical',
      dataType: 'categorical',
      confidence: 0.8,
      categoricalColumns
    };
  }
  
  // Default to tabular data
  return {
    type: 'tabular',
    dataType: 'tabular',
    confidence: 0.7
  };
};
