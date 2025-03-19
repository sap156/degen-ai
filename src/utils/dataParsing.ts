
/**
 * Utilities for parsing different data formats
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
 * Parse an XML file into a JavaScript object
 * @param content The XML content as string
 * @returns Parsed XML data as an object
 */
export const parseXML = (content: string): any => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    
    // Convert XML to JavaScript object
    const xmlToObj = (node: Element): any => {
      // Handle attributes
      const obj: Record<string, any> = {};
      
      // Add attributes as properties
      if (node.attributes && node.attributes.length > 0) {
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          obj[`@${attr.name}`] = attr.value;
        }
      }
      
      // Process child nodes
      if (node.hasChildNodes()) {
        const children = node.childNodes;
        let hasElements = false;
        
        // Check if there are element children
        for (let i = 0; i < children.length; i++) {
          if (children[i].nodeType === 1) {
            hasElements = true;
            break;
          }
        }
        
        // Handle text content
        if (!hasElements && children.length === 1 && children[0].nodeType === 3) {
          const textContent = children[0].nodeValue?.trim();
          
          // Check for number, boolean, etc.
          if (textContent !== null && textContent !== undefined) {
            if (!isNaN(Number(textContent)) && textContent !== '') {
              return Number(textContent);
            } else if (textContent.toLowerCase() === 'true') {
              return true;
            } else if (textContent.toLowerCase() === 'false') {
              return false;
            } else {
              return textContent;
            }
          }
          return '';
        }
        
        // Process element children
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          
          if (child.nodeType === 1) { // Element node
            const nodeName = child.nodeName;
            
            // Handle repeating elements by creating arrays
            if (obj[nodeName] !== undefined) {
              if (!Array.isArray(obj[nodeName])) {
                obj[nodeName] = [obj[nodeName]];
              }
              obj[nodeName].push(xmlToObj(child as Element));
            } else {
              obj[nodeName] = xmlToObj(child as Element);
            }
          }
        }
      }
      
      return Object.keys(obj).length > 0 ? obj : '';
    };
    
    const rootElement = xmlDoc.documentElement;
    const result: Record<string, any> = {};
    result[rootElement.nodeName] = xmlToObj(rootElement);
    
    return result;
  } catch (error) {
    throw new Error('Invalid XML format');
  }
};

/**
 * Attempt to determine the format of a text content and parse it accordingly
 * @param content The text content to parse
 * @returns Parsed data in the detected format
 */
export const autoDetectAndParse = (content: string): any => {
  const trimmedContent = content.trim();
  
  // Check if it's JSON
  if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) || 
      (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
    try {
      return parseJSON(trimmedContent);
    } catch (e) {
      // Not valid JSON, continue checking other formats
    }
  }
  
  // Check if it's XML
  if (trimmedContent.startsWith('<') && trimmedContent.endsWith('>')) {
    try {
      return parseXML(trimmedContent);
    } catch (e) {
      // Not valid XML, continue checking other formats
    }
  }
  
  // Check if it's CSV (has commas and multiple lines)
  if (trimmedContent.includes(',') && trimmedContent.includes('\n')) {
    try {
      return parseCSV(trimmedContent);
    } catch (e) {
      // Not valid CSV, continue checking
    }
  }
  
  // If all else fails, just return the text as is, structured by lines
  const lines = trimmedContent.split('\n').filter(line => line.trim());
  if (lines.length > 1) {
    return lines.map(line => ({ text: line }));
  }
  
  // Return as simple object if it's just one line
  return { text: trimmedContent };
};

/**
 * Format data as a downloadable file
 * @param data The data to format
 * @param format The output format
 * @returns Formatted data string
 */
export const formatData = (data: any[], format: 'csv' | 'json' | 'text'): string => {
  if (!data || !data.length) return '';
  
  switch (format) {
    case 'csv':
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => {
          if (value === null || value === undefined) return '';
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      );
      return [headers, ...rows].join('\n');
      
    case 'json':
      return JSON.stringify(data, null, 2);
      
    case 'text':
      return data.map(item => Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')).join('\n');
      
    default:
      return JSON.stringify(data, null, 2);
  }
};
