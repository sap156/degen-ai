
/**
 * Common type definitions for file handling utilities
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
 * Common interface for file processing results
 */
export interface FileProcessingResult {
  text: string;
  metadata: Record<string, any>;
}
