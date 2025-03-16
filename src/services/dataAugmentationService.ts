
import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";

export interface AugmentationOptions {
  method: string;
  intensity: number;
  fields: string[];
  distribution?: string;
  aiPrompt?: string;
  sampleData?: any[];
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
    const systemMessage = createSystemMessage(options.method);
    
    // Create user message with data samples and instructions
    const userMessage = createUserMessage(samples, options);
    
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];
    
    // Call OpenAI API
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.7,
      max_tokens: 2500
    });
    
    // Parse the AI response
    try {
      const augmentedData = JSON.parse(response);
      return augmentedData;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      toast.error("Failed to parse AI response");
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("Error augmenting data with AI:", error);
    throw error;
  }
};

// Helper function to create appropriate system messages
const createSystemMessage = (method: string): string => {
  const baseMessage = "You are a specialized data augmentation AI assistant. ";
  
  switch (method) {
    case "noise":
      return baseMessage + 
        "You specialize in adding realistic noise to numeric data while preserving underlying patterns and relationships. " +
        "Your task is to generate augmented data by adding contextually appropriate noise to numeric fields.";
    
    case "scaling":
      return baseMessage + 
        "You specialize in scaling numeric data while maintaining realistic proportions and relationships. " +
        "Your task is to generate augmented data by intelligently scaling numeric fields based on domain knowledge.";
    
    case "outliers":
      return baseMessage + 
        "You specialize in generating realistic outliers in datasets. " +
        "Your task is to create plausible but extreme values that could reasonably occur in the given domain.";
    
    case "missing":
      return baseMessage + 
        "You specialize in simulating missing data patterns that reflect real-world scenarios. " +
        "Your task is to intelligently remove values based on realistic missing data mechanisms.";
    
    case "categorical":
      return baseMessage + 
        "You specialize in categorical data augmentation and oversampling. " +
        "Your task is to generate new categorical data variations while maintaining class distributions and semantic validity.";
    
    case "text":
      return baseMessage + 
        "You specialize in text augmentation and generation. " +
        "Your task is to produce variations of text data that preserve meaning while introducing natural diversity.";
    
    default:
      return baseMessage + 
        "You specialize in data augmentation across various data types. " +
        "Your task is to generate augmented data based on the provided samples and instructions.";
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
  
  // Add sample data
  message += `\nHere are sample records from my dataset:\n`;
  message += JSON.stringify(samples, null, 2);
  
  // Add custom AI prompt if provided
  if (options.aiPrompt && options.aiPrompt.trim() !== '') {
    message += `\n\nAdditional requirements: ${options.aiPrompt}\n`;
  }
  
  // Add specific instructions based on method
  message += `\nPlease generate ${samples.length * 2} augmented records that follow these instructions and maintain the structure of the original data.`;
  message += `\nReturn ONLY a JSON array with the augmented data. No explanations or additional text.`;
  
  return message;
};

// Apply a specific augmentation method
export const applyAugmentation = async (
  apiKey: string | null,
  data: any[],
  method: string,
  settings: any,
  aiPrompt?: string
): Promise<any[]> => {
  // Extract the relevant fields based on settings and method
  const options: AugmentationOptions = {
    method,
    intensity: getIntensityForMethod(method, settings),
    fields: getFieldsForMethod(method, settings),
    distribution: method === 'noise' ? settings.noise.distribution : undefined,
    aiPrompt
  };
  
  return augmentDataWithAI(apiKey, data, options);
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
