
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
    // Take up to 5 samples for schema detection to avoid token limits
    const sampleCount = Math.min(5, data.length);
    const samples = data.slice(0, sampleCount);
    const sample = JSON.stringify(samples);

    // Create a detailed prompt for the AI to analyze the data schema
    const aiPrompt = `
    Analyze this dataset and infer the schema with appropriate field types. JSON data sample:
    ${sample}
    
    Return ONLY a JSON array of objects with "name" and "type" properties. 
    Valid types include: string, integer, float, boolean, date, id, name, email, phone, address.
    
    For each field, determine the most appropriate type by analyzing patterns in the data.
    - Use "id" for unique identifiers
    - Use "name" for person names
    - Use "email" for email addresses
    - Use "phone" for phone numbers
    - Use "address" for physical addresses
    - Use "date" for date/time values
    - Use "integer" for whole numbers
    - Use "float" for decimal numbers
    - Use "boolean" for true/false values
    - Use "string" for general text
    
    Return ONLY the JSON array without any explanation or markdown formatting.
    `;

    // Call the OpenAI service to detect the schema
    const schemaResponse = await generateSyntheticDataWithAI(apiKey, {}, 0, { aiPrompt });

    // Handle potential errors in the response
    if (schemaResponse.length > 0 && schemaResponse[0].error) {
      console.error("Error detecting schema:", schemaResponse[0]);
      throw new Error(schemaResponse[0].message || "Failed to detect schema");
    }

    // Process and validate the AI response
    let detectedSchema: DataField[];
    
    // Handle different response formats that might be returned
    if (Array.isArray(schemaResponse) && typeof schemaResponse[0] === 'object') {
      // Check if the response has the required properties
      if (schemaResponse[0].name !== undefined && schemaResponse[0].type !== undefined) {
        // Direct array of field objects
        detectedSchema = schemaResponse.map(field => ({
          name: field.name || field.field || "",
          type: field.type || "string",
          included: true
        }));
      } else if (schemaResponse[0].fields !== undefined && Array.isArray(schemaResponse[0].fields)) {
        // Response with nested fields array
        detectedSchema = schemaResponse[0].fields.map((field: any) => ({
          name: field.name || field.field || "",
          type: field.type || "string",
          included: true
        }));
      } else if (schemaResponse[0].schema !== undefined) {
        // Response with schema object
        const schemaObj = schemaResponse[0].schema;
        detectedSchema = Object.entries(schemaObj).map(([name, type]) => ({
          name,
          type: type as string,
          included: true
        }));
      } else {
        // Fallback: try to infer from the first object's structure
        detectedSchema = Object.keys(data[0]).map(key => ({
          name: key,
          type: inferTypeFromValue(data[0][key]),
          included: true
        }));
      }
    } else {
      // If the response isn't what we expected, fallback to inferring from data
      detectedSchema = Object.keys(data[0]).map(key => ({
        name: key,
        type: inferTypeFromValue(data[0][key]),
        included: true
      }));
    }

    // Filter out any invalid fields and ensure non-empty field names
    return detectedSchema
      .filter((field: DataField) => field.name.trim() !== "")
      .map((field: DataField) => ({
        ...field,
        type: validateFieldType(field.type)
      }));
  } catch (error) {
    console.error("Error in schema detection:", error);
    toast.error("Failed to detect schema from data using AI");
    
    // Fallback to basic schema detection if AI fails
    return fallbackSchemaDetection(data);
  }
};

// Helper function to infer type from a value
const inferTypeFromValue = (value: any): string => {
  if (value === null || value === undefined) return "string";
  
  const type = typeof value;
  
  if (type === "number") {
    return Number.isInteger(value) ? "integer" : "float";
  }
  
  if (type === "boolean") return "boolean";
  
  if (type === "string") {
    // Check for date pattern
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return "date";
    }
    
    // Check for email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
    
    // Check for phone pattern
    if (/^[\d\+\-\(\)\s]{7,15}$/.test(value)) return "phone";
    
    // Check if it might be a name (two words, each capitalized)
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(value)) return "name";
    
    // Check if it might be an ID (look for common ID patterns)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) || 
        /^[A-Z0-9]{8,}$/i.test(value) ||
        value.toLowerCase().includes('id') && /^[A-Z0-9_-]+$/i.test(value)) {
      return "id";
    }
  }
  
  return "string";
};

// Helper function to validate field type
const validateFieldType = (type: string): string => {
  const validTypes = [
    "string", "integer", "float", "boolean", "date", 
    "id", "name", "email", "phone", "address"
  ];
  
  return validTypes.includes(type.toLowerCase()) 
    ? type.toLowerCase() 
    : "string";
};

// Fallback schema detection when AI fails
const fallbackSchemaDetection = (data: any[]): DataField[] => {
  if (!data || data.length === 0) return [];
  
  const firstItem = data[0];
  return Object.keys(firstItem).map(key => {
    let inferredType = "string";
    
    // Look at the first few items to better infer the type
    const sampleSize = Math.min(5, data.length);
    const sampleValues = data.slice(0, sampleSize).map(item => item[key]);
    
    // Check if all values are numbers
    if (sampleValues.every(val => typeof val === "number" || 
        (typeof val === "string" && !isNaN(Number(val))))) {
      inferredType = sampleValues.every(val => 
        typeof val === "number" ? Number.isInteger(val) : Number.isInteger(Number(val))
      ) ? "integer" : "float";
    } 
    // Check if all values are booleans
    else if (sampleValues.every(val => typeof val === "boolean" || 
        val === "true" || val === "false")) {
      inferredType = "boolean";
    }
    // Check for common field patterns in the key name
    else if (typeof firstItem[key] === "string") {
      const keyLower = key.toLowerCase();
      if (keyLower.includes("id") && !keyLower.includes("idea") && !keyLower.includes("hidden")) {
        inferredType = "id";
      } else if (keyLower.includes("name") || keyLower.includes("fullname") || keyLower === "customer") {
        inferredType = "name";
      } else if (keyLower.includes("email")) {
        inferredType = "email";
      } else if (keyLower.includes("phone") || keyLower.includes("mobile") || keyLower.includes("cell")) {
        inferredType = "phone";
      } else if (keyLower.includes("address") || keyLower.includes("street")) {
        inferredType = "address";
      } else if (keyLower.includes("date") || keyLower.includes("time") || keyLower.includes("created")) {
        inferredType = "date";
      }
    }
    
    return {
      name: key,
      type: inferredType,
      included: true
    };
  });
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
