import { DetectedPiiField, PiiDetectionResult } from '@/types/piiHandling';
import { analyzePiiWithAI, detectPiiFields, generateMaskedDataWithAI } from "./openAiService";

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

// Enhanced masking pattern cache to ensure consistency
const maskingPatternCache: Record<string, Record<string, (value: string) => string>> = {};

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
    
    // Use more sample data for consistent pattern learning
    const sampleSize = Math.min(10, data.length);
    const sampleData = data.slice(0, sampleSize);
    
    // Add precise instruction enhancement to the AI prompt
    const aiPrompt = options?.aiPrompt || 
      "Mask the selected fields while maintaining data format and ensuring privacy.";
    
    // Enhance the prompt with field-specific instructions
    const enhancedPrompt = `
${aiPrompt}

IMPORTANT REQUIREMENTS:
1. Apply EXACTLY THE SAME masking pattern to the same field across ALL records
2. For each field type, use a consistent masking approach
3. Preserve the format (length, special characters) of each field
4. If specific masking is mentioned for a field, apply ONLY that technique
5. Generate realistic but privacy-preserving masked data
6. Do not add new fields or remove existing fields`;
    
    // Process sample data with AI
    const aiMaskedSampleData = await generateMaskedDataWithAI(
      apiKey,
      sampleData,
      fieldsToMask,
      {
        preserveFormat: options?.preserveFormat !== undefined ? options.preserveFormat : true,
        customPrompt: enhancedPrompt
      }
    );
    
    // Extract and cache masking patterns from AI sample results
    const patternKey = JSON.stringify({ 
      fields: fieldsToMask.sort(), 
      prompt: enhancedPrompt
    });
    
    if (!maskingPatternCache[patternKey]) {
      maskingPatternCache[patternKey] = {};
      
      // For each field, extract a consistent masking function from the AI results
      fieldsToMask.forEach(field => {
        const patterns: Array<[string, string]> = [];
        
        // Collect original-to-masked pairs for this field
        sampleData.forEach((original, index) => {
          if (aiMaskedSampleData[index] && original[field] && aiMaskedSampleData[index][field]) {
            patterns.push([original[field], aiMaskedSampleData[index][field]]);
          }
        });
        
        // Generate a masking function for this field
        if (patterns.length > 0) {
          maskingPatternCache[patternKey][field] = (value: string) => {
            // Find the most similar pattern in our examples
            let bestMatch = patterns[0];
            let bestSimilarity = 0;
            
            for (const [orig, masked] of patterns) {
              const similarity = calculateSimilarity(value, orig);
              if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = [orig, masked];
              }
            }
            
            // Apply the masking pattern
            return applyConsistentMasking(value, bestMatch[0], bestMatch[1]);
          };
        } else {
          // Fallback to standard masking if no patterns were found
          maskingPatternCache[patternKey][field] = 
            standardMaskingFunctions[field as keyof typeof standardMaskingFunctions] || 
            ((val: string) => val.charAt(0) + '*'.repeat(val.length - 1));
        }
      });
    }
    
    // Apply the cached masking patterns to ALL records
    return data.map((item) => {
      const maskedItem: Partial<PiiDataMasked> = { id: item.id };
      
      Object.keys(item).forEach(key => {
        if (key === 'id') {
          maskedItem[key] = item[key];
          return;
        }
        
        const config = perFieldMaskingOptions[key];
        
        if (config?.enabled && maskingPatternCache[patternKey][key]) {
          maskedItem[key] = maskingPatternCache[patternKey][key](item[key]);
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

// Calculate similarity between two strings for better pattern matching
const calculateSimilarity = (str1: string, str2: string): number => {
  // Length similarity
  const lengthSim = 1 - Math.abs(str1.length - str2.length) / Math.max(str1.length, str2.length);
  
  // Character type similarity (digit, letter, special char)
  let typeSim = 0;
  const minLength = Math.min(str1.length, str2.length);
  
  for (let i = 0; i < minLength; i++) {
    const char1 = str1.charAt(i);
    const char2 = str2.charAt(i);
    
    const isDigit1 = /\d/.test(char1);
    const isDigit2 = /\d/.test(char2);
    const isLetter1 = /[a-zA-Z]/.test(char1);
    const isLetter2 = /[a-zA-Z]/.test(char2);
    
    if ((isDigit1 && isDigit2) || (isLetter1 && isLetter2) || 
        (!isDigit1 && !isDigit1 && !isDigit2 && !isLetter2)) {
      typeSim++;
    }
  }
  
  typeSim /= minLength || 1;
  
  // Format similarity (patterns of digits, letters, and special chars)
  const format1 = str1.replace(/[0-9]/g, 'D').replace(/[a-zA-Z]/g, 'L').replace(/[^0-9a-zA-Z]/g, 'S');
  const format2 = str2.replace(/[0-9]/g, 'D').replace(/[a-zA-Z]/g, 'L').replace(/[^0-9a-zA-Z]/g, 'S');
  
  let formatSim = 0;
  for (let i = 0; i < minLength; i++) {
    if (format1.charAt(i) === format2.charAt(i)) {
      formatSim++;
    }
  }
  
  formatSim /= minLength || 1;
  
  // Combine all factors, weighting format similarity highest
  return (lengthSim * 0.3) + (typeSim * 0.3) + (formatSim * 0.4);
};

// Apply a consistent masking pattern based on a pattern example
const applyConsistentMasking = (value: string, originalExample: string, maskedExample: string): string => {
  if (!value) return maskedExample;
  
  // Special handling for full replacements
  if (originalExample.length > 0 && 
      maskedExample.length > 0 && 
      !originalExample.split('').some(char => maskedExample.includes(char))) {
    // Complete replacement, likely synthetic data
    return maskedExample;
  }
  
  // Pattern detection for character masking
  const pattern: Array<'keep' | 'mask' | 'special'> = [];
  
  for (let i = 0; i < originalExample.length; i++) {
    const origChar = originalExample.charAt(i);
    const maskChar = i < maskedExample.length ? maskedExample.charAt(i) : '*';
    
    if (origChar === maskChar) {
      pattern.push('keep');
    } else if (maskChar === '*' || maskChar === 'X' || maskChar === '#') {
      pattern.push('mask');
    } else {
      pattern.push('special');
    }
  }
  
  // Apply the detected pattern to the new value
  let result = '';
  
  for (let i = 0; i < value.length; i++) {
    const patternIndex = Math.min(i, pattern.length - 1);
    const patternType = pattern[patternIndex];
    
    if (patternType === 'keep') {
      result += value.charAt(i);
    } else if (patternType === 'mask') {
      const maskChar = patternIndex < maskedExample.length ? maskedExample.charAt(patternIndex) : '*';
      result += maskChar;
    } else {
      // For special replacement, use the character from masked example
      const specialChar = patternIndex < maskedExample.length ? maskedExample.charAt(patternIndex) : '*';
      result += specialChar;
    }
  }
  
  // Handle length differences
  if (result.length < value.length) {
    result += maskedExample.slice(result.length) || '*'.repeat(value.length - result.length);
  }
  
  return result;
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

// Enhanced PII detection using AI
export const detectPiiInData = async (data: PiiData[], apiKey: string | null): Promise<PiiDetectionResult> => {
  if (!apiKey || data.length === 0) {
    // Create a reasonable fallback when API key is missing or data is empty
    const fallbackFields = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id') : [];
    
    // Generate potential PII fields based on common field names
    const potentialPiiFields: DetectedPiiField[] = [];
    
    if (data.length > 0) {
      const commonPiiPatterns: Record<string, { confidence: 'high' | 'medium' | 'low', technique: MaskingTechnique }> = {
        // Names
        name: { confidence: 'high', technique: 'character-masking' },
        first: { confidence: 'high', technique: 'character-masking' },
        last: { confidence: 'high', technique: 'character-masking' },
        // Contact
        email: { confidence: 'high', technique: 'character-masking' },
        phone: { confidence: 'high', technique: 'character-masking' },
        mobile: { confidence: 'high', technique: 'character-masking' },
        // Location
        address: { confidence: 'high', technique: 'redaction' },
        street: { confidence: 'high', technique: 'redaction' },
        city: { confidence: 'medium', technique: 'redaction' },
        zip: { confidence: 'high', technique: 'character-masking' },
        postal: { confidence: 'high', technique: 'character-masking' },
        // IDs
        ssn: { confidence: 'high', technique: 'character-masking' },
        social: { confidence: 'high', technique: 'character-masking' },
        license: { confidence: 'high', technique: 'character-masking' },
        passport: { confidence: 'high', technique: 'character-masking' },
        // Financial
        card: { confidence: 'high', technique: 'character-masking' },
        credit: { confidence: 'high', technique: 'character-masking' },
        account: { confidence: 'high', technique: 'character-masking' },
        // Date of birth
        birth: { confidence: 'high', technique: 'character-masking' },
        dob: { confidence: 'high', technique: 'character-masking' }
      };
      
      // Check each field in the data for potential PII
      Object.keys(data[0]).forEach(fieldName => {
        if (fieldName === 'id') return;
        
        const fieldLower = fieldName.toLowerCase();
        
        // Check if field name contains common PII patterns
        for (const [pattern, details] of Object.entries(commonPiiPatterns)) {
          if (fieldLower.includes(pattern)) {
            potentialPiiFields.push({
              fieldName: fieldName,
              confidence: details.confidence,
              suggestedMaskingTechnique: details.technique,
              examples: data.slice(0, 2).map(item => item[fieldName]).filter(Boolean)
            });
            break;
          }
        }
        
        // If not matched by name, check if data looks like PII
        // This is a very simplified check - in a real system you'd want more sophisticated pattern matching
        if (!potentialPiiFields.some(f => f.fieldName === fieldName)) {
          const sampleValues = data.slice(0, 5).map(item => item[fieldName]).filter(Boolean);
          
          // Check for email pattern
          if (sampleValues.some(val => typeof val === 'string' && val.includes('@'))) {
            potentialPiiFields.push({
              fieldName: fieldName,
              confidence: 'medium',
              suggestedMaskingTechnique: 'character-masking',
              examples: sampleValues.slice(0, 2)
            });
          }
          // Check for phone pattern (simplified)
          else if (sampleValues.some(val => typeof val === 'string' && /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(val))) {
            potentialPiiFields.push({
              fieldName: fieldName,
              confidence: 'medium',
              suggestedMaskingTechnique: 'character-masking',
              examples: sampleValues.slice(0, 2)
            });
          }
        }
      });
    }
    
    return {
      detectedFields: potentialPiiFields,
      suggestedPrompt: potentialPiiFields.length > 0 
        ? "Mask sensitive fields while preserving format. Replace characters with asterisks except for first/last characters where appropriate."
        : "Please select fields to mask manually or set your OpenAI API key for AI-powered PII detection.",
      undetectedFields: fallbackFields.filter(f => !potentialPiiFields.some(pf => pf.fieldName === f))
    };
  }
  
  try {
    // Use a sample of the data for detection
    const sampleSize = Math.min(5, data.length);
    const sampleData = data.slice(0, sampleSize);
    
    // Use the OpenAI API to detect PII fields
    const detectionResult = await detectPiiFields(apiKey, sampleData);
    
    // If the OpenAI detection didn't return the expected format, prepare a fallback
    if (!detectionResult.detectedFields || detectionResult.detectedFields.length === 0) {
      // Create a basic detection result based on field names
      const potentialPiiFields: DetectedPiiField[] = [];
      
      if (data.length > 0) {
        Object.keys(data[0]).filter(k => k !== 'id').forEach(fieldName => {
          const fieldLower = fieldName.toLowerCase();
          
          // Check for common PII patterns in field names
          if (fieldLower.includes('name') || fieldLower.includes('email') || 
              fieldLower.includes('phone') || fieldLower.includes('address') ||
              fieldLower.includes('ssn') || fieldLower.includes('birth') ||
              fieldLower.includes('dob') || fieldLower.includes('card')) {
            
            const technique: MaskingTechnique = 
              fieldLower.includes('address') ? 'redaction' : 'character-masking';
            
            potentialPiiFields.push({
              fieldName: fieldName,
              confidence: 'medium',
              suggestedMaskingTechnique: technique,
              examples: data.slice(0, 2).map(item => item[fieldName])
            });
          }
        });
      }
      
      return {
        detectedFields: potentialPiiFields,
        suggestedPrompt: "Mask sensitive PII fields while preserving the overall data format.",
        undetectedFields: data.length > 0 
          ? Object.keys(data[0]).filter(k => k !== 'id' && !potentialPiiFields.some(f => f.fieldName === k))
          : []
      };
    }
    
    return detectionResult;
  } catch (error) {
    console.error("Error detecting PII in data:", error);
    
    // Create a basic fallback based on field names
    const fallbackFields = data.length > 0 
      ? Object.keys(data[0]).filter(k => k !== 'id').map(fieldName => {
          return {
            fieldName,
            confidence: 'low' as const,
            suggestedMaskingTechnique: 'character-masking' as MaskingTechnique,
            examples: data.slice(0, 2).map(item => item[fieldName])
          };
        })
      : [];
    
    return {
      detectedFields: fallbackFields,
      suggestedPrompt: "An error occurred during PII detection. Manually select fields containing personal information to mask.",
      undetectedFields: []
    };
  }
};

// Improve generateMaskingSuggestions function to provide better suggestions
export const generateMaskingSuggestions = (fieldName: string, sampleValues: string[]): string => {
  // Simple rules-based suggestions
  const fieldNameLower = fieldName.toLowerCase();
  
  // First check if we have sample values to analyze
  if (sampleValues.length > 0) {
    const firstValue = String(sampleValues[0] || '');
    
    // Check for email pattern
    if (firstValue.includes('@') || fieldNameLower.includes('email')) {
      return "Mask the username portion of email addresses but keep the domain (e.g., ****@example.com).";
    } 
    
    // Check for phone number pattern (simplified)
    else if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(firstValue) || fieldNameLower.includes('phone')) {
      return "Mask all digits except the last 4 (e.g., (XXX) XXX-1234).";
    } 
    
    // Check for SSN pattern
    else if (/\d{3}-\d{2}-\d{4}/.test(firstValue) || fieldNameLower.includes('ssn')) {
      return "Fully mask except for last 4 digits (e.g., XXX-XX-1234).";
    } 
    
    // Check for credit card pattern
    else if (/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/.test(firstValue) || 
             fieldNameLower.includes('credit') || fieldNameLower.includes('card')) {
      return "Replace digits with X except the last 4 (e.g., XXXX-XXXX-XXXX-1234).";
    }
  }
  
  // If no pattern detected in values, fall back to field name analysis
  if (fieldNameLower.includes('email')) {
    return "Mask the username portion of email addresses but keep the domain (e.g., ****@example.com).";
  } else if (fieldNameLower.includes('phone') || fieldNameLower.includes('mobile')) {
    return "Mask all digits except the last 4 (e.g., (XXX) XXX-1234).";
  } else if (fieldNameLower.includes('ssn') || fieldNameLower.includes('social')) {
    return "Fully mask except for last 4 digits (e.g., XXX-XX-1234).";
  } else if (fieldNameLower.includes('credit') || fieldNameLower.includes('card') || fieldNameLower.includes('cc')) {
    return "Replace digits with X except the last 4 (e.g., XXXX-XXXX-XXXX-1234).";
  } else if (fieldNameLower.includes('name')) {
    return "Keep first initial, mask the rest (e.g., J*** D**).";
  } else if (fieldNameLower.includes('address')) {
    return "Keep street number, mask street name, keep city and state (e.g., 123 **** St, New York, NY).";
  } else if (fieldNameLower.includes('dob') || fieldNameLower.includes('birth')) {
    return "Keep month and day, mask year (e.g., 01/15/XXXX).";
  } else if (fieldNameLower.includes('zip') || fieldNameLower.includes('postal')) {
    return "Mask all but last two digits (e.g., XXX12).";
  } else {
    // Generic suggestion that accounts for the potential PII nature of the field
    return "Consider masking this field if it contains personal information. Typical approach: keep first and last characters, mask the middle (e.g., A***Z).";
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
