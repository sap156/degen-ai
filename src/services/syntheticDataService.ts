
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
};

// Main function to generate synthetic data
export const generateSyntheticData = async (options: SyntheticDataOptions, apiKey: string | null = null): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!apiKey) {
        toast.error("API key is required for synthetic data generation");
        reject(new Error("API key is required"));
        return;
      }
      
      // Create AI prompt based on the options
      const aiPrompt = constructAIPrompt(options);
      
      // Generate data using OpenAI
      generateSyntheticDataWithAI(
        apiKey, 
        aiPrompt, 
        options.outputFormat, 
        options.rowCount
      )
        .then(result => resolve(result))
        .catch(error => {
          console.error("AI generation failed:", error);
          toast.error("Failed to generate synthetic data");
          reject(error);
        });
      
    } catch (error) {
      console.error('Error generating synthetic data:', error);
      reject(error);
    }
  });
};

// Helper function to construct AI prompt based on options
const constructAIPrompt = (options: SyntheticDataOptions): string => {
  const { fields, includeNulls, nullPercentage, aiPrompt, uploadedData } = options;
  
  // If custom AI prompt is provided, use that as the base
  let prompt = aiPrompt || "Generate realistic synthetic data with the following structure:";
  
  // Add fields information
  const includedFields = fields.filter(field => field.included);
  
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
      included: true
    });
  });
  
  return detectedFields;
};
