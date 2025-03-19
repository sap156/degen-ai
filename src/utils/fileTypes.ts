
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
  | 'xml'
  | 'pdf' 
  | 'doc'  
  | 'docx' 
  | 'xls'
  | 'xlsx' 
  | 'ppt'
  | 'pptx';

/**
 * Common interface for file processing results
 */
export interface FileProcessingResult {
  text: string;
  metadata: Record<string, any>;
}

/**
 * AI processing options
 */
export interface AIProcessingOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  detailLevel?: 'brief' | 'standard' | 'detailed';
  format?: 'json' | 'text' | 'csv';
}

/**
 * Structured data extraction result
 */
export interface StructuredDataResult {
  data: any[];
  format: 'json' | 'csv' | 'table' | 'unknown';
  schema?: Record<string, SchemaFieldType>;
}
