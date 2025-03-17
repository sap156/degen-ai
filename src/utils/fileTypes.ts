
// Basic file processing result interface
export interface FileProcessingResult {
  success: boolean;
  text?: string;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Schema field type definition
export type SchemaFieldType = 
  'string' | 
  'number' | 
  'boolean' | 
  'date' | 
  'integer' | 
  'float' | 
  'object' | 
  'array' |
  'email' |
  'phone' |
  'ssn' |
  'creditcard' |
  'name' |
  'address';

// Data field structure
export interface DataField {
  name: string;
  type: SchemaFieldType;
  description?: string;
  required?: boolean;
  format?: string;
  example?: any;
}

// For file upload formats
export type SupportedFileType = 'csv' | 'json' | 'txt' | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx';

export const getFileType = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return extension;
};

// Function to extract text from various file types
export const extractTextFromFile = async (file: File, apiKey: string): Promise<FileProcessingResult> => {
  try {
    if (file.type.includes('pdf')) {
      // For PDF files, we'll use a specialized extractor
      const { extractTextFromPdf } = await import('./textExtraction');
      return extractTextFromPdf(file);
    } else {
      // For other files, use basic text extraction
      const fileReader = new FileReader();
      
      const textContent = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsText(file);
      });
      
      return {
        success: true,
        text: textContent,
        metadata: {
          processingMethod: 'basic text extraction',
          note: 'Used basic text extraction for text-based file'
        }
      };
    }
  } catch (error: any) {
    console.error('Error extracting text from file:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract text from file.'
    };
  }
};

// Data type result for type detection
export interface DataTypeResult {
  type: 'timeseries' | 'categorical' | 'tabular' | 'unknown';
  dataType?: string;
  confidence: number;
  timeColumn?: string;
  valueColumns?: string[];
  categoricalColumns?: string[];
}

// Functions for data formatting and download
export const formatData = (data: any[], format: 'json' | 'csv' | 'txt' = 'json'): string => {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      // Simple CSV conversion
      if (!data.length) return '';
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : String(value)
        ).join(',')
      );
      return [headers, ...rows].join('\n');
    case 'txt':
      return JSON.stringify(data, null, 2);
    default:
      return JSON.stringify(data);
  }
};

export const downloadData = (content: string, filename: string, format: 'json' | 'csv' | 'txt' = 'json'): void => {
  const blob = new Blob([content], { type: `text/${format === 'json' ? 'json' : format}` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Schema generation from data
export const generateSchema = (data: any[]): Record<string, SchemaFieldType> => {
  if (!data.length) return {};
  
  const schema: Record<string, SchemaFieldType> = {};
  const sample = data[0];
  
  for (const key in sample) {
    const value = sample[key];
    const type = typeof value;
    
    if (type === 'string') {
      // Try to detect if it's a date
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value))) {
        schema[key] = 'date';
      } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        schema[key] = 'email';
      } else if (/^(\+\d{1,3})?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) {
        schema[key] = 'phone';
      } else if (/^\d{3}-\d{2}-\d{4}$/.test(value)) {
        schema[key] = 'ssn';
      } else if (/^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/.test(value)) {
        schema[key] = 'creditcard';
      } else {
        schema[key] = 'string';
      }
    } else if (type === 'number') {
      schema[key] = Number.isInteger(value) ? 'integer' : 'float';
    } else if (type === 'boolean') {
      schema[key] = 'boolean';
    } else if (type === 'object') {
      schema[key] = Array.isArray(value) ? 'array' : 'object';
    } else {
      schema[key] = 'string'; // Default fallback
    }
  }
  
  return schema;
};
