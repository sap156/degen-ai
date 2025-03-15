
import { toast } from 'sonner';
import { SchemaFieldType } from './fileUploadUtils';

interface GenerateDataOptions {
  sourceData: any[];
  schema: Record<string, SchemaFieldType>;
  count: number;
  noiseLevel: number;
  dateField?: string;
  startDate?: Date;
  endDate?: Date;
  isTimeSeries: boolean;
}

// Helper to get min and max values from an array of numbers
const getNumericRange = (data: any[], field: string): { min: number; max: number } => {
  const values = data.map(item => Number(item[field])).filter(val => !isNaN(val));
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
};

// Helper to get min and max dates from an array
const getDateRange = (data: any[], field: string): { min: Date; max: Date } => {
  const dates = data
    .map(item => new Date(item[field]))
    .filter(date => !isNaN(date.getTime()));
  
  return {
    min: new Date(Math.min(...dates.map(d => d.getTime()))),
    max: new Date(Math.max(...dates.map(d => d.getTime())))
  };
};

// Generate a random value based on the field type and existing data distribution
const generateValueForField = (
  field: string,
  type: SchemaFieldType,
  sourceData: any[],
  noiseLevel: number,
  dateRange?: { min: Date; max: Date }
): any => {
  // For categorical data, sample from existing values
  const existingValues = sourceData.map(item => item[field]);
  
  switch (type) {
    case "string":
    case "email":
    case "phone":
      // For strings, sample from existing values
      return existingValues[Math.floor(Math.random() * existingValues.length)];
      
    case "integer":
      // For integers, calculate range and add noise
      const intRange = getNumericRange(sourceData, field);
      const rangeDiff = intRange.max - intRange.min;
      const noise = (Math.random() * 2 - 1) * noiseLevel * rangeDiff;
      const baseValue = existingValues[Math.floor(Math.random() * existingValues.length)];
      return Math.round(Number(baseValue) + noise);
      
    case "float":
    case "number":
      // For floats, calculate range and add noise
      const floatRange = getNumericRange(sourceData, field);
      const floatRangeDiff = floatRange.max - floatRange.min;
      const floatNoise = (Math.random() * 2 - 1) * noiseLevel * floatRangeDiff;
      const floatBaseValue = existingValues[Math.floor(Math.random() * existingValues.length)];
      return Number((Number(floatBaseValue) + floatNoise).toFixed(4));
      
    case "boolean":
      // For booleans, randomly pick true or false
      return Math.random() > 0.5;
      
    case "date":
      if (dateRange) {
        // Generate a random date within the provided range
        const minTime = dateRange.min.getTime();
        const maxTime = dateRange.max.getTime();
        const randomTime = minTime + Math.random() * (maxTime - minTime);
        return new Date(randomTime).toISOString();
      } else {
        // Sample from existing dates
        return existingValues[Math.floor(Math.random() * existingValues.length)];
      }
      
    case "object":
      // For objects, just copy from existing data
      return JSON.parse(JSON.stringify(existingValues[Math.floor(Math.random() * existingValues.length)]));
      
    default:
      // For any other type, just sample from existing values
      return existingValues[Math.floor(Math.random() * existingValues.length)];
  }
};

// Generate a time series data point with trend and noise
const generateTimeSeriesPoint = (
  baseData: any[],
  dateField: string,
  fieldSchema: Record<string, SchemaFieldType>,
  noiseLevel: number,
  newDate: Date
): any => {
  // Create a new data point
  const newPoint: any = {};
  
  // Set the date field
  newPoint[dateField] = newDate.toISOString();
  
  // Find the nearest existing data points to interpolate from
  const existingDates = baseData.map(item => new Date(item[dateField]));
  const newTime = newDate.getTime();
  
  // Sort dates by how close they are to the new date
  const sortedIndices = existingDates
    .map((date, index) => ({ index, diff: Math.abs(date.getTime() - newTime) }))
    .sort((a, b) => a.diff - b.diff);
  
  // Get the closest data points (up to 3)
  const closestIndices = sortedIndices.slice(0, 3).map(item => item.index);
  const closestPoints = closestIndices.map(index => baseData[index]);
  
  // For each field, generate a suitable value
  Object.keys(fieldSchema).forEach(field => {
    if (field === dateField) return; // Skip the date field, already set
    
    const type = fieldSchema[field];
    
    if (type === 'integer' || type === 'float' || type === 'number') {
      // For numeric fields, interpolate and add noise
      const values = closestPoints.map(point => Number(point[field]));
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const maxDiff = Math.max(...values) - Math.min(...values);
      const noise = (Math.random() * 2 - 1) * noiseLevel * maxDiff;
      
      if (type === 'integer') {
        newPoint[field] = Math.round(avgValue + noise);
      } else {
        newPoint[field] = Number((avgValue + noise).toFixed(4));
      }
    } else {
      // For other fields, just copy from the closest point
      newPoint[field] = closestPoints[0][field];
    }
  });
  
  return newPoint;
};

// Generate additional data based on source data
export const generateAdditionalData = (options: GenerateDataOptions): any[] => {
  const { 
    sourceData, 
    schema, 
    count, 
    noiseLevel, 
    dateField, 
    startDate, 
    endDate,
    isTimeSeries 
  } = options;
  
  if (!sourceData.length) {
    throw new Error('Source data is empty');
  }
  
  try {
    const result: any[] = [];
    
    // Handle time series data
    if (isTimeSeries && dateField) {
      // Determine date range for new data points
      let dateRange: { min: Date; max: Date };
      
      if (startDate && endDate) {
        dateRange = { min: startDate, max: endDate };
      } else {
        dateRange = getDateRange(sourceData, dateField);
      }
      
      // Generate evenly spaced timestamps
      const timeStep = (dateRange.max.getTime() - dateRange.min.getTime()) / (count + 1);
      
      for (let i = 0; i < count; i++) {
        const newDate = new Date(dateRange.min.getTime() + timeStep * (i + 1));
        const newPoint = generateTimeSeriesPoint(sourceData, dateField, schema, noiseLevel, newDate);
        result.push(newPoint);
      }
      
      // Sort by date
      result.sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
      
    } else {
      // Handle non-time series data
      // For each new data point
      for (let i = 0; i < count; i++) {
        const newItem: any = {};
        
        // For each field in the schema
        Object.keys(schema).forEach(field => {
          const type = schema[field];
          
          // Generate a value for this field
          newItem[field] = generateValueForField(field, type, sourceData, noiseLevel);
        });
        
        result.push(newItem);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating additional data:', error);
    toast.error('Failed to generate additional data');
    return [];
  }
};

// Enhance fileUploadUtils.ts to better detect time series data
export const isTimeSeriesData = (data: any[]): { isTimeSeries: boolean, dateField?: string } => {
  if (!data.length) return { isTimeSeries: false };
  
  const sampleItem = data[0];
  const fields = Object.keys(sampleItem);
  
  // Look for date/time fields
  const possibleDateFields = fields.filter(field => {
    const value = sampleItem[field];
    return typeof value === 'string' && (
      /^\d{4}-\d{2}-\d{2}/.test(value) || // ISO date format
      /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || // MM/DD/YYYY
      !isNaN(Date.parse(value)) || // Parsable as date
      field.toLowerCase().includes('time') ||
      field.toLowerCase().includes('date') ||
      field.toLowerCase() === 'timestamp'
    );
  });
  
  // Check if there's at least one numeric field
  const hasNumericField = fields.some(field => {
    const value = sampleItem[field];
    return typeof value === 'number';
  });
  
  return {
    isTimeSeries: possibleDateFields.length > 0 && hasNumericField,
    dateField: possibleDateFields.length > 0 ? possibleDateFields[0] : undefined
  };
};

// NEW FUNCTIONS FOR TIME SERIES SPECIFIC OPERATIONS

// Generate time series data within a specific date range
export const generateTimeSeriesInRange = (
  sourceData: any[], 
  dateField: string,
  schema: Record<string, SchemaFieldType>,
  startDate: Date,
  endDate: Date,
  pointCount: number,
  noiseLevel: number
): any[] => {
  // Filter source data to only include items within the date range
  const filteredData = sourceData.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
  
  // If no data in range, use all source data as reference
  const baseData = filteredData.length > 0 ? filteredData : sourceData;
  
  const result: any[] = [];
  
  // Generate evenly spaced timestamps
  const timeStep = (endDate.getTime() - startDate.getTime()) / (pointCount + 1);
  
  for (let i = 0; i < pointCount; i++) {
    const newDate = new Date(startDate.getTime() + timeStep * (i + 1));
    const newPoint = generateTimeSeriesPoint(baseData, dateField, schema, noiseLevel, newDate);
    result.push(newPoint);
  }
  
  // Sort by date
  result.sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  
  return result;
};

// Add noise to existing time series data
export const addNoiseToTimeSeries = (
  data: any[],
  schema: Record<string, SchemaFieldType>,
  noiseLevel: number,
  dateField?: string,
  startDate?: Date,
  endDate?: Date
): any[] => {
  // Create a deep copy to avoid modifying original data
  const result = JSON.parse(JSON.stringify(data));
  
  // Apply date range filter if provided
  const filteredIndices = dateField && startDate && endDate 
    ? result.map((item, index) => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= startDate && itemDate <= endDate ? index : -1;
      }).filter(index => index !== -1)
    : result.map((_, index) => index); // Otherwise use all indices
  
  // For each field that's numeric, add noise
  Object.entries(schema).forEach(([field, type]) => {
    if (field === dateField) return; // Skip date field
    
    if (type === 'integer' || type === 'float' || type === 'number') {
      // Get range for this field from the original data
      const fieldValues = data.map(item => Number(item[field]));
      const min = Math.min(...fieldValues);
      const max = Math.max(...fieldValues);
      const range = max - min;
      
      // Add noise to each selected data point
      for (const index of filteredIndices) {
        const originalValue = Number(result[index][field]);
        const noise = (Math.random() * 2 - 1) * noiseLevel * range;
        
        if (type === 'integer') {
          result[index][field] = Math.round(originalValue + noise);
        } else {
          result[index][field] = Number((originalValue + noise).toFixed(4));
        }
      }
    }
  });
  
  return result;
};

// Generate PII data based on sample data
export const generatePiiData = (
  sampleData: any[],
  schema: Record<string, SchemaFieldType>,
  count: number
): any[] => {
  const result = [];
  
  for (let i = 0; i < count; i++) {
    const newItem: any = {};
    
    // For each field in the schema
    Object.entries(schema).forEach(([field, type]) => {
      switch (type) {
        case 'name':
          // Generate a random name based on sample data
          const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica'];
          const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia'];
          newItem[field] = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
          break;
          
        case 'email':
          // Generate a random email
          const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
          const username = Math.random().toString(36).substring(2, 10);
          const domain = domains[Math.floor(Math.random() * domains.length)];
          newItem[field] = `${username}@${domain}`;
          break;
          
        case 'phone':
          // Generate a random phone number
          const areaCode = Math.floor(Math.random() * 900) + 100;
          const prefix = Math.floor(Math.random() * 900) + 100;
          const lineNum = Math.floor(Math.random() * 9000) + 1000;
          newItem[field] = `(${areaCode}) ${prefix}-${lineNum}`;
          break;
          
        case 'address':
          // Generate a random address
          const streetNum = Math.floor(Math.random() * 9000) + 1000;
          const streetNames = ['Main St', 'Oak Ave', 'Maple Rd', 'Washington Blvd', 'Park Lane'];
          const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
          const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'];
          const zipCodes = ['10001', '90001', '60601', '77001', '85001', '19101'];
          const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
          const cityIndex = Math.floor(Math.random() * cities.length);
          
          newItem[field] = `${streetNum} ${streetName}, ${cities[cityIndex]}, ${states[cityIndex]} ${zipCodes[cityIndex]}`;
          break;
          
        case 'ssn':
          // Generate a random SSN
          const part1 = Math.floor(Math.random() * 900) + 100;
          const part2 = Math.floor(Math.random() * 90) + 10;
          const part3 = Math.floor(Math.random() * 9000) + 1000;
          newItem[field] = `${part1}-${part2}-${part3}`;
          break;
          
        case 'creditcard':
          // Generate a random credit card number (simplified)
          const groups = Array.from({length: 4}, () => Math.floor(Math.random() * 9000) + 1000);
          newItem[field] = groups.join('-');
          break;
          
        case 'date':
          // Generate a random date in the past 50 years
          const now = new Date();
          const pastDate = new Date(
            now.getFullYear() - Math.floor(Math.random() * 50),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          );
          newItem[field] = pastDate.toISOString().split('T')[0];
          break;
          
        default:
          // For other types, use the general generateValueForField function
          newItem[field] = generateValueForField(field, type, sampleData, 0.2);
      }
    });
    
    result.push(newItem);
  }
  
  return result;
};
