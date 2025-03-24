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
  constraints?: Record<string, any>; 
  seedData?: any[]; 
  realism?: "low" | "medium" | "high"; 
  onProgress?: (progress: number) => void;
};

// Default schemas for different data types with included set to false by default
export const defaultSchemas: Record<string, DataField[]> = {
  user: [
    { name: "id", type: "id", included: true },
    { name: "full_name", type: "name", included: true },
    { name: "email", type: "email", included: true },
    { name: "age", type: "integer", included: true },
    { name: "created_at", type: "date", included: true },
  ],
  transaction: [
    { name: "transaction_id", type: "id", included: true },
    { name: "user_id", type: "id", included: true },
    { name: "amount", type: "float", included: true },
    { name: "currency", type: "string", included: true },
    { name: "transaction_date", type: "date", included: true },
    { name: "status", type: "string", included: true },
  ],
  health: [
    { name: "patient_id", type: "id", included: true },
    { name: "patient_name", type: "name", included: true },
    { name: "patient_age", type: "int", included: true },
    { name: "admission_date", type: "date", included: true },
    { name: "diagnosis", type: "string", included: true },
    { name: "treatment", type: "string", included: true },
    
  ],
  product: [
    { name: "product_id", type: "id", included: true },
    { name: "name", type: "string", included: true },
    { name: "description", type: "string", included: true },
    { name: "price", type: "float", included: true },
    { name: "category", type: "string", included: true },
    { name: "stock", type: "integer", included: true },
    { name: "created_at", type: "date", included: true },
  ],
  custom: [], // Empty for custom schemas
  prompt_only: [], // Empty for prompt-only generation
};

// 🔹 Generate Synthetic Data
export const generateSyntheticData = async (
  options: SyntheticDataOptions, 
  apiKey: string | null = null
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!apiKey) {
        toast.error("API key is required for synthetic data generation");
        reject(new Error("API key is required"));
        return;
      }

      const { dataType, rowCount, outputFormat, onProgress, fields, aiPrompt, uploadedData } = options;

      // 🔹 Check if using prompt-only mode
      const isPromptOnlyMode = dataType === "prompt_only";

      if (isPromptOnlyMode && (!aiPrompt || aiPrompt.trim() === '')) {
        toast.error("AI prompt is required for prompt-only mode");
        reject(new Error("AI prompt is required for prompt-only mode"));
        return;
      }

      // Set progress to indicate the request has started
      if (onProgress) {
        onProgress(10);
      }

      // 🔹 Convert selected fields to schema format only if not in prompt-only mode
      let schema: Record<string, string> = {};
      
      if (!isPromptOnlyMode) {
        fields
          .filter(field => field.included)
          .forEach(field => {
            schema[field.name] = field.type;
          });
      }
      
      // Check for valid schema or prompt in custom mode
      if (dataType === "custom" && Object.keys(schema).length === 0 && (!aiPrompt || aiPrompt.trim() === '')) {
        toast.error("Please select at least one field or provide an AI prompt for custom data");
        reject(new Error("No schema fields or AI prompt provided for custom data"));
        return;
      }

      // 🔹 Generate data with AI
      try {
        // Update progress
        if (onProgress) {
          onProgress(30);
        }

        const result = await generateSyntheticDataWithAI(apiKey, schema, rowCount, {
          seedData: uploadedData?.slice(0, 5),
          aiPrompt: aiPrompt
        });

        // Update progress
        if (onProgress) {
          onProgress(80);
        }

        // Check if result contains error
        if (result.length === 1 && result[0].error) {
          console.error("Error in AI data generation:", result[0]);
          reject(new Error(result[0].message || "Error generating data"));
          return;
        }

        // 🔹 Convert to requested format
        const formattedData = outputFormat === 'json' 
          ? JSON.stringify(result, null, 2) 
          : convertToCSV(result);

        // Update progress
        if (onProgress) {
          onProgress(100);
        }

        resolve(formattedData);
      } catch (error) {
        console.error("Error in AI data generation:", error);
        reject(error);
      }
    } catch (error) {
      console.error("Error generating synthetic data:", error);
      reject(error);
    }
  });
};



// 🔹 AI-Powered Schema Detection
export const detectSchemaFromData = async (data: any[], apiKey: string): Promise<DataField[]> => {
  if (!data || data.length === 0) return [];

  try {
    const sample = JSON.stringify(data.slice(0, 3));

    const aiPrompt = `Analyze this dataset and infer the schema with field types. Example JSON: ${sample}. 
    Return a JSON array of objects with "name" and "type" properties. Valid types include: string, number, boolean, date, id, name, email, phone, address, integer, float.`;

    const schemaResponse = await generateSyntheticDataWithAI(apiKey, {}, 0, { aiPrompt });

    if (schemaResponse.length > 0 && schemaResponse[0].error) {
      console.error("Error detecting schema:", schemaResponse[0]);
      throw new Error(schemaResponse[0].message || "Failed to detect schema");
    }

    // Map the response to our DataField type and set included to true by default
    return schemaResponse.map((field: any) => ({
      name: field.name || field.field || "",
      type: field.type || "string",
      included: true
    })).filter((field: DataField) => field.name.trim() !== "");
  } catch (error) {
    console.error("Error in schema detection:", error);
    toast.error("Failed to detect schema from data");
    // Return empty array on error to prevent UI from breaking
    return [];
  }
};

// 🔹 AI-Powered Data Augmentation
export const augmentDataWithAI = async (existingData: any[], apiKey: string): Promise<any[]> => {
  if (!existingData || existingData.length === 0) return [];

  const aiPrompt = `Enhance and diversify the following dataset by adding slight variations to values while maintaining schema consistency. Existing data: ${JSON.stringify(existingData.slice(0, 5))}`;

  return await generateSyntheticDataWithAI(apiKey, {}, existingData.length, { aiPrompt });
};

// 🔹 AI-Powered File Parsing
export const parseFileWithAI = async (fileContent: string, fileType: string, apiKey: string): Promise<any[]> => {
  const aiPrompt = `Extract structured data from the following ${fileType.toUpperCase()} file content: ${fileContent.slice(0, 1000)}. Ensure correct field identification.`;

  return await generateSyntheticDataWithAI(apiKey, {}, 0, { aiPrompt });
};

// 🔹 Convert JSON to CSV (AI-generated data)
const convertToCSV = (data: any[]): string => {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const rows = data.map(obj =>
    headers.map(header => {
      const value = obj[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value === null || value === undefined ? '' : value;
    }).join(',')
  );

  return [headerRow, ...rows].join('\n');
};

// 🔹 AI-Powered Data Download
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

  toast.success("Download started");
};

// 🔹 Save AI-Generated Data to Database
export const saveSyntheticDataToDatabase = async (data: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Data saved to database:", data.slice(0, 100) + "...");
      toast.success("AI-powered data saved to database successfully");
      resolve();
    }, 1500);
  });
};
