// Export SchemaFieldType from fileTypes
export { SchemaFieldType, generateSchema, DataTypeResult } from './fileTypes';

// Rest of fileUploadUtils.ts implementation
import { v4 as uuidv4 } from 'uuid';
import { parse as csvParse } from 'papaparse';

// Parse CSV data
export const parseCSV = (csvText: string): any[] => {
  try {
    const result = csvParse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    return result.data as any[];
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};

// Parse JSON data
export const parseJSON = (jsonText: string): any => {
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return [];
  }
};

// Get file type from file object
export const getFileType = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  return extension;
};

// Add the missing extractTextFromFile function
export const extractTextFromFile = async (file: File, apiKey: string): Promise<any> => {
  // Simple implementation that reads the file as text
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve({
        success: true,
        text: reader.result as string,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};
