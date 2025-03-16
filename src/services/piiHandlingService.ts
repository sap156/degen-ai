import { analyzePiiWithAI, generateMaskedDataWithAI } from "./openAiService";

export interface PiiData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  ssn: string;
  address: string;
  creditCard: string;
  dob: string;
  [key: string]: string; // Allow for additional dynamic fields
}

export type PiiDataMasked = {
  [K in keyof PiiData]: string;
};

export type MaskingOptions = {
  [K in keyof Omit<PiiData, 'id'>]: boolean;
};

export interface FieldMaskingConfig {
  enabled: boolean;
}

export interface PerFieldMaskingOptions {
  [fieldName: string]: FieldMaskingConfig;
}

export interface AiMaskingOptions {
  aiPrompt?: string;
  preserveFormat?: boolean;
}

export type MaskingTechnique = 
  | 'character-masking'
  | 'truncation'
  | 'tokenization'
  | 'encryption'
  | 'redaction'
  | 'synthetic-replacement';

export type EncryptionMethod = 
  | 'aes-256'
  | 'rsa'
  | 'sha-256'
  | 'md5'
  | 'base64'
  | 'ai-recommended';

export interface PiiAnalysisResult {
  identifiedPii: string[];
  suggestions: string;
}

// Generate sample PII data for demonstration
export const generateSamplePiiData = (count: number = 10): PiiData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    firstName: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'][Math.floor(Math.random() * 6)],
    lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'][Math.floor(Math.random() * 6)],
    email: `user${i + 1}@example.com`,
    phoneNumber: `(${Math.floor(Math.random() * 900) + 100})-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    ssn: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: `${Math.floor(Math.random() * 9000) + 1000} Main St, Anytown, ST ${Math.floor(Math.random() * 90000) + 10000}`,
    creditCard: `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
    dob: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${Math.floor(Math.random() * 40) + 1960}`,
  }));
};

// Standard masking functions for fallback when AI is not available
const standardMaskingFunctions = {
  firstName: (value: string) => value.charAt(0) + '*'.repeat(value.length - 1),
  lastName: (value: string) => value.charAt(0) + '*'.repeat(value.length - 1),
  email: (value: string) => {
    const [name, domain] = value.split('@');
    return `${name.charAt(0)}${'*'.repeat(name.length - 1)}@${domain}`;
  },
  phoneNumber: (value: string) => {
    const lastFour = value.slice(-4);
    return `***-***-${lastFour}`;
  },
  ssn: () => '***-**-****',
  address: (value: string) => {
    const parts = value.split(' ');
    const number = parts[0];
    return `${number} ${'*'.repeat(value.length - number.length - 1)}`;
  },
  creditCard: (value: string) => {
    const lastFour = value.slice(-4);
    return `****-****-****-${lastFour}`;
  },
  dob: (value: string) => {
    // Handle different date formats
    if (!value) return '**/**/****';
    
    const parts = value.split(/[\/\-]/);
    if (parts.length < 3) return '*'.repeat(value.length);
    
    return `**/${parts[1]}/${parts[2].slice(-2)}`;
  }
};

// Apply masking based on selected options with enhanced AI capabilities
export const maskPiiData = async (
  data: PiiData[], 
  perFieldMaskingOptions: PerFieldMaskingOptions,
  options?: AiMaskingOptions,
  apiKey?: string | null
): Promise<PiiDataMasked[]> => {
  if (!apiKey) {
    return applyStandardMasking(data, perFieldMaskingOptions);
  }

  try {
    const fieldsToMask = Object.entries(perFieldMaskingOptions)
      .filter(([_, config]) => config.enabled)
      .map(([field]) => field);
    
    if (fieldsToMask.length === 0) {
      return data.map(item => ({...item})) as PiiDataMasked[];
    }
    
    // Use the first 5 records for AI to learn patterns
    const sampleData = data.slice(0, Math.min(5, data.length));
    
    // Prepare AI prompt
    const aiPrompt = options?.aiPrompt || 
      "Mask the selected fields while maintaining their format and ensuring data privacy.";
    
    // Process sample data with AI
    const aiMaskedSampleData = await generateMaskedDataWithAI(
      apiKey,
      sampleData,
      fieldsToMask as Array<keyof Omit<PiiData, 'id'>>,
      {
        preserveFormat: options?.preserveFormat !== undefined ? options.preserveFormat : true,
        customPrompt: aiPrompt
      }
    );
    
    // Apply the masking to ALL records, not just the sample
    return data.map((item) => {
      const maskedItem: Partial<PiiDataMasked> = { id: item.id };
      
      Object.keys(item).forEach(key => {
        if (key === 'id') {
          maskedItem[key] = item[key];
          return;
        }
        
        const config = perFieldMaskingOptions[key];
        
        if (config?.enabled) {
          // Find a similar pattern from the AI-processed sample data
          const similarRecord = aiMaskedSampleData.find(sample => 
            // Try to find a sample with similar characteristics
            sample[key] !== undefined && item[key] && 
            (
              // Match by length or pattern if possible
              sample[key].length === item[key].length ||
              item[key].charAt(0) === sample[key].charAt(0)
            )
          );
          
          if (similarRecord && similarRecord[key]) {
            // If we found a similar record, apply similar masking pattern
            maskedItem[key] = applyMaskingPattern(item[key], similarRecord[key]);
          } else {
            // Fallback to standard masking if no good pattern is found
            maskedItem[key] = standardMaskingFunctions[key as keyof typeof standardMaskingFunctions]?.(item[key]) || item[key];
          }
        } else {
          maskedItem[key] = item[key];
        }
      });
      
      return maskedItem as PiiDataMasked;
    });
  } catch (error) {
    console.error("Error applying AI masking:", error);
    return applyStandardMasking(data, perFieldMaskingOptions);
  }
};

// Helper function to apply a masking pattern from a sample to a target string
const applyMaskingPattern = (original: string, sample: string): string => {
  if (!original) return sample;
  
  // If lengths match, try to copy the pattern exactly
  if (original.length === sample.length) {
    // Create a new string that follows the masking pattern but preserves key characteristics
    return sample;
  }
  
  // For different lengths, try to apply the general pattern
  // E.g., if sample is "J*** D**", we want to keep first characters and mask the rest
  
  // Simple case: if sample uses asterisks, replicate that pattern
  if (sample.includes('*')) {
    // Count visible characters
    const visibleChars = sample.split('').filter(c => c !== '*');
    let result = '';
    let originalIndex = 0;
    let asteriskCount = 0;
    
    // Walk through sample and apply the pattern
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === '*') {
        result += '*';
        asteriskCount++;
      } else if (originalIndex < original.length) {
        result += original[originalIndex++];
      } else {
        result += sample[i];
      }
    }
    
    // Adjust for length differences
    if (original.length > result.length) {
      result += '*'.repeat(original.length - result.length);
    }
    
    return result;
  }
  
  // If no clear pattern, default to standard masking
  const key = Object.keys(standardMaskingFunctions).find(k => 
    sample.toLowerCase().includes(k.toLowerCase())
  );
  
  if (key && standardMaskingFunctions[key as keyof typeof standardMaskingFunctions]) {
    return standardMaskingFunctions[key as keyof typeof standardMaskingFunctions](original);
  }
  
  // Last resort: keep first char, mask the rest
  return original.charAt(0) + '*'.repeat(original.length - 1);
};

// Helper function to apply standard masking
const applyStandardMasking = (data: PiiData[], perFieldMaskingOptions: PerFieldMaskingOptions): PiiDataMasked[] => {
  return data.map(item => {
    const maskedItem: Partial<PiiDataMasked> = { id: item.id };
    
    Object.keys(item).forEach(key => {
      if (key === 'id') {
        maskedItem[key] = item[key];
        return;
      }
      
      const config = perFieldMaskingOptions[key];
      
      if (config?.enabled) {
        // Use standard masking function if available, otherwise create a default one
        if (standardMaskingFunctions[key as keyof typeof standardMaskingFunctions]) {
          maskedItem[key] = standardMaskingFunctions[key as keyof typeof standardMaskingFunctions](item[key]);
        } else if (item[key]) {
          // Default masking for unknown fields: keep first character, mask the rest
          maskedItem[key] = item[key].charAt(0) + '*'.repeat(item[key].length - 1);
        } else {
          maskedItem[key] = item[key]; // If empty, keep as is
        }
      } else {
        maskedItem[key] = item[key];
      }
    });
    
    return maskedItem as PiiDataMasked;
  });
};

// Analyze PII data using AI
export const analyzePiiData = async (data: PiiData[], apiKey: string | null): Promise<PiiAnalysisResult> => {
  if (!apiKey) {
    return {
      identifiedPii: ["Unable to analyze - API key not set"],
      suggestions: "Please set up your OpenAI API key to use AI-powered PII analysis."
    };
  }
  
  try {
    const sampleData = JSON.stringify(data.slice(0, 3), null, 2);
    
    return await analyzePiiWithAI(apiKey, sampleData);
    
  } catch (error) {
    console.error("Error analyzing PII data:", error);
    return {
      identifiedPii: ["Error during analysis"],
      suggestions: "An error occurred while analyzing the data. Please try again later."
    };
  }
};

// Export data as JSON
export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

// Export data as CSV
export const exportAsCsv = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

// Download data as a file
export const downloadData = (data: string, filename: string, type: 'json' | 'csv'): void => {
  const blob = new Blob([data], { type: type === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
