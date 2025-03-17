import { SchemaFieldType } from './fileTypes';

export interface DataTypeResult {
  type: 'timeseries' | 'categorical' | 'tabular' | 'unknown';
  confidence: number;
  timeColumn?: string;
  valueColumns?: string[];
  categoricalColumns?: string[];
}

export const detectDataType = (data: any[]): DataTypeResult => {
  if (!data || data.length === 0) {
    return { 
      type: 'unknown', 
      confidence: 0 
    };
  }

  let hasTimeColumn = false;
  let timeColumn = '';
  const potentialTimeColumns: string[] = [];
  const valueColumns: string[] = [];
  const categoricalColumns: string[] = [];

  // Check the first row to identify column types
  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  // Check each column to determine if it's a time, value, or categorical column
  columns.forEach(column => {
    // Sample some values for type detection
    const sampleValues = data.slice(0, Math.min(10, data.length)).map(row => row[column]);
    
    // Check if column might be a date/time
    const timeRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/;
    const isTimeFormat = sampleValues.some(val => typeof val === 'string' && timeRegex.test(val as string));
    
    if (isTimeFormat || column.toLowerCase().includes('date') || column.toLowerCase().includes('time')) {
      hasTimeColumn = true;
      potentialTimeColumns.push(column);
      timeColumn = timeColumn || column; // Use the first detected time column as default
    }
    // Check if column is numeric (likely a value column)
    else if (sampleValues.every(val => !isNaN(Number(val)) && val !== null)) {
      valueColumns.push(column);
    }
    // Otherwise, it's categorical
    else {
      categoricalColumns.push(column);
    }
  });

  // Determine the most likely time column
  if (potentialTimeColumns.length > 0) {
    // Prefer columns with "date" or "time" in the name
    const dateNamedColumns = potentialTimeColumns.filter(
      col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time')
    );
    
    if (dateNamedColumns.length > 0) {
      timeColumn = dateNamedColumns[0];
    } else {
      timeColumn = potentialTimeColumns[0];
    }
  }

  // Determine the data type
  if (hasTimeColumn && valueColumns.length > 0) {
    return {
      type: 'timeseries',
      confidence: 0.9,
      timeColumn,
      valueColumns,
      categoricalColumns
    };
  } else if (categoricalColumns.length > valueColumns.length) {
    return {
      type: 'categorical',
      confidence: 0.7,
      categoricalColumns,
      valueColumns
    };
  } else {
    return {
      type: 'tabular',
      confidence: 0.8,
      valueColumns,
      categoricalColumns
    };
  }
};

// Function to generate a schema from data
export const generateSchema = (data: any[]): Record<string, SchemaFieldType> => {
  if (!data || data.length === 0) {
    return {};
  }
  
  const schema: Record<string, SchemaFieldType> = {};
  const sample = data[0];
  
  Object.entries(sample).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      schema[key] = 'string'; // Default for null values
      return;
    }
    
    const type = typeof value;
    
    if (type === 'string') {
      // Check for date format
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d{3}Z)?)?$/.test(value as string)) {
        schema[key] = 'date';
      } 
      // Check for email format
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) {
        schema[key] = 'email';
      } 
      // Check for phone format
      else if (/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value as string)) {
        schema[key] = 'phone';
      }
      else {
        schema[key] = 'string';
      }
    } else if (type === 'number') {
      // Check if it's an integer
      schema[key] = Number.isInteger(value) ? 'integer' : 'float';
    } else if (type === 'boolean') {
      schema[key] = 'boolean';
    } else if (Array.isArray(value)) {
      schema[key] = 'array';
    } else if (type === 'object') {
      schema[key] = 'object';
    } else {
      schema[key] = 'string'; // Default fallback
    }
  });
  
  return schema;
};
