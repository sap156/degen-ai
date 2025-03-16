import { toast } from 'sonner';
import { getCompletion, OpenAiMessage } from '@/services/openAiService';

export type TimeSeriesDataPoint = {
  timestamp: string;
  value: number;
  [key: string]: any;
};

export type TimeSeriesOptions = {
  startDate: Date;
  endDate: Date;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  trend: 'random' | 'upward' | 'downward' | 'seasonal' | 'cyclical';
  noiseLevel: number; // 0-1 scale
  dataPoints?: number;
  additionalFields?: { name: string; type: 'number' | 'boolean' | 'category' }[];
  categories?: string[];
  seed?: number;
};

// Helper to generate a random value between min and max
const getRandomValue = (min: number, max: number, seed?: number): number => {
  if (seed !== undefined) {
    // Simple deterministic random with seed
    const x = Math.sin(seed) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  }
  return min + Math.random() * (max - min);
};

// Function to generate time series based on trend type
const generateTrendValue = (
  index: number,
  total: number,
  baseValue: number,
  amplitude: number,
  trend: TimeSeriesOptions['trend'],
  noiseLevel: number,
  seed?: number
): number => {
  let value = baseValue;
  
  // Apply trend pattern
  switch (trend) {
    case 'upward':
      value += (index / total) * amplitude;
      break;
    case 'downward':
      value += (1 - index / total) * amplitude;
      break;
    case 'seasonal':
      value += Math.sin((index / total) * Math.PI * 4) * amplitude;
      break;
    case 'cyclical':
      value += Math.sin((index / total) * Math.PI * 2) * amplitude;
      break;
    case 'random':
    default:
      // Random trend is just noise around base value
      break;
  }
  
  // Add noise
  const noise = getRandomValue(-amplitude * noiseLevel, amplitude * noiseLevel, seed ? seed + index : undefined);
  value += noise;
  
  return Number(value.toFixed(2));
};

// Function to generate dates between start and end with given interval
const generateDates = (start: Date, end: Date, interval: TimeSeriesOptions['interval'], count?: number): Date[] => {
  const dates: Date[] = [];
  const startTime = start.getTime();
  const endTime = end.getTime();
  
  if (count) {
    // If count is specified, distribute dates evenly
    const step = (endTime - startTime) / (count - 1);
    for (let i = 0; i < count; i++) {
      dates.push(new Date(startTime + step * i));
    }
    return dates;
  }
  
  // Otherwise, generate based on interval
  let current = new Date(startTime);
  while (current.getTime() <= endTime) {
    dates.push(new Date(current));
    
    switch (interval) {
      case 'hourly':
        current = new Date(current.setHours(current.getHours() + 1));
        break;
      case 'daily':
        current = new Date(current.setDate(current.getDate() + 1));
        break;
      case 'weekly':
        current = new Date(current.setDate(current.getDate() + 7));
        break;
      case 'monthly':
        current = new Date(current.setMonth(current.getMonth() + 1));
        break;
    }
  }
  
  return dates;
};

// Generate random additional field values
const generateAdditionalFieldValue = (
  type: 'number' | 'boolean' | 'category',
  categories?: string[],
  seed?: number,
  index?: number
): any => {
  const seedValue = seed !== undefined && index !== undefined ? seed + index : undefined;
  
  switch (type) {
    case 'number':
      return Number(getRandomValue(0, 100, seedValue).toFixed(2));
    case 'boolean':
      return getRandomValue(0, 1, seedValue) > 0.5;
    case 'category':
      if (categories && categories.length > 0) {
        const categoryIndex = Math.floor(getRandomValue(0, categories.length, seedValue));
        return categories[categoryIndex];
      }
      return 'category-' + Math.floor(getRandomValue(1, 5, seedValue));
  }
};

export const generateTimeSeriesData = (options: TimeSeriesOptions): TimeSeriesDataPoint[] => {
  try {
    const {
      startDate,
      endDate,
      interval,
      trend,
      noiseLevel,
      dataPoints,
      additionalFields = [],
      categories = [],
      seed
    } = options;
    
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }
    
    // Generate timestamps
    const dates = generateDates(startDate, endDate, interval, dataPoints);
    
    // Base value and amplitude for the series
    const baseValue = 50;
    const amplitude = 50;
    
    // Generate data points
    return dates.map((date, index) => {
      const value = generateTrendValue(
        index,
        dates.length - 1,
        baseValue,
        amplitude,
        trend,
        noiseLevel,
        seed
      );
      
      // Create the base data point
      const dataPoint: TimeSeriesDataPoint = {
        timestamp: date.toISOString(),
        value
      };
      
      // Add additional fields if specified
      additionalFields.forEach(field => {
        dataPoint[field.name] = generateAdditionalFieldValue(
          field.type,
          field.type === 'category' ? categories : undefined,
          seed,
          index
        );
      });
      
      return dataPoint;
    });
  } catch (error) {
    console.error('Error generating time series data:', error);
    toast.error('Failed to generate time series data');
    return [];
  }
};

// Format data as CSV
export const formatAsCSV = (data: TimeSeriesDataPoint[]): string => {
  if (!data.length) return '';
  
  // Get all keys from the first object
  const keys = Object.keys(data[0]);
  
  // Create header row
  const csvRows = [keys.join(',')];
  
  // Add data rows
  for (const row of data) {
    const values = keys.map(key => {
      const val = row[key];
      // Handle different types of values
      if (typeof val === 'string') {
        // Escape quotes and wrap in quotes
        return `"${val.replace(/"/g, '""')}"`;
      }
      if (val instanceof Date) {
        return `"${val.toISOString()}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

// Format data as JSON
export const formatAsJSON = (data: TimeSeriesDataPoint[]): string => {
  return JSON.stringify(data, null, 2);
};

// Save to mock database
export const saveToMockDatabase = async (data: TimeSeriesDataPoint[], name: string): Promise<boolean> => {
  try {
    console.log(`Saving ${data.length} time series data points to database as "${name}"`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/error
    const isSuccess = Math.random() > 0.1; // 90% success rate
    
    if (isSuccess) {
      toast.success(`Time series data "${name}" saved successfully`);
      return true;
    } else {
      throw new Error('Server error');
    }
  } catch (error) {
    console.error('Error saving to database:', error);
    toast.error('Failed to save time series data');
    return false;
  }
};

// Download data as a file
export const downloadData = (data: string, fileName: string, fileType: 'csv' | 'json'): void => {
  try {
    const blob = new Blob([data], { type: fileType === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${fileName}`);
  } catch (error) {
    console.error('Error downloading data:', error);
    toast.error('Failed to download data');
  }
};

export interface AITimeSeriesOptions {
  apiKey: string | null;
  prompt: string;
  startDate: Date;
  endDate: Date;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dataPoints?: number;
  existingData?: TimeSeriesDataPoint[];
  additionalFields?: { name: string; type: 'number' | 'boolean' | 'category' }[];
}

/**
 * Generate time series data using AI with specified parameters
 */
export const generateTimeSeriesWithAI = async (options: AITimeSeriesOptions): Promise<TimeSeriesDataPoint[]> => {
  try {
    const {
      apiKey,
      prompt,
      startDate,
      endDate,
      interval,
      dataPoints,
      existingData,
      additionalFields
    } = options;

    // Format the dates for the prompt
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Create a system message explaining the task
    const systemMessage: OpenAiMessage = {
      role: 'system',
      content: `You are a time series data generation expert. Generate realistic time series data based on the user's request.
      Only return the data as a valid JSON array with no additional text. 
      Each data point must have a "timestamp" (ISO format) and a "value" (numeric) field.
      If additional fields are requested, include those as well.
      The data should follow realistic temporal patterns and be suitable for analysis.`
    };
    
    // Build information about existing data if provided
    let existingDataInfo = '';
    if (existingData && existingData.length > 0) {
      // Get the field names from the first data point
      const fieldNames = Object.keys(existingData[0]);
      
      // Calculate basic statistics from existing data
      const values = existingData.map(point => point.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Add statistics to the prompt
      existingDataInfo = `
      I have existing time series data with fields: ${fieldNames.join(', ')}.
      Value range: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)}
      First few data points: ${JSON.stringify(existingData.slice(0, 3))}
      Last few data points: ${JSON.stringify(existingData.slice(-3))}`;
    }
    
    // Build information about additional fields if requested
    let additionalFieldsInfo = '';
    if (additionalFields && additionalFields.length > 0) {
      additionalFieldsInfo = `
      Include these additional fields in each data point:
      ${additionalFields.map(field => `- "${field.name}" (${field.type})`).join('\n')}`;
    }
    
    // Build the user prompt
    const userMessage: OpenAiMessage = {
      role: 'user',
      content: `Generate ${dataPoints || 'appropriate number of'} time series data points from ${formattedStartDate} to ${formattedEndDate} with ${interval} interval.
      ${prompt}
      ${existingDataInfo}
      ${additionalFieldsInfo}
      Return ONLY a JSON array of data points, each with "timestamp" and "value" properties.`
    };
    
    // Call the OpenAI API
    const messages = [systemMessage, userMessage];
    const response = await getCompletion(apiKey, messages, {
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 2000
    });
    
    try {
      // Parse the response
      let parsedData: TimeSeriesDataPoint[];
      
      // Try to parse the response directly
      try {
        parsedData = JSON.parse(response);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to extract valid JSON from the response');
        }
      }
      
      // Validate the data
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('The response is not a valid array of data points');
      }
      
      // Ensure each data point has the required properties
      parsedData = parsedData.map(point => {
        if (!point.timestamp || point.value === undefined) {
          throw new Error('Data points must have timestamp and value properties');
        }
        
        // Try to parse the timestamp if it's not in ISO format
        if (typeof point.timestamp === 'string' && !point.timestamp.includes('T')) {
          try {
            const date = new Date(point.timestamp);
            point.timestamp = date.toISOString();
          } catch (e) {
            // Keep the timestamp as is if parsing fails
          }
        }
        
        return point;
      });
      
      // Sort the data by timestamp
      parsedData.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });
      
      toast.success(`Generated ${parsedData.length} time series data points with AI`);
      return parsedData;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      toast.error('Failed to parse the AI-generated data');
      throw new Error('Failed to parse the AI-generated data: ' + (error as Error).message);
    }
  } catch (error) {
    console.error('Error generating time series data with AI:', error);
    toast.error('Failed to generate time series data with AI');
    throw error;
  }
};

/**
 * Generate realistic noise or anomalies in time series data using AI
 */
export const addAINoiseToTimeSeries = async (
  apiKey: string | null,
  data: TimeSeriesDataPoint[],
  prompt: string,
  noiseLevel: number = 0.3
): Promise<TimeSeriesDataPoint[]> => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data provided for noise generation');
    }
    
    // Create a system message explaining the task
    const systemMessage: OpenAiMessage = {
      role: 'system',
      content: `You are a time series data noise generation expert. Add realistic noise, seasonality, or anomalies to the existing time series data based on the user's request.
      Only return the modified data as a valid JSON array with no additional text.
      Maintain the original timestamp values and field structure.
      The modifications should match real-world patterns in similar data.`
    };
    
    // Get the field names from the first data point
    const fieldNames = Object.keys(data[0]);
    
    // Calculate basic statistics from existing data
    const values = data.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Build the user prompt
    const userMessage: OpenAiMessage = {
      role: 'user',
      content: `Modify the following time series data with realistic noise and/or anomalies:
      
      Noise level: ${noiseLevel} (0-1 scale, where 1 is maximum noise)
      Fields present: ${fieldNames.join(', ')}
      Value range: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)}
      Data points count: ${data.length}
      First few data points: ${JSON.stringify(data.slice(0, 3))}
      Last few data points: ${JSON.stringify(data.slice(-3))}
      
      Specific instructions: ${prompt}
      
      Return ONLY a JSON array of the modified data points with the same structure as the input.`
    };
    
    // Call the OpenAI API
    const messages = [systemMessage, userMessage];
    const response = await getCompletion(apiKey, messages, {
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 2000
    });
    
    try {
      // Parse the response
      let parsedData: TimeSeriesDataPoint[];
      
      // Try to parse the response directly
      try {
        parsedData = JSON.parse(response);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to extract valid JSON from the response');
        }
      }
      
      // Validate the data
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('The response is not a valid array of data points');
      }
      
      // Ensure the data has the same length as the input
      if (parsedData.length !== data.length) {
        throw new Error('The modified data must have the same number of points as the input');
      }
      
      // Sort the data by timestamp
      parsedData.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });
      
      toast.success(`Added AI-generated noise to ${parsedData.length} time series data points`);
      return parsedData;
    } catch (error) {
      console.error('Error parsing AI noise response:', error);
      toast.error('Failed to parse the AI-generated noise data');
      throw new Error('Failed to process AI noise: ' + (error as Error).message);
    }
  } catch (error) {
    console.error('Error adding AI noise to time series data:', error);
    toast.error('Failed to add AI noise to time series data');
    throw error;
  }
};
