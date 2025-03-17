
// Define your schema field types
export type SchemaFieldType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'object' | 'array' | 'email' | 'number' | 'function' | 'bigint' | 'symbol' | 'undefined' | 'phone' | 'address' | 'name' | 'ssn' | 'creditcard';

// Define SupportedFileType type for fileOperations.ts
export type SupportedFileType = 'csv' | 'json' | 'txt' | 'xml' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'unknown';

// Define FileProcessingResult for textExtraction.ts
export interface FileProcessingResult {
  success: boolean;
  data?: any;
  text?: string;
  error?: string;
  format?: string;
  metadata?: Record<string, any>;
}

// Export other file-related types
export interface FileUploadResult {
  success: boolean;
  data?: any[];
  error?: string;
  filename?: string;
  fileType?: string;
  rowCount?: number;
}

export interface DataParsingOptions {
  dateFormat?: string;
  delimiter?: string;
  skipEmptyLines?: boolean;
  header?: boolean;
  dynamicTyping?: boolean;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

export interface ParsedFileInfo extends FileInfo {
  data: any[];
  rowCount: number;
  columnCount: number;
  columns: string[];
}

export interface FileWithPreview {
  file: File;
  preview: string;
}

// Add DataType property to DataTypeResult
export interface DataTypeResult {
  type: 'timeseries' | 'categorical' | 'tabular' | 'unknown';
  dataType?: string;
  confidence: number;
  timeColumn?: string;
  valueColumns?: string[];
  categoricalColumns?: string[];
}
