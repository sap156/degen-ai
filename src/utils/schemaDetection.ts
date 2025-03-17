
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

/**
 * Generates a schema from sample data
 * @param data Sample data to analyze
 * @returns A generated schema
 */
export const generateSchema = (data: any[]): Record<string, string> => {
  if (!data || !data.length) {
    return {};
  }
  
  const schema: Record<string, string> = {};
  const sampleRecord = data[0];
  
  Object.entries(sampleRecord).forEach(([key, value]) => {
    const type = typeof value;
    if (type === 'string') {
      // Detect date strings
      if (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value as string) || 
        /^\d{4}-\d{2}-\d{2}/.test(value as string)
      ) {
        schema[key] = 'date';
      } else {
        schema[key] = 'string';
      }
    } else if (type === 'number') {
      // Detect integers vs floats
      if (Number.isInteger(value)) {
        schema[key] = 'integer';
      } else {
        schema[key] = 'float';
      }
    } else if (type === 'boolean') {
      schema[key] = 'boolean';
    } else if (value === null) {
      // Try to infer type from other records
      for (let i = 1; i < Math.min(data.length, 10); i++) {
        const alternateValue = data[i][key];
        if (alternateValue !== null) {
          schema[key] = typeof alternateValue;
          break;
        }
      }
      // If still undetermined
      if (!schema[key]) {
        schema[key] = 'string';
      }
    } else if (Array.isArray(value)) {
      schema[key] = 'array';
    } else if (type === 'object') {
      schema[key] = 'object';
    } else {
      schema[key] = 'string'; // Default
    }
  });
  
  return schema;
};

/**
 * Converts a detected schema to SQL CREATE TABLE statement
 * @param schema The schema to convert
 * @param tableName The name for the SQL table
 * @returns SQL CREATE TABLE statement
 */
export const convertSchemaToSql = (schema: Record<string, string>, tableName: string = 'table_name'): string => {
  if (!schema || Object.keys(schema).length === 0) {
    return '';
  }
  
  const typeMap: Record<string, string> = {
    'string': 'TEXT',
    'integer': 'INTEGER',
    'float': 'REAL',
    'number': 'REAL',
    'boolean': 'BOOLEAN',
    'date': 'TIMESTAMP',
    'object': 'JSONB',
    'array': 'JSONB'
  };
  
  const columns = Object.entries(schema).map(([column, type]) => {
    const sqlType = typeMap[type] || 'TEXT';
    return `  "${column}" ${sqlType}`;
  });
  
  // Add id primary key if it doesn't exist
  if (!schema.id && !schema.ID && !schema.Id) {
    columns.unshift('  "id" SERIAL PRIMARY KEY');
  }
  
  return `CREATE TABLE "${tableName}" (\n${columns.join(',\n')}\n);`;
};
