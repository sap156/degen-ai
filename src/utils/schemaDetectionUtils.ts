
// Import SchemaFieldType from fileTypes instead of fileUploadUtils
import { SchemaFieldType } from './fileTypes';

export const detectFieldType = (value: any): SchemaFieldType => {
  if (value === null || value === undefined) {
    return 'string'; // Default for null/undefined
  }
  
  const type = typeof value;
  
  switch (type) {
    case 'boolean':
      return 'boolean';
      
    case 'number':
      return Number.isInteger(value) ? 'integer' : 'float';
      
    case 'string':
      // Check for date
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d{3}Z)?)?$/.test(value)) {
        return 'date';
      }
      
      // Check for email
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'email';
      }
      
      // Check for phone format
      if (/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value)) {
        return 'phone';
      }
      
      // Check for SSN
      if (/^\d{3}-\d{2}-\d{4}$/.test(value)) {
        return 'ssn';
      }
      
      // Check for credit card
      if (/^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/.test(value)) {
        return 'creditcard';
      }
      
      return 'string';
      
    case 'object':
      if (Array.isArray(value)) {
        return 'array';
      }
      return 'object';
      
    default:
      return type as SchemaFieldType;
  }
};

export const inferSchemaFromData = (data: any[]): Record<string, SchemaFieldType> => {
  if (!data || data.length === 0) {
    return {};
  }
  
  const schema: Record<string, SchemaFieldType> = {};
  const sample = data[0];
  
  Object.entries(sample).forEach(([key, value]) => {
    schema[key] = detectFieldType(value);
  });
  
  return schema;
};

export const validateDataAgainstSchema = (
  data: any[], 
  schema: Record<string, SchemaFieldType>
): { valid: boolean; errors: string[] } => {
  if (!data || data.length === 0) {
    return { valid: false, errors: ['No data provided'] };
  }
  
  if (!schema || Object.keys(schema).length === 0) {
    return { valid: false, errors: ['No schema provided'] };
  }
  
  const errors: string[] = [];
  
  data.forEach((item, index) => {
    Object.entries(schema).forEach(([field, expectedType]) => {
      if (!(field in item)) {
        errors.push(`Row ${index + 1}: Missing field "${field}"`);
        return;
      }
      
      const value = item[field];
      if (value === null || value === undefined) {
        return; // Null/undefined values are allowed
      }
      
      const actualType = detectFieldType(value);
      if (actualType !== expectedType) {
        errors.push(`Row ${index + 1}: Field "${field}" expected type "${expectedType}" but got "${actualType}"`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
