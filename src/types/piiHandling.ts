
// Type definitions for PII handling functionality

export type MaskingMethod = 'redact' | 'hash' | 'partial' | 'tokenize' | 'synthetic';

export type MaskingTechnique = {
  method: MaskingMethod;
  options?: {
    preserveFormat?: boolean;
    showPartial?: number;
  };
};

export type EncryptionMethod = 'aes-256' | 'sha-256' | 'md5';

export interface FieldMaskingConfig {
  enabled: boolean;
}

export interface PerFieldMaskingOptions {
  [fieldName: string]: FieldMaskingConfig;
}

export interface AddFieldParams {
  name: string;
  type: string;
}

// New type definitions for enhanced prompt-based masking
export interface PromptBasedMasking {
  prompt: string;
  preserveFormat: boolean;
}

export interface MaskingPattern {
  original: string;
  masked: string;
  pattern: string;
}

export interface FieldMaskingPattern {
  [fieldName: string]: MaskingPattern[];
}

// Types for PII data
export interface PiiData {
  id: string;
  [key: string]: string | number | boolean;
}

export interface PiiMaskingOptions {
  aiPrompt?: string;
  preserveFormat?: boolean;
  methods?: Record<string, MaskingMethod>;
}

export interface PiiDataMasked extends PiiData {
  [key: string]: string | number | boolean;
}
