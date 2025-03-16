
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
