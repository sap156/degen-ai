
import { MaskingTechnique, EncryptionMethod } from '@/services/piiHandlingService';

export interface FieldMaskingConfig {
  enabled: boolean;
  technique: MaskingTechnique;
  customPrompt?: string;
  encryptionMethod?: EncryptionMethod;
}

export interface PerFieldMaskingOptions {
  [fieldName: string]: FieldMaskingConfig;
}

export interface AddFieldParams {
  name: string;
  type: string;
}
