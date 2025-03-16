
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
