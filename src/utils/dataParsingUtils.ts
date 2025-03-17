import { v4 as uuidv4 } from 'uuid';
import { SchemaFieldType, generateSchema } from './fileTypes';
import { OpenAiMessage, createMessages, getCompletion } from '@/services/openAiService';
import { getToast as getToastNotification } from '@/hooks/use-toast-notification';

// Interface for time series data point
export interface TimeSeriesDataPoint {
  timestamp: Date | string;
  value: number;
}

// Interface for generating data options
export interface GenerateTimeSeriesOptions {
  startDate: Date;
  endDate: Date;
  points: number;
  noiseLevel: number;
  valueRange?: [number, number];
  trend?: 'up' | 'down' | 'cyclic' | 'random';
}

/**
 * Checks if data appears to be time series
 */
export const isTimeSeriesData = (data: any[]): { isTimeSeries: boolean; dateField?: string } => {
  if (!data || data.length === 0) {
    return { isTimeSeries: false };
  }

  // Check for date fields
  const sample = data[0];
  let potentialDateField = null;

  for (const key in sample) {
    const value = sample[key];
    if (typeof value === 'string') {
      // Check for date patterns
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || !isNaN(Date.parse(value))) {
        potentialDateField = key;
        break;
      }
    } else if (value instanceof Date) {
      potentialDateField = key;
      break;
    }
  }

  if (!potentialDateField) {
    return { isTimeSeries: false };
  }

  // Check for at least one numeric field
  let hasNumericField = false;
  for (const key in sample) {
    if (key !== potentialDateField && typeof sample[key] === 'number') {
      hasNumericField = true;
      break;
    }
  }

  return {
    isTimeSeries: potentialDateField !== null && hasNumericField,
    dateField: potentialDateField
  };
};

/**
 * Generate time series data within a date range
 */
export const generateTimeSeriesInRange = (
  existingData: any[],
  dateField: string,
  schema: Record<string, SchemaFieldType>,
  startDate: Date,
  endDate: Date,
  numPoints: number,
  noiseLevel: number = 0.2
): any[] => {
  if (!dateField || !startDate || !endDate || numPoints <= 0) {
    return [];
  }

  const generatedData = [];
  const interval = (endDate.getTime() - startDate.getTime()) / (numPoints - 1);

  // Find numeric fields to generate values for
  const numericFields = Object.entries(schema)
    .filter(([key, type]) => 
      (type === 'number' || type === 'integer' || type === 'float') && 
      key !== dateField
    )
    .map(([key]) => key);

  if (numericFields.length === 0) {
    throw new Error('No numeric fields found in schema to generate values for');
  }

  // Calculate baseline values and trends from existing data
  const baselineValues: Record<string, { min: number; max: number; avg: number }> = {};
  numericFields.forEach(field => {
    const values = existingData.map(item => parseFloat(item[field])).filter(v => !isNaN(v));
    if (values.length > 0) {
      baselineValues[field] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length
      };
    } else {
      baselineValues[field] = { min: 0, max: 100, avg: 50 };
    }
  });

  // Generate data points
  for (let i = 0; i < numPoints; i++) {
    const timestamp = new Date(startDate.getTime() + i * interval);
    const dataPoint: Record<string, any> = {
      [dateField]: timestamp.toISOString(),
      id: uuidv4()
    };

    // Generate values for each numeric field
    numericFields.forEach(field => {
      const { min, max, avg } = baselineValues[field];
      const range = max - min;
      
      // Add trend component (time-based)
      const normalizedTime = i / (numPoints - 1); // 0 to 1
      const trendValue = avg + (range * 0.2 * (Math.sin(normalizedTime * Math.PI * 2) - 0.5));
      
      // Add random noise
      const noise = (Math.random() * 2 - 1) * noiseLevel * range;
      const value = trendValue + noise;
      
      // Ensure value is within reasonable bounds
      dataPoint[field] = Math.max(min * 0.8, Math.min(max * 1.2, value));
      
      // Round integers
      if (schema[field] === 'integer') {
        dataPoint[field] = Math.round(dataPoint[field]);
      }
    });

    // Copy non-numeric fields with default values
    Object.entries(schema)
      .filter(([key, type]) => 
        key !== dateField && 
        !numericFields.includes(key) &&
        type !== 'object' && 
        type !== 'array'
      )
      .forEach(([key, type]) => {
        if (existingData.length > 0) {
          // Use a value from existing data
          const sampleIndex = Math.floor(Math.random() * existingData.length);
          dataPoint[key] = existingData[sampleIndex][key];
        } else {
          // Generate a default value based on type
          switch (type) {
            case 'string':
              dataPoint[key] = `value_${i}`;
              break;
            case 'boolean':
              dataPoint[key] = Math.random() > 0.5;
              break;
            case 'date':
              dataPoint[key] = new Date().toISOString();
              break;
            default:
              dataPoint[key] = null;
          }
        }
      });

    generatedData.push(dataPoint);
  }

  return generatedData;
};

/**
 * Add noise to existing time series data
 */
export const addNoiseToTimeSeries = (
  data: any[],
  schema: Record<string, SchemaFieldType>,
  noiseLevel: number,
  dateField: string,
  startDate?: Date,
  endDate?: Date
): any[] => {
  if (!data || data.length === 0) {
    return [];
  }

  try {
    // Find numeric fields to add noise to
    const numericFields = Object.entries(schema)
      .filter(([key, type]) => 
        (type === 'number' || type === 'integer' || type === 'float') && 
        key !== dateField
      )
      .map(([key]) => key);

    if (numericFields.length === 0) {
      const toast = getToastNotification();
      if (toast) {
        toast({
          title: "No numeric fields found",
          description: "Could not find numeric fields to add noise to",
          variant: "destructive"
        });
      }
      return data;
    }

    return data.map(item => {
      // Check if this item is within date range
      if (startDate && endDate && dateField) {
        const itemDate = new Date(item[dateField]);
        if (itemDate < startDate || itemDate > endDate) {
          return item; // Outside range, return unchanged
        }
      }

      const noisyItem = { ...item };
      
      // Add noise to each numeric field
      numericFields.forEach(field => {
        if (typeof item[field] === 'number') {
          const originalValue = item[field];
          const noise = (Math.random() * 2 - 1) * noiseLevel * Math.abs(originalValue || 1);
          const noisyValue = originalValue + noise;
          
          // Round to original precision for integers
          if (schema[field] === 'integer') {
            noisyItem[field] = Math.round(noisyValue);
          } else {
            // For floats, round to reasonable precision
            const decimalPlaces = countDecimalPlaces(originalValue);
            noisyItem[field] = parseFloat(noisyValue.toFixed(decimalPlaces));
          }
        }
      });

      return noisyItem;
    });
  } catch (error) {
    console.error("Error adding noise to time series:", error);
    const toast = getToastNotification();
    if (toast) {
      toast({
        title: "Error",
        description: "Failed to add noise to time series data",
        variant: "destructive"
      });
    }
    return data;
  }
};

/**
 * Detect trend in time series data using AI
 */
export const detectTimeSeriesTrend = async (
  data: any[],
  dateField: string,
  valueField: string,
  apiKey: string
): Promise<string> => {
  try {
    if (!data || data.length < 5) {
      return "Insufficient data for trend analysis";
    }

    // Prepare sample data for analysis
    const timeSeriesData = data
      .map(item => ({
        timestamp: item[dateField],
        value: parseFloat(item[valueField])
      }))
      .filter(item => !isNaN(item.value))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 50); // Limit to 50 points for API call

    const messages = createMessages(
      "You are a time series data analysis expert. Analyze the data and describe the trend.",
      `Analyze this time series data and describe the trend:
      ${JSON.stringify(timeSeriesData, null, 2)}`
    );

    const analysis = await getCompletion(messages, 'gpt-4o-mini', apiKey);
    return analysis;
  } catch (error) {
    console.error("Error detecting trend:", error);
    return "Error analyzing trend";
  }
};

/**
 * Forecast future values in time series
 */
export const forecastTimeSeries = async (
  data: any[],
  dateField: string,
  valueField: string,
  periodsAhead: number,
  apiKey: string
): Promise<TimeSeriesDataPoint[]> => {
  try {
    if (!data || data.length < 5) {
      return [];
    }

    // Prepare time series data
    const timeSeriesData = data
      .map(item => ({
        timestamp: new Date(item[dateField]).toISOString(),
        value: parseFloat(item[valueField])
      }))
      .filter(item => !isNaN(item.value))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Calculate interval between points
    const dates = timeSeriesData.map(item => new Date(item.timestamp).getTime());
    const avgInterval = dates.length > 1 
      ? (dates[dates.length - 1] - dates[0]) / (dates.length - 1)
      : 86400000; // Default to 1 day in milliseconds

    const messages = createMessages(
      "You are a time series forecasting expert. Use appropriate methods to forecast future values.",
      `Forecast ${periodsAhead} periods ahead for this time series:
      ${JSON.stringify(timeSeriesData.slice(-20), null, 2)}
      
      Response format: JSON array of objects with timestamp and value properties.
      Use the same interval between data points as in the original data.`
    );

    const forecastResult = await getCompletion(messages, 'gpt-4o-mini', apiKey);
    
    // Parse the forecast result
    // First try to extract JSON from the response if it contains markdown
    const jsonMatch = forecastResult.match(/```json\n([\s\S]*?)\n```/) ||
                      forecastResult.match(/```\n([\s\S]*?)\n```/);
    
    const jsonContent = jsonMatch ? jsonMatch[1] : forecastResult;
    let forecast: TimeSeriesDataPoint[] = [];
    
    try {
      forecast = JSON.parse(jsonContent);
    } catch (e) {
      // If parsing fails, generate simple forecast
      const lastPoint = timeSeriesData[timeSeriesData.length - 1];
      const lastDate = new Date(lastPoint.timestamp);
      const lastValue = lastPoint.value;
      
      forecast = Array.from({ length: periodsAhead }, (_, i) => {
        const newDate = new Date(lastDate.getTime() + (i + 1) * avgInterval);
        return {
          timestamp: newDate.toISOString(),
          value: lastValue * (1 + (Math.random() * 0.1 - 0.05)) // Simple random walk
        };
      });
    }
    
    return forecast;
  } catch (error) {
    console.error("Error forecasting time series:", error);
    return [];
  }
};

/**
 * Find seasonal patterns in time series
 */
export const findSeasonality = async (
  data: any[],
  dateField: string,
  valueField: string,
  apiKey: string
): Promise<string> => {
  try {
    if (!data || data.length < 10) {
      return "Insufficient data for seasonality analysis";
    }

    // Prepare time series data
    const timeSeriesData = data
      .map(item => ({
        timestamp: new Date(item[dateField]).toISOString(),
        value: parseFloat(item[valueField])
      }))
      .filter(item => !isNaN(item.value))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const messages = createMessages(
      "You are a time series data analysis expert. Analyze the data for seasonal patterns.",
      `Analyze this time series data and identify any seasonality or patterns:
      ${JSON.stringify(timeSeriesData.slice(0, 100), null, 2)}`
    );

    const analysis = await getCompletion(messages, 'gpt-4o-mini', apiKey);
    return analysis;
  } catch (error) {
    console.error("Error analyzing seasonality:", error);
    return "Error analyzing seasonality";
  }
};

// Helper function to count decimal places in a number
const countDecimalPlaces = (num: number): number => {
  if (Number.isInteger(num)) return 0;
  const text = num.toString();
  const decimalIndex = text.indexOf('.');
  if (decimalIndex === -1) return 0;
  return text.length - decimalIndex - 1;
};

// Interface for AI processing options
export interface AIProcessingOptions {
  apiKey: string;
  processingTypes: string[];
  detailLevel: 'brief' | 'standard' | 'detailed';
  outputFormat: 'json' | 'text';
  userContext?: string;
}

// Process data with AI (stub for DataParsing.tsx)
export const processDataWithAI = async (text: string, options: AIProcessingOptions): Promise<Record<string, any>> => {
  // This is a simple implementation - you can expand as needed
  const results: Record<string, any> = {};
  
  for (const processingType of options.processingTypes) {
    try {
      const messages = createMessages(
        `You are an expert in ${processingType} analysis with ${options.detailLevel} detail level.`,
        `Process the following text for ${processingType} analysis:
        ${text.slice(0, 5000)}${text.length > 5000 ? '...' : ''}
        
        User context: ${options.userContext || 'No specific context provided.'}
        Output format: ${options.outputFormat.toUpperCase()}`
      );
      
      const result = await getCompletion(messages, 'gpt-4o-mini', options.apiKey);
      
      if (options.outputFormat === 'json') {
        try {
          // Try to extract JSON from the response
          const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) ||
                          result.match(/```\n([\s\S]*?)\n```/);
          
          const jsonContent = jsonMatch ? jsonMatch[1] : result;
          const structured = JSON.parse(jsonContent);
          
          results[processingType] = {
            raw: result,
            structured,
            format: 'json'
          };
        } catch (e) {
          // Fallback to text if JSON parsing fails
          results[processingType] = {
            raw: result,
            format: 'text'
          };
        }
      } else {
        results[processingType] = {
          raw: result,
          format: 'text'
        };
      }
    } catch (error) {
      console.error(`Error processing ${processingType}:`, error);
      results[processingType] = {
        raw: `Error processing ${processingType}: ${error.message}`,
        format: 'text',
        error: true
      };
    }
  }
  
  return results;
};

// Generate PII data (stub for PiiDataGenerator.tsx)
export const generatePiiData = async (
  schema: Record<string, SchemaFieldType>,
  count: number, 
  options: {
    includeNames?: boolean;
    includeAddresses?: boolean;
    includeEmails?: boolean;
    includePhones?: boolean;
    includeSSNs?: boolean;
    includeCreditCards?: boolean;
    customFields?: Record<string, any>;
  },
  apiKey: string
): Promise<any[]> => {
  // Simple implementation for now
  const results = [];
  
  for (let i = 0; i < count; i++) {
    const item: Record<string, any> = {
      id: uuidv4()
    };
    
    // Add fields based on schema
    for (const [key, type] of Object.entries(schema)) {
      switch(type) {
        case 'name':
          item[key] = `Person ${i+1}`;
          break;
        case 'address':
          item[key] = `${100 + i} Main St, City ${i % 10}, State ${i % 50}`;
          break;
        case 'email':
          item[key] = `person${i}@example.com`;
          break;
        case 'string':
          item[key] = `value_${i}`;
          break;
        case 'number':
        case 'float':
          item[key] = i * 1.5;
          break;
        case 'integer':
          item[key] = i;
          break;
        case 'boolean':
          item[key] = i % 2 === 0;
          break;
        case 'date':
          const date = new Date();
          date.setDate(date.getDate() + i);
          item[key] = date.toISOString();
          break;
        default:
          item[key] = null;
      }
    }
    
    // Add custom fields
    if (options.customFields) {
      for (const [key, value] of Object.entries(options.customFields)) {
        item[key] = value;
      }
    }
    
    results.push(item);
  }
  
  return results;
};

// Export function for detecting data type
export const detectDataType = async (file: File, apiKey: string): Promise<{
  type: string;
  confidence: number;
  timeColumn?: string;
  valueColumns?: string[];
}> => {
  // Implementation goes here
  return {
    type: 'timeseries',
    confidence: 0.9,
    timeColumn: 'timestamp',
    valueColumns: ['value']
  };
};

// Export getToast helper function to avoid direct imports
export const getToast = () => {
  try {
    return getToastNotification();
  } catch (error) {
    return null;
  }
};
