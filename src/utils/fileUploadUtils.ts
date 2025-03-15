
/**
 * Utilities for handling file uploads across different data types
 */

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
