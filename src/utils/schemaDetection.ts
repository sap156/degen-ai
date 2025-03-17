// Function to prepare schema for AI consumption
export const prepareSchemaForAI = (schema: Record<string, any>): Record<string, string> => {
  const aiSchema: Record<string, string> = {};
  
  Object.entries(schema).forEach(([key, value]) => {
    aiSchema[key] = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
  });
  
  return aiSchema;
};

// Function to validate schema
export const validateSchema = (schema: Record<string, any>): void => {
  if (!schema || typeof schema !== 'object') {
    throw new Error('Invalid schema format');
  }
  
  for (const key in schema) {
    if (typeof key !== 'string') {
      throw new Error('Schema keys must be strings');
    }
    if (typeof schema[key] !== 'string' && typeof schema[key] !== 'object') {
      throw new Error('Schema values must be strings or objects');
    }
  }
};

// Generate a schema from data for SQL usage
export const generateSchema = (data: any[]): Record<string, any> => {
  if (!data || data.length === 0) {
    return {};
  }
  
  const schema: Record<string, any> = {};
  const sample = data[0];
  
  Object.entries(sample).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      schema[key] = { type: 'string' }; // Default for null values
      return;
    }
    
    const type = typeof value;
    
    if (type === 'string') {
      // Check for date format
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d{3}Z)?)?$/.test(value as string)) {
        schema[key] = { type: 'date' };
      } 
      // Check for email format
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
        schema[key] = { type: 'email' };
      } else {
        schema[key] = { type: 'string' };
      }
    } else if (type === 'number') {
      // Check if it's an integer
      schema[key] = { type: Number.isInteger(value) ? 'integer' : 'float' };
    } else if (type === 'boolean') {
      schema[key] = { type: 'boolean' };
    } else if (Array.isArray(value)) {
      schema[key] = { type: 'array' };
    } else if (type === 'object') {
      schema[key] = { type: 'object' };
    } else {
      schema[key] = { type: 'string' }; // Default fallback
    }
  });
  
  return schema;
};

// Convert a schema to SQL statements
export const convertSchemaToSql = (
  schema: Record<string, any>, 
  tableName: string
): string => {
  if (!schema || Object.keys(schema).length === 0) {
    return '';
  }
  
  const sqlTypeMap: Record<string, string> = {
    'string': 'TEXT',
    'integer': 'INTEGER',
    'float': 'REAL',
    'boolean': 'BOOLEAN',
    'date': 'TIMESTAMP',
    'email': 'TEXT',
    'array': 'TEXT',  // Typically stored as JSON string
    'object': 'TEXT'  // Typically stored as JSON string
  };
  
  // Start creating the SQL statement
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  
  // Add each column
  const columns = Object.entries(schema).map(([column, definition]) => {
    const type = (definition as any).type || 'string';
    const sqlType = sqlTypeMap[type] || 'TEXT';
    
    // Check if this column is likely a primary key
    const isPrimaryKey = column.toLowerCase() === 'id' || 
                         column.toLowerCase().endsWith('_id') ||
                         column.toLowerCase() === 'key';
    
    // Add constraints if needed
    const constraints = isPrimaryKey ? ' PRIMARY KEY' : '';
    
    return `  ${column} ${sqlType}${constraints}`;
  });
  
  // Join columns with commas
  sql += columns.join(',\n');
  
  // Close the statement
  sql += '\n);';
  
  return sql;
};
