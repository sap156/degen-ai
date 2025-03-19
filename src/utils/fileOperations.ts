
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
