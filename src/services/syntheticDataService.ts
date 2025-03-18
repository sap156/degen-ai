
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
      
      const { rowCount, outputFormat, onProgress, fields } = options;
      
      // Convert fields to schema format for the API
      const schema: Record<string, string> = {};
      fields.filter(field => field.included).forEach(field => {
        schema[field.name] = field.type;
      });
      
      // If rowCount is small (< 50), generate all at once
      if (rowCount <= 50) {
        try {
          const result = await generateSyntheticDataWithAI(
            apiKey, 
            schema, 
            rowCount,
            {
              seedData: options.uploadedData?.slice(0, 3)
            }
          );
          
          // Convert to the requested format and return
          const formattedData = outputFormat === 'json'
            ? JSON.stringify(result, null, 2)
            : convertToCSV(result);
            
          resolve(formattedData);
        } catch (error) {
          console.error('Error in single-batch generation:', error);
          reject(error);
        }
        return;
      }
      
      // For larger datasets, break into chunks
      const chunkSize = 50; // Maximum rows per chunk
      const chunks = Math.ceil(rowCount / chunkSize);
      let allData: any[] = [];
      let highestId = 0; // Track the highest ID generated
      
      for (let i = 0; i < chunks; i++) {
        const remainingRows = rowCount - (i * chunkSize);
        const currentChunkSize = Math.min(chunkSize, remainingRows);
        
        // Report progress
        if (onProgress) {
          onProgress(Math.round((i / chunks) * 100));
        }
        
        try {
          // Generate chunk
          const chunkResult = await generateSyntheticDataWithAI(
            apiKey, 
            schema, 
            currentChunkSize,
            {
              // Provide sample data from previous chunk if available
              seedData: allData.length > 0 ? allData.slice(-3) : options.uploadedData?.slice(0, 3)
            }
          );
          
          if (Array.isArray(chunkResult) && chunkResult.length > 0) {
            // Update the highest ID if we find one higher in this chunk
            chunkResult.forEach(item => {
              // Check for all possible ID field names
              const idFields = ["id", "ID", "Id", "user_id", "transaction_id", "product_id", "patient_id"];
              
              for (const field of idFields) {
                if (item[field] !== undefined) {
                  const itemId = parseInt(item[field]);
                  if (!isNaN(itemId) && itemId > highestId) {
                    highestId = itemId;
                  }
                }
              }
            });
            
            allData = [...allData, ...chunkResult];
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
