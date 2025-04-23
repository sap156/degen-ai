
import { MaskingTechnique, EncryptionMethod } from '@/services/piiHandlingService';

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

// Enhanced prompt-based masking
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

// New type definitions for PII detection
export interface DetectedPiiField {
  fieldName: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedMaskingTechnique: MaskingTechnique;
  examples: string[];
}

export interface PiiDetectionResult {
  detectedFields: DetectedPiiField[];
  suggestedPrompt: string;
  undetectedFields: string[];
}
