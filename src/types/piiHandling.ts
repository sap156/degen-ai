
// Field masking configuration
export interface FieldMaskingConfig {
  enabled: boolean;
  technique?: string; // Add technique property to match piiHandlingService
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
