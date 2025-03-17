
// Define your schema field types
export type SchemaFieldType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'object' | 'array' | 'email' | 'number' | 'function' | 'bigint' | 'symbol' | 'undefined' | 'phone' | 'address' | 'name' | 'ssn' | 'creditcard';

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
