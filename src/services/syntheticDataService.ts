
import { toast } from "sonner";
import { generateSyntheticDataWithAI } from "./openAiService";

// Types for our service
export type DataField = {
  name: string;
  type: string;
  included: boolean;
};

export type SyntheticDataOptions = {
  dataType: string;
  fields: DataField[];
  rowCount: number;
  distributionType: string;
  includeNulls: boolean;
  nullPercentage: number;
  outputFormat: string;
  customSchema?: string;
  aiPrompt?: string;
  uploadedData?: any[];
  onProgress?: (progress: number) => void;
};

// Default schemas for different data types with included set to false by default
export const defaultSchemas: Record<string, DataField[]> = {
  user: [
    { name: "id", type: "id", included: false },
    { name: "full_name", type: "name", included: false },
    { name: "email", type: "email", included: false },
    { name: "age", type: "number", included: false },
    { name: "created_at", type: "date", included: false },
  ],
  transaction: [
    { name: "transaction_id", type: "id", included: false },
    { name: "user_id", type: "id", included: false },
    { name: "amount", type: "float", included: false },
    { name: "currency", type: "string", included: false },
    { name: "transaction_date", type: "date", included: false },
    { name: "status", type: "string", included: false },
  ],
  product: [
    { name: "product_id", type: "id", included: false },
    { name: "name", type: "string", included: false },
    { name: "description", type: "string", included: false },
    { name: "price", type: "float", included: false },
    { name: "category", type: "string", included: false },
    { name: "stock", type: "integer", included: false },
    { name: "created_at", type: "date", included: false },
  ],
  health: [
    { name: "patient_id", type: "id", included: false },
    { name: "name", type: "name", included: false },
    { name: "dob", type: "date", included: false },
    { name: "blood_type", type: "string", included: false },
    { name: "heart_rate", type: "integer", included: false },
    { name: "blood_pressure", type: "string", included: false },
    { name: "diagnosis", type: "string", included: false },
    { name: "admission_date", type: "date", included: false },
  ],
  custom: [], // Empty for custom schemas
};

// Main function to generate synthetic data
export const generateSyntheticData = async (options: SyntheticDataOptions, apiKey: string | null = null): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!apiKey) {
        toast.error("API key is required for synthetic data generation");
        reject(new Error("API key is required"));
        return;
      }
      
      const { rowCount, outputFormat, onProgress } = options;
      
      // If rowCount is small (< 50), generate all at once
      if (rowCount <= 50) {
        const aiPrompt = constructAIPrompt(options);
        const result = await generateSyntheticDataWithAI(
          apiKey, 
          aiPrompt, 
          outputFormat, 
          rowCount
        );
        
        // Validate the generated data
        const validatedData = validateDataOutput(result, outputFormat, rowCount);
        if (validatedData) {
          resolve(validatedData);
        } else {
          reject(new Error("Failed to generate valid data"));
        }
        return;
      }
      
      // For larger datasets, break into chunks
      const chunkSize = 50; // Maximum rows per chunk
      const chunks = Math.ceil(rowCount / chunkSize);
      let allData: any[] = [];
      
      for (let i = 0; i < chunks; i++) {
        const remainingRows = rowCount - (i * chunkSize);
        const currentChunkSize = Math.min(chunkSize, remainingRows);
        
        // Update options for this chunk
        const chunkOptions = { ...options, rowCount: currentChunkSize };
        const aiPrompt = constructAIPrompt(chunkOptions);
        
        try {
          // Report progress
          if (onProgress) {
            onProgress(Math.round((i / chunks) * 100));
          }
          
          // Generate chunk
          const chunkResult = await generateSyntheticDataWithAI(
            apiKey, 
            aiPrompt, 
            outputFormat, 
            currentChunkSize,
            // Provide sample data from previous chunk if available
            allData.length > 0 ? { sampleData: allData.slice(-3) } : undefined
          );
          
          // Parse the chunk
          const parsedChunk = parseDataFromString(chunkResult, outputFormat);
          
          if (Array.isArray(parsedChunk) && parsedChunk.length > 0) {
            allData = [...allData, ...parsedChunk];
          } else {
            console.error("Invalid chunk data received:", chunkResult);
            // Try again with a smaller chunk
            i--; // Retry this chunk
            continue;
          }
          
        } catch (error) {
          console.error(`Error generating chunk ${i+1}/${chunks}:`, error);
          toast.error(`Error in chunk ${i+1}. Retrying...`);
          
          // Retry this chunk (with backoff)
          await new Promise(r => setTimeout(r, 1000));
          i--; // Retry this chunk
          continue;
        }
      }
      
      // Final progress update
      if (onProgress) {
        onProgress(100);
      }
      
      // Convert all data back to requested format
      if (allData.length > 0) {
        const finalResult = outputFormat === 'json' 
          ? JSON.stringify(allData, null, 2) 
          : convertToCSV(allData);
        resolve(finalResult);
      } else {
        reject(new Error("Failed to generate any valid data"));
      }
      
    } catch (error) {
      console.error('Error generating synthetic data:', error);
      reject(error);
    }
  });
};

// Helper function to validate and potentially fix the generated data
const validateDataOutput = (data: string, format: string, expectedRowCount: number): string | null => {
  try {
    if (format === 'json') {
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        // Try to fix common JSON issues
        const fixedData = fixJsonString(data);
        parsedData = JSON.parse(fixedData);
      }
      
      // Check if it's an array
      if (!Array.isArray(parsedData)) {
        if (typeof parsedData === 'object') {
          // If it's a single object, convert to array
          parsedData = [parsedData];
        } else {
          return null;
        }
      }
      
      // If we have at least some data, return it
      if (parsedData.length > 0) {
        return JSON.stringify(parsedData, null, 2);
      }
      return null;
    } else if (format === 'csv') {
      // Basic CSV validation - check if it has multiple lines and commas
      const lines = data.trim().split('\n');
      if (lines.length > 1 && lines[0].includes(',')) {
        return data;
      }
      return null;
    }
    return null;
  } catch (error) {
    console.error('Error validating data output:', error);
    return null;
  }
};

// Helper function to fix common JSON string issues
const fixJsonString = (jsonString: string): string => {
  // Remove any text before the first [
  const startBracketPos = jsonString.indexOf('[');
  if (startBracketPos >= 0) {
    jsonString = jsonString.substring(startBracketPos);
  }
  
  // Remove any text after the last ]
  const endBracketPos = jsonString.lastIndexOf(']');
  if (endBracketPos >= 0) {
    jsonString = jsonString.substring(0, endBracketPos + 1);
  }
  
  // Replace single quotes with double quotes
  jsonString = jsonString.replace(/'/g, '"');
  
  // Fix unquoted property names (common in LLM outputs)
  jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
  
  return jsonString;
};

// Helper function to parse data from string based on format
const parseDataFromString = (data: string, format: string): any[] => {
  try {
    if (format === 'json') {
      // Try to parse the JSON
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Try to fix and parse
        const fixedJson = fixJsonString(data);
        const parsed = JSON.parse(fixedJson);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
    } else if (format === 'csv') {
      // Simple CSV parsing - convert to JSON
      const lines = data.trim().split('\n');
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim());
      const result = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const obj: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        
        result.push(obj);
      }
      
      return result;
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing data:', error);
    return [];
  }
};

// Helper function to convert array of objects to CSV
const convertToCSV = (data: any[]): string => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header];
      // Handle values with commas by quoting them
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value === null || value === undefined ? '' : value;
    }).join(',')
  );
  
  return [headerRow, ...rows].join('\n');
};

// Helper function to construct AI prompt based on options
const constructAIPrompt = (options: SyntheticDataOptions): string => {
  const { fields, includeNulls, nullPercentage, aiPrompt, uploadedData } = options;
  
  // If custom AI prompt is provided, use that as the base
  let prompt = aiPrompt || "Generate realistic synthetic data with the following structure:";
  
  // Add fields information
  const includedFields = fields.filter(field => field.included);
  
  if (includedFields.length === 0) {
    prompt = "Please select at least one field to include in your data.";
    toast.error("No fields selected. Please select at least one field.");
    throw new Error("No fields selected");
  }
  
  prompt += "\n\nFields:";
  includedFields.forEach(field => {
    prompt += `\n- ${field.name} (${field.type})`;
  });
  
  // Add null information if needed
  if (includeNulls) {
    prompt += `\n\nInclude null values in approximately ${nullPercentage}% of fields.`;
  }
  
  // If we have uploaded data, provide it as a sample
  if (uploadedData && uploadedData.length > 0) {
    prompt += "\n\nHere are some sample data points to mimic the style and patterns:";
    const sampleCount = Math.min(3, uploadedData.length);
    for (let i = 0; i < sampleCount; i++) {
      prompt += `\n${JSON.stringify(uploadedData[i])}`;
    }
    prompt += "\n\nGenerate more data points that follow similar patterns and distributions.";
  }
  
  // Add critical instruction for data format
  prompt += "\n\nYour response should ONLY consist of raw data with no explanations or additional text outside the data structure.";
  
  return prompt;
};

// Function to save data to a file and trigger download
export const downloadSyntheticData = (data: string, format: string): void => {
  const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `synthetic_data_${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success('Download started');
};

// Add mock database saving function 
export const saveSyntheticDataToDatabase = async (data: string): Promise<void> => {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      console.log('Data saved to database:', data.slice(0, 100) + '...');
      toast.success('Data saved to database successfully');
      resolve();
    }, 1500);
  });
};

// Function to detect schema from uploaded data
export const detectSchemaFromData = (data: any[]): DataField[] => {
  if (!data || data.length === 0) return [];
  
  const sample = data[0];
  const detectedFields: DataField[] = [];
  
  Object.entries(sample).forEach(([key, value]) => {
    let type = "string";
    
    // Detect type based on value
    if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'float';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'string') {
      // Try to detect common patterns
      if (value.includes('@') && value.includes('.')) {
        type = 'email';
      } else if (/^\d{3}-\d{3}-\d{4}$/.test(value) || /^\(\d{3}\) \d{3}-\d{4}$/.test(value)) {
        type = 'phone';
      } else if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
        type = 'date';
      } else if (value.split(' ').length >= 2 && /^[A-Z][a-z]+ [A-Z][a-z]+/.test(value)) {
        type = 'name';
      } else if (value.includes(',') && /\d{5}/.test(value)) {
        type = 'address';
      }
    }
    
    detectedFields.push({
      name: key,
      type,
      included: false // Set default to false as per requirement
    });
  });
  
  return detectedFields;
};
