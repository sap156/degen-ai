
import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";

export interface AugmentationOptions {
  method: string;
  intensity: number;
  fields: string[];
  distribution?: string;
  aiPrompt?: string;
  sampleData?: any[];
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

// Function to augment data using AI
export const augmentDataWithAI = async (
  apiKey: string | null,
  data: any[],
  options: AugmentationOptions
): Promise<any[]> => {
  if (!apiKey) {
    toast.error("API key is required for AI-powered data augmentation");
    throw new Error("API key is required");
  }
  
  if (data.length === 0) {
    toast.error("No data provided for augmentation");
    throw new Error("No data provided");
  }
  
  try {
    // Prepare sample data (limited to 5 items for prompt size)
    const sampleCount = Math.min(5, data.length);
    const samples = data.slice(0, sampleCount);
    
    // Create system message based on augmentation method
    const systemMessage = createSystemMessage(options.method, options.interval);
    
    // Create user message with data samples and instructions
    const userMessage = createUserMessage(samples, options);
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];
    
    console.log("Sending request to OpenAI with options:", {
      method: options.method,
      interval: options.interval || 'daily'
    });
    
    // Call OpenAI API
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.7,
      max_tokens: 2500,
      model: 'gpt-4o' // Explicitly setting the model
    });
    
    console.log("Raw AI response:", response.substring(0, 200) + "...");
    
    // Parse the AI response
    try {
      // Clean the response from potential code blocks
      const cleanJsonResponse = (text: string): string => {
        let cleaned = text.trim();
        
        // Handle code blocks (```json ... ```)
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
        const match = cleaned.match(jsonBlockRegex);
        
        if (match && match[1]) {
          cleaned = match[1].trim();
          console.log("Extracted JSON from code block");
        }
        
        // Check if the response starts with a square bracket for array
        if (!cleaned.startsWith('[')) {
          console.log("Response doesn't start with '[', trying to find JSON array");
          const arrayMatch = cleaned.match(/\[\s*{[\s\S]*}\s*\]/);
          if (arrayMatch) {
            cleaned = arrayMatch[0];
            console.log("Found and extracted JSON array");
          }
        }
        
        return cleaned;
      };
      
      const cleanedResponse = cleanJsonResponse(response);
      console.log("Cleaned response (first 100 chars):", cleanedResponse.substring(0, 100));
      
      let augmentedData;
      
      try {
        augmentedData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Initial JSON parse failed:", parseError);
        
        // Fallback: Try to find any JSON-like structure in the response
        const possibleJson = response.match(/(\[[\s\S]*\])/);
        if (possibleJson && possibleJson[1]) {
          try {
            augmentedData = JSON.parse(possibleJson[1]);
            console.log("Parsed JSON using fallback method");
          } catch (fallbackError) {
            console.error("Fallback JSON parse also failed:", fallbackError);
            throw new Error("Could not parse AI response as JSON");
          }
        } else {
          throw new Error("No valid JSON structure found in response");
        }
      }
      
      if (!Array.isArray(augmentedData)) {
        console.error("Response is not an array:", augmentedData);
        toast.error("Invalid response format from AI");
        return [];
      }
      
      console.log(`Generated ${augmentedData.length} augmented records`);
      return augmentedData;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Raw response:", response);
      toast.error("Failed to parse AI response");
      return [];
    }
  } catch (error) {
    console.error("Error augmenting data with AI:", error);
    toast.error(error instanceof Error ? error.message : "Error during data augmentation");
    return [];
  }
};

// Helper function to create appropriate system messages
const createSystemMessage = (method: string, interval?: string): string => {
  const baseMessage = "You are a specialized data augmentation AI assistant. ";
  let timeSeriesAddition = "";
  
  if (interval) {
    timeSeriesAddition = `When generating time series data, use a ${interval} interval. Always return properly formatted JSON arrays with timestamp fields. `;
  }
  
  switch (method) {
    case "noise":
      return baseMessage + 
        "You specialize in adding realistic noise to numeric data while preserving underlying patterns and relationships. " +
        "Your task is to generate augmented data by adding contextually appropriate noise to numeric fields. " +
        timeSeriesAddition +
        "You must ONLY return a valid JSON array. No explanations or additional text.";
    
    case "scaling":
      return baseMessage + 
        "You specialize in scaling numeric data while maintaining realistic proportions and relationships. " +
        "Your task is to generate augmented data by intelligently scaling numeric fields based on domain knowledge. " +
        timeSeriesAddition +
        "You must ONLY return a valid JSON array. No explanations or additional text.";
    
    case "outliers":
      return baseMessage + 
        "You specialize in generating realistic outliers in datasets. " +
        "Your task is to create plausible but extreme values that could reasonably occur in the given domain. " +
        timeSeriesAddition +
        "You must ONLY return a valid JSON array. No explanations or additional text.";
    
    case "missing":
      return baseMessage + 
        "You specialize in simulating missing data patterns that reflect real-world scenarios. " +
        "Your task is to intelligently remove values based on realistic missing data mechanisms. " +
        timeSeriesAddition +
        "You must ONLY return a valid JSON array. No explanations or additional text.";
    
    case "categorical":
      return baseMessage + 
        "You specialize in categorical data augmentation and oversampling. " +
        "Your task is to generate new categorical data variations while maintaining class distributions and semantic validity. " +
        timeSeriesAddition +
        "You must ONLY return a valid JSON array. No explanations or additional text.";
    
    case "text":
      return baseMessage + 
        "You specialize in text augmentation and generation. " +
        "Your task is to produce variations of text data that preserve meaning while introducing natural diversity. " +
        timeSeriesAddition +
        "You must ONLY return a valid JSON array. No explanations or additional text.";
    
    case "timeseries":
      return baseMessage + 
        "You specialize in time series data generation and augmentation. " +
        `Your task is to generate time series data with a ${interval || 'daily'} interval that follows realistic patterns. ` +
        "You must ONLY return a valid JSON array with timestamps and values. No explanations or additional text.";
    
    default:
      return baseMessage + 
        "You specialize in data augmentation across various data types. " +
        "Your task is to generate augmented data based on the provided samples and instructions. " +
        timeSeriesAddition +
        "You must ONLY return a valid JSON array. No explanations or additional text.";
  }
};

// Helper function to create user message with instructions
const createUserMessage = (samples: any[], options: AugmentationOptions): string => {
  let message = `I need to augment a dataset with the following characteristics:\n\n`;
  
  // Add method-specific instructions
  message += `Augmentation method: ${options.method}\n`;
  message += `Intensity level: ${options.intensity}\n`;
  message += `Fields to augment: ${options.fields.join(', ')}\n`;
  
  if (options.distribution) {
    message += `Distribution type: ${options.distribution}\n`;
  }
  
  if (options.interval) {
    message += `Time interval: ${options.interval}\n`;
  }
  
  // Add sample data
  message += `\nHere are sample records from my dataset:\n`;
  message += JSON.stringify(samples, null, 2);
  
  // Add custom AI prompt if provided
  if (options.aiPrompt && options.aiPrompt.trim() !== '') {
    message += `\n\nAdditional requirements: ${options.aiPrompt}\n`;
  }
  
  // Add specific instructions based on method
  message += `\nPlease generate ${samples.length * 2} augmented records that follow these instructions and maintain the structure of the original data.`;
  message += `\nReturn ONLY a JSON array with the augmented data. No explanations or additional text. The output must be valid JSON.`;
  
  return message;
};

// Apply a specific augmentation method
export const applyAugmentation = async (
  apiKey: string | null,
  data: any[],
  method: string,
  settings: any,
  aiPrompt?: string,
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly'
): Promise<any[]> => {
  if (!apiKey) {
    toast.error("API key is required for data augmentation");
    return [];
  }
  
  if (data.length === 0) {
    toast.error("No data provided for augmentation");
    return [];
  }
  
  // Extract the relevant fields based on settings and method
  const options: AugmentationOptions = {
    method,
    intensity: getIntensityForMethod(method, settings),
    fields: getFieldsForMethod(method, settings),
    distribution: method === 'noise' ? settings.noise.distribution : undefined,
    aiPrompt,
    sampleData: data.slice(0, 3), // Include sample data
    interval
  };
  
  try {
    const augmentedData = await augmentDataWithAI(apiKey, data, options);
    
    if (augmentedData.length === 0) {
      toast.warning("No augmented data was generated");
    } else {
      toast.success(`Generated ${augmentedData.length} augmented records`);
    }
    
    return augmentedData;
  } catch (error) {
    console.error(`Error applying ${method}:`, error);
    toast.error(`Failed to apply ${method}`);
    return [];
  }
};

// Helper to get the correct intensity value based on the method
const getIntensityForMethod = (method: string, settings: any): number => {
  switch (method) {
    case 'noise': return settings.noise.intensity;
    case 'scaling': return settings.scaling.factor;
    case 'outliers': return settings.outliers.percentage / 100;
    case 'missing': return settings.missing.percentage / 100;
    case 'categorical': return settings.categorical.multiplier;
    case 'text': return 0.7; // Default intensity for text
    case 'timeseries': return 0.5; // Default intensity for time series
    default: return 0.5;
  }
};

// Helper to get the fields for a specific method
const getFieldsForMethod = (method: string, settings: any): string[] => {
  if (method in settings && 'fields' in settings[method]) {
    return settings[method].fields;
  }
  return [];
};
