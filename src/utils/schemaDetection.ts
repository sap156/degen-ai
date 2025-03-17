/**
 * Utilities for schema detection and validation
 */

/**
 * Validates a schema format before processing
 * @param schema The schema to validate
 */
export const validateSchema = (schema: Record<string, string | Record<string, any>>): void => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new Error('Schema must be a non-array object');
  }
  
  // Check if schema has at least one property
  if (Object.keys(schema).length === 0) {
    throw new Error('Schema cannot be empty');
  }
  
  // Validate each field
  Object.entries(schema).forEach(([key, value]) => {
    if (!key || typeof key !== 'string') {
      throw new Error('Field names must be non-empty strings');
    }
    
    if (typeof value !== 'string' && typeof value !== 'object') {
      throw new Error(`Field "${key}" has invalid type definition`);
    }
  });
};

/**
 * Prepares a schema for AI processing
 * @param schema The schema to prepare
 * @returns A simplified schema ready for AI consumption
 */
export const prepareSchemaForAI = (schema: Record<string, string | Record<string, any>>): Record<string, any> => {
  const preparedSchema: Record<string, any> = {};
  
  Object.entries(schema).forEach(([field, definition]) => {
    if (typeof definition === 'string') {
      // For simple string type definitions
      preparedSchema[field] = { type: definition };
    } else if (typeof definition === 'object') {
      // Keep complex definitions as they are
      preparedSchema[field] = definition;
    }
  });
  
  return preparedSchema;
};
