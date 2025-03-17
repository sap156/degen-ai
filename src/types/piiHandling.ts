
// Field masking configuration
export type MaskingTechnique = 'replace' | 'redact' | 'hash' | 'truncate' | 'tokenize' | 'pseudonymize';

export interface FieldMaskingConfig {
  enabled: boolean;
  technique: MaskingTechnique; // Make technique required to match service expectations
}

// Per-field masking options
export interface PerFieldMaskingOptions {
  [field: string]: FieldMaskingConfig;
}

// PII data types
export interface PiiData {
  id: string;
  [key: string]: any;
}

export interface PiiDataMasked extends PiiData {
  _masked: boolean;
  _maskedFields?: string[];
}

// Masking options
export interface MaskingOptions {
  aiPrompt?: string;
  preserveFormat?: boolean;
  maskingLevel?: 'low' | 'medium' | 'high';
}

// Analysis result
export interface PiiAnalysisResult {
  identifiedPii: string[];
  suggestions: string;
}
