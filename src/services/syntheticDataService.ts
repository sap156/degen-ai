/**
 * Service for generating synthetic data
 */

export interface DataField {
  name: string;
  type: string;
  included: boolean;
}

export interface SyntheticDataOptions {
  dataType: string;
  rowCount: number;
  distributionType: string;
  includeNulls: boolean;
  nullPercentage: number;
  outputFormat: string;
  customSchema: string;
  aiPrompt: string;
  fields: DataField[];
  uploadedData?: any[];
  onProgress?: (progress: number) => void;
}

export const defaultSchemas: Record<string, DataField[]> = {
  user: [
    { name: "id", type: "id", included: true },
    { name: "firstName", type: "name", included: true },
    { name: "lastName", type: "name", included: true },
    { name: "email", type: "email", included: true },
    { name: "phone", type: "phone", included: true },
    { name: "address", type: "address", included: true },
    { name: "age", type: "integer", included: true },
    { name: "isActive", type: "boolean", included: true },
  ],
  transaction: [
    { name: "id", type: "id", included: true },
    { name: "date", type: "date", included: true },
    { name: "amount", type: "float", included: true },
    { name: "description", type: "string", included: true },
    { name: "category", type: "string", included: true },
  ],
  product: [
    { name: "id", type: "id", included: true },
    { name: "name", type: "string", included: true },
    { name: "description", type: "string", included: true },
    { name: "price", type: "float", included: true },
    { name: "quantity", type: "integer", included: true },
  ],
  health: [
    { name: "id", type: "id", included: true },
    { name: "date", type: "date", included: true },
    { name: "patientId", type: "id", included: true },
    { name: "systolic", type: "integer", included: true },
    { name: "diastolic", type: "integer", included: true },
    { name: "heartRate", type: "integer", included: true },
  ],
};

/**
 * Generates synthetic data based on provided options
 * @param options Generation options
 * @param apiKey OpenAI API key
 * @returns Generated data as a string
 */
export const generateSyntheticData = async (
  options: SyntheticDataOptions,
  apiKey: string
): Promise<string> => {
  try {
    // Validate API key
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
    
    // Validate options
    if (!options) {
      throw new Error("Options are required");
    }
    
    // Validate row count
    if (options.rowCount < 1 || options.rowCount > 10000) {
      throw new Error("Row count must be between 1 and 10,000");
    }
    
    // Validate fields
    if (!options.fields || options.fields.length === 0) {
      throw new Error("At least one field must be included");
    }
    
    // Filter included fields
    const includedFields = options.fields.filter((field) => field.included);
    if (includedFields.length === 0) {
      throw new Error("At least one field must be included");
    }
    
    // Construct the prompt
    let prompt = options.aiPrompt;
    
    // Add schema information to the prompt
    prompt += "\n\nSchema:\n";
    includedFields.forEach((field) => {
      prompt += `- ${field.name} (${field.type})\n`;
    });
    
    // Add output format to the prompt
    prompt += `\nOutput format: ${options.outputFormat.toUpperCase()}`;
    
    // Add row count to the prompt
    prompt += `\nNumber of rows: ${options.rowCount}`;
    
    // Add uploaded data to the prompt
    if (options.uploadedData && options.uploadedData.length > 0) {
      prompt += `\n\nExample Data:\n${JSON.stringify(options.uploadedData, null, 2)}`;
    }
    
    // Add null value instructions
    if (options.includeNulls) {
      prompt += `\nInclude null values in ${options.nullPercentage}% of the fields`;
    }
    
    // Add a final instruction
    prompt += "\n\nGenerate synthetic data based on the above schema and format";
    
    // Call the OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.7,
        stream: false,
      }),
    });
    
    // Check for errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(
        `OpenAI API error: ${response.status} - ${
          errorData.error?.message || errorData.message || "Unknown error"
        }`
      );
    }
    
    // Parse the response
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Return the generated data
    return content;
  } catch (error: any) {
    console.error("Error generating synthetic data:", error);
    throw new Error(`Failed to generate synthetic data: ${error.message}`);
  }
};

/**
 * Downloads synthetic data as a file
 * @param data The data to download
 * @param format The format of the data
 */
export const downloadSyntheticData = (data: string, format: string) => {
  // Create a blob from the data
  const blob = new Blob([data], { type: "text/plain" });
  
  // Create a link element
  const link = document.createElement("a");
  
  // Set the link's href to the blob URL
  link.href = URL.createObjectURL(blob);
  
  // Set the link's download attribute
  link.download = `synthetic_data.${format}`;
  
  // Append the link to the document
  document.body.appendChild(link);
  
  // Click the link
  link.click();
  
  // Remove the link from the document
  document.body.removeChild(link);
};

/**
 * Saves synthetic data to a database
 * @param data The data to save
 * @returns Promise resolving to success status
 */
export const saveSyntheticDataToDatabase = async (data: string): Promise<void> => {
  try {
    // Parse the data
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    // In a real implementation, this would connect to a database
    // For now we're simulating the save operation
    console.log('Saving data to database...', parsedData.length || parsedData.size || 'unknown size');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Log success
    console.log('Data successfully saved to database');
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error saving data to database:', error);
    return Promise.reject(new Error('Failed to save data to database'));
  }
};

/**
 * Detects schema from data
 * @param data The data to detect schema from
 * @returns The detected schema
 */
export const detectSchemaFromData = (data: any[]): DataField[] => {
  if (!data || data.length === 0) {
    return [];
  }
  
  const firstRow = data[0];
  const fields: DataField[] = [];
  
  for (const key in firstRow) {
    if (firstRow.hasOwnProperty(key)) {
      let type = 'string'; // Default type
      const value = firstRow[key];
      
      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'float';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date) {
        type = 'date';
      }
      
      fields.push({
        name: key,
        type: type,
        included: true, // Default to included
      });
    }
  }
  
  return fields;
};
