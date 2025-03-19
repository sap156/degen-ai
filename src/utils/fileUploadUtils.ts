
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

// Import the functions we need to use directly in this file
import { parseCSV, parseJSON, parseXML, autoDetectAndParse } from './dataParsing';

/**
 * Factory function to get appropriate parser for a file type
 * @param fileType The type of file to parse
 * @returns A parsing function for the specified file type
 */
export const getParserForFileType = (fileType: string): ((content: string) => any) => {
  switch (fileType.toLowerCase()) {
    case 'csv':
      return (content: string) => parseCSV(content);
    case 'json':
      return (content: string) => parseJSON(content);
    case 'xml':
      return (content: string) => parseXML(content);
    default:
      // For unknown types, try to auto-detect
      return (content: string) => autoDetectAndParse(content);
  }
};
