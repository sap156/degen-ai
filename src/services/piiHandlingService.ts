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
  technique: MaskingTechnique;
  customPrompt?: string;
  encryptionMethod?: EncryptionMethod;
}

export interface PerFieldMaskingOptions {
  [fieldName: string]: FieldMaskingConfig;
}

export interface AiMaskingOptions {
  useAi: boolean;
  maskingPrompt?: string;
  preserveFormat?: boolean;
  randomizationLevel?: 'low' | 'medium' | 'high';
  maskingTechnique?: MaskingTechnique;
  encryptionMethod?: EncryptionMethod;
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

// Enhanced masking functions for different PII types with AI support
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
    const parts = value.split('/');
    return `**/${parts[1]}/${parts[2].slice(-2)}`;
  }
};

// Apply masking based on selected options with enhanced AI capabilities and per-field techniques
export const maskPiiData = async (
  data: PiiData[], 
  perFieldMaskingOptions: PerFieldMaskingOptions,
  globalOptions?: {
    preserveFormat?: boolean;
    randomizationLevel?: 'low' | 'medium' | 'high';
  },
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
    
    const sampleData = data.slice(0, Math.min(5, data.length));
    
    // Group fields by technique for batch processing
    const fieldsByTechnique: Record<MaskingTechnique, {
      fields: string[],
      customPrompts: Record<string, string>
    }> = {
      'character-masking': { fields: [], customPrompts: {} },
      'truncation': { fields: [], customPrompts: {} },
      'tokenization': { fields: [], customPrompts: {} },
      'encryption': { fields: [], customPrompts: {} },
      'redaction': { fields: [], customPrompts: {} },
      'synthetic-replacement': { fields: [], customPrompts: {} }
    };
    
    // Organize fields by technique
    Object.entries(perFieldMaskingOptions).forEach(([field, config]) => {
      if (config.enabled) {
        fieldsByTechnique[config.technique].fields.push(field);
        if (config.customPrompt) {
          fieldsByTechnique[config.technique].customPrompts[field] = config.customPrompt;
        }
      }
    });
    
    // Process each technique group
    let aiMaskedData: PiiDataMasked[] = [];
    
    for (const [technique, { fields, customPrompts }] of Object.entries(fieldsByTechnique)) {
      if (fields.length === 0) continue;
      
      const techniquePrompts = Object.entries(customPrompts)
        .map(([field, prompt]) => `For ${field}: ${prompt}`)
        .join("\n");
      
      const basePrompt = getTechniquePrompt(technique as MaskingTechnique);
      const combinedPrompt = basePrompt + (techniquePrompts ? `\n\nCustom field instructions:\n${techniquePrompts}` : '');

      const techniqueResult = await generateMaskedDataWithAI(
        apiKey,
        sampleData,
        fields as Array<keyof Omit<PiiData, 'id'>>,
        {
          preserveFormat: globalOptions?.preserveFormat || true,
          randomizationLevel: globalOptions?.randomizationLevel || 'medium',
          customPrompt: combinedPrompt
        }
      );
      
      // Merge results
      if (aiMaskedData.length === 0) {
        aiMaskedData = techniqueResult;
      } else {
        // Merge the results from this technique with existing results
        aiMaskedData = aiMaskedData.map((item, idx) => ({
          ...item,
          ...techniqueResult[idx]
        }));
      }
    }
    
    // Combine AI-masked sample data with standard masking for the rest
    return data.map((item, index) => {
      const maskedItem: Partial<PiiDataMasked> = { id: item.id };
      
      Object.keys(item).forEach(key => {
        if (key === 'id') {
          maskedItem[key] = item[key];
          return;
        }
        
        const config = perFieldMaskingOptions[key];
        
        if (config?.enabled) {
          if (index < aiMaskedData.length) {
            maskedItem[key] = aiMaskedData[index][key] || standardMaskingFunctions[key as keyof typeof standardMaskingFunctions]?.(item[key]) || item[key];
          } else {
            // For items beyond the AI-processed sample, use standard masking
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

// Get appropriate prompt based on masking technique
const getTechniquePrompt = (technique: MaskingTechnique): string => {
  switch (technique) {
    case 'character-masking':
      return "Replace characters while maintaining recognizability. Leave some characters visible (like first/last letter) to maintain usability.";
    case 'truncation':
      return "Intelligently truncate data while maintaining usability. Keep essential parts and replace others with appropriate masking characters.";
    case 'tokenization':
      return "Replace sensitive data with consistent token identifiers that maintain the same format but aren't reversible to the original data.";
    case 'encryption':
      return "Apply encryption-style transformations that completely change the appearance of the data while maintaining consistency.";
    case 'redaction':
      return "Completely redact sensitive parts while keeping the structure. Replace with standard placeholders (e.g., [REDACTED]).";
    case 'synthetic-replacement':
      return "Generate realistic but fictional replacements that maintain the data's utility for analysis but contain no actual PII.";
    default:
      return "Mask the data while maintaining its usability and format.";
  }
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
        maskedItem[key] = standardMaskingFunctions[key as keyof typeof standardMaskingFunctions]?.(item[key]) || item[key];
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
