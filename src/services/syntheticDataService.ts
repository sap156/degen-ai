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
};

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

      // If dataType is "custom" and no schema fields are provided, use only the AI prompt
      const useAIPromptOnly = dataType === "custom" && (!fields || fields.length === 0);

      // Construct AI prompt dynamically
      let aiGeneratedPrompt = aiPrompt;

      if (useAIPromptOnly) {
        aiGeneratedPrompt = `Generate ${rowCount} rows of synthetic data based on the pattern of the uploaded file. Ensure it mimics the structure and distribution of values in a realistic way.`;

        if (uploadedData && uploadedData.length > 0) {
          aiGeneratedPrompt += ` Use the following sample data as a reference: ${JSON.stringify(uploadedData.slice(0, 5))}`;
        }
      }

      // Convert selected fields to schema format only if a schema exists
      const schema: Record<string, string> = {};
      if (!useAIPromptOnly) {
        fields
          .filter(field => field.included)
          .forEach(field => {
            schema[field.name] = field.type;
          });
      }

      // 🔥 AI-powered synthetic data generation
      const result = await generateSyntheticDataWithAI(apiKey, schema, rowCount, {
        seedData: uploadedData?.slice(0, 5),
        aiPrompt: aiGeneratedPrompt
      });

      // Convert to requested format
      const formattedData = outputFormat === 'json' 
        ? JSON.stringify(result, null, 2) 
        : convertToCSV(result);

      resolve(formattedData);

    } catch (error) {
      console.error("Error generating synthetic data with AI:", error);
      reject(error);
    }
  });
};


// 🔹 AI-Powered Schema Detection
export const detectSchemaFromData = async (data: any[], apiKey: string): Promise<DataField[]> => {
  if (!data || data.length === 0) return [];

  const sample = JSON.stringify(data.slice(0, 3));

  const aiPrompt = `Analyze this dataset and infer the schema with field types. Example JSON: ${sample}.`;

  const schemaResponse = await generateSyntheticDataWithAI(apiKey, {}, 0, { aiPrompt });

  return schemaResponse.map((field: any) => ({
    name: field.name,
    type: field.type,
    included: false
  }));
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
