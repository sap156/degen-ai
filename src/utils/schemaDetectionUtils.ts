
import { SchemaFieldType } from './fileUploadUtils';

/**
 * Utility functions for detecting and analyzing data schemas from uploaded files
 */

/**
 * Extract the most likely time series fields from a dataset
 * @param data The dataset to analyze
 * @returns Object containing detected timestamp and value fields
 */
export const detectTimeSeriesFields = (data: any[]): {
  timestampField: string | null;
  valueFields: string[];
} => {
  if (!data || !data.length) {
    return { timestampField: null, valueFields: [] };
  }
  
  const sample = data[0];
  
  // Possible timestamp field names
  const possibleTimestampFields = [
    'timestamp', 'time', 'date', 'datetime', 'dateTime', 
    'time_stamp', 'time-stamp', 'date_time', 'date-time',
    'created_at', 'updated_at', 'created', 'time_created'
  ];
  
  // Try to find timestamp field
  let timestampField: string | null = null;
  
  // First try common timestamp field names
  for (const field of possibleTimestampFields) {
    if (field in sample && isValidDate(sample[field])) {
      timestampField = field;
      break;
    }
  }
  
  // If not found, look for any field that could be a date
  if (!timestampField) {
    for (const field of Object.keys(sample)) {
      if (isValidDate(sample[field])) {
        timestampField = field;
        break;
      }
    }
  }
  
  // Find numeric fields that could be values
  const valueFields: string[] = [];
  for (const field of Object.keys(sample)) {
    if (field !== timestampField) {
      const value = sample[field];
      if (
        typeof value === 'number' || 
        (typeof value === 'string' && !isNaN(parseFloat(value)))
      ) {
        valueFields.push(field);
      }
    }
  }
  
  return { timestampField, valueFields };
};

/**
 * Check if a value is a valid date
 * @param value The value to check
 * @returns Whether the value is a valid date
 */
export const isValidDate = (value: any): boolean => {
  if (!value) return false;
  
  try {
    if (value instanceof Date) return !isNaN(value.getTime());
    
    if (typeof value === 'string') {
      // Check for ISO date format
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return true;
      
      // Check for other common formats
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)) return true;
      if (/^\d{1,2}-\d{1,2}-\d{4}/.test(value)) return true;
      
      // Try parsing as date
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    
    if (typeof value === 'number') {
      // Check if number could be a timestamp
      const date = value > 10000000000 
        ? new Date(value) 
        : new Date(value * 1000);
      return !isNaN(date.getTime());
    }
  } catch (e) {
    return false;
  }
  
  return false;
};

/**
 * Detect the time interval between data points
 * @param timestamps Array of timestamps to analyze
 * @returns The detected interval or undefined
 */
export const detectTimeInterval = (
  timestamps: Date[]
): 'hourly' | 'daily' | 'weekly' | 'monthly' | undefined => {
  if (timestamps.length < 2) return undefined;
  
  // Sort dates chronologically
  timestamps.sort((a, b) => a.getTime() - b.getTime());
  
  // Calculate average difference between consecutive timestamps in milliseconds
  let totalDiff = 0;
  const diffs: number[] = [];
  
  for (let i = 1; i < Math.min(10, timestamps.length); i++) {
    const diff = timestamps[i].getTime() - timestamps[i-1].getTime();
    diffs.push(diff);
    totalDiff += diff;
  }
  
  const avgDiffMs = totalDiff / Math.min(9, timestamps.length - 1);
  
  // Convert to appropriate interval
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;
  const monthMs = 30 * dayMs; // Approximate
  
  if (avgDiffMs < 2 * hourMs) return 'hourly';
  if (avgDiffMs < 2 * dayMs) return 'daily';
  if (avgDiffMs < 2 * weekMs) return 'weekly';
  return 'monthly';
};

/**
 * Analyze dataset and detect patterns
 * @param data Array of data points to analyze
 * @param schema Data schema
 * @returns Object containing detected patterns and properties
 */
export const analyzeDataset = (
  data: any[],
  schema: Record<string, SchemaFieldType>
) => {
  if (!data || !data.length) {
    return {
      dataPoints: 0,
      dateRange: null,
      numericFields: [],
      categoricalFields: [],
      hasTrend: false,
      hasSeasonality: false,
      dataQuality: 'unknown'
    };
  }
  
  // Extract timestamps if present
  let timestampField: string | null = null;
  let timestamps: Date[] = [];
  
  for (const [field, type] of Object.entries(schema)) {
    if (type === 'date') {
      timestampField = field;
      timestamps = data.map(item => new Date(item[field])).filter(d => !isNaN(d.getTime()));
      break;
    }
  }
  
  // If no timestamp field found in schema, try to detect it
  if (!timestampField && !timestamps.length) {
    for (const field of Object.keys(data[0])) {
      if (isValidDate(data[0][field])) {
        timestampField = field;
        timestamps = data.map(item => new Date(item[field])).filter(d => !isNaN(d.getTime()));
        break;
      }
    }
  }
  
  // Analyze numeric fields
  const numericFields: string[] = [];
  const categoricalFields: string[] = [];
  
  for (const [field, type] of Object.entries(schema)) {
    if (field === timestampField) continue;
    
    if (type === 'integer' || type === 'float' || type === 'number') {
      numericFields.push(field);
    } else if (type === 'string' || type === 'email' || type === 'phone' || type === 'address' || type === 'name') {
      categoricalFields.push(field);
    }
  }
  
  // Calculate date range
  let dateRange = null;
  if (timestamps.length > 0) {
    const minDate = new Date(Math.min(...timestamps.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...timestamps.map(d => d.getTime())));
    dateRange = {
      start: minDate,
      end: maxDate,
      interval: detectTimeInterval(timestamps)
    };
  }
  
  // Basic trend detection for the first numeric field
  let hasTrend = false;
  if (numericFields.length > 0 && data.length > 2) {
    const field = numericFields[0];
    const values = data.map(item => typeof item[field] === 'number' ? item[field] : parseFloat(item[field]));
    
    if (values.length > 2) {
      // Simplified trend detection - check if there's a consistent direction
      let increasing = 0;
      let decreasing = 0;
      
      for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i-1]) increasing++;
        else if (values[i] < values[i-1]) decreasing++;
      }
      
      const trendStrength = Math.max(increasing, decreasing) / (values.length - 1);
      hasTrend = trendStrength > 0.6; // If 60% of changes are in the same direction
    }
  }
  
  // Simplified seasonality detection
  let hasSeasonality = false;
  if (numericFields.length > 0 && timestamps.length > 0 && data.length > 14) {
    // This is a simplified approach - actual seasonality detection is more complex
    // and would require statistical tests like autocorrelation
    hasSeasonality = dateRange?.interval === 'daily' || dateRange?.interval === 'weekly';
  }
  
  // Basic data quality assessment
  const dataQuality = data.length < 5 ? 'insufficient' : 
                     (data.length < 20 ? 'limited' : 'good');
  
  return {
    dataPoints: data.length,
    dateRange,
    numericFields,
    categoricalFields,
    hasTrend,
    hasSeasonality,
    dataQuality
  };
};
