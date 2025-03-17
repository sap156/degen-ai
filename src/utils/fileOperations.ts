
/**
 * Basic file operations utility functions
 */
import { SupportedFileType } from './fileTypes';

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
 * Format a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @param decimals The number of decimal places to show (default: 2)
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

/**
 * Extract text from a file, handling different file types
 * @param file The file to extract text from
 * @param apiKey Optional API key for processing PDFs and other complex formats
 * @returns Extracted text and file metadata
 */
export const extractTextFromFile = async (
  file: File,
  apiKey: string | null
): Promise<{ text: string; metadata: Record<string, any> }> => {
  const fileType = getFileType(file);
  const metadata: Record<string, any> = {
    name: file.name,
    type: file.type,
    size: formatFileSize(file.size),
    lastModified: new Date(file.lastModified).toLocaleString(),
    fileType
  };
  
  let text = '';
  
  try {
    // Simple text extraction for basic file types
    if (fileType === 'txt' || fileType === 'csv' || fileType === 'json') {
      text = await readFileContent(file);
    } else {
      // For complex file types, we'd normally use API services
      // For now, just extract basic content
      text = await readFileContent(file);
      metadata.note = 'Basic text extraction only. Some content may not be properly parsed.';
    }
    
    return { text, metadata };
  } catch (error) {
    console.error('Error extracting text:', error);
    return { 
      text: `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      metadata 
    };
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
