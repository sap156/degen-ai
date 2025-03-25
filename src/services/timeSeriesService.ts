import { toast } from 'sonner';
import { getCompletion, OpenAiMessage } from '@/services/openAiService';
import { Progress } from '@/components/ui/progress';

export interface TimeSeriesDataPoint {
  timestamp: string;
  value?: number;
  [key: string]: any;
}

export interface TimeSeriesOptions {
  startDate: Date;
  endDate: Date;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  trend?: 'random' | 'upward' | 'downward' | 'seasonal' | 'cyclical' | 'extend';
  noiseLevel?: number;
  seed?: number;
  categories?: string[];
  additionalFields?: Array<{
    name: string;
    type: 'number' | 'boolean' | 'category';
  }>;
  existingData?: TimeSeriesDataPoint[];
}

// Helper to calculate number of data points based on date range and interval
export const calculateDataPointsCount = (
  startDate: Date,
  endDate: Date,
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly'
): number => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const millisecondsDiff = endTime - startTime;
  
  switch (interval) {
    case 'hourly':
      return Math.ceil(millisecondsDiff / (60 * 60 * 1000)) + 1;
    case 'daily':
      return Math.ceil(millisecondsDiff / (24 * 60 * 60 * 1000)) + 1;
    case 'weekly':
      return Math.ceil(millisecondsDiff / (7 * 24 * 60 * 60 * 1000)) + 1;
    case 'monthly':
      // Calculate months between dates
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    default:
      return 0;
  }
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
const generateDates = (start: Date, end: Date, interval: TimeSeriesOptions['interval']): Date[] => {
  const dates: Date[] = [];
  const startTime = start.getTime();
  const endTime = end.getTime();
  
  // Generate based on interval
  let current = new Date(startTime);
  
  // Ensure the end date is included
  while (current.getTime() <= endTime) {
    dates.push(new Date(current));
    
    switch (interval) {
      case 'hourly':
        // Properly add hours
        current = new Date(current.getTime() + 60 * 60 * 1000);
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
      additionalFields = [],
      categories = [],
      seed
    } = options;
    
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }
    
    // Generate timestamps
    const dates = generateDates(startDate, endDate, interval);
    
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
      const dataPoint: TimeSeriesDataPoint = { timestamp: date.toISOString() };
      
      // Add value field
      dataPoint.value = value;
      
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
  interval: string;
  additionalFields?: Array<{
    name: string;
    type: 'number' | 'boolean' | 'category';
  }>;
  existingData?: TimeSeriesDataPoint[];
  onProgressUpdate?: (progress: number) => void;
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
      additionalFields,
      existingData,
      onProgressUpdate
    } = options;

    // Initial progress update
    onProgressUpdate?.(5);

    if (!apiKey) {
      toast.error("API key is required for AI-powered time series generation");
      throw new Error("API key is required");
    }

    // Calculate expected number of data points based on date range and interval
    const expectedDataPoints = calculateDataPointsCount(startDate, endDate, interval as 'hourly' | 'daily' | 'weekly' | 'monthly');

    // Format the dates for the prompt
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Create a system message explicitly instructing to generate pure JSON
    const systemMessage: OpenAiMessage = {
      role: 'system',
      content: `You are an expert in time series data generation. Your task is to generate structured, realistic time series data based on user specifications.
    
      **Strict Output Requirements:**
      - Your response MUST be a **valid JSON array**, containing structured time series data.
      - DO NOT include any explanations, comments, markdown, or text—ONLY return the raw JSON array.
      - Each data point MUST include a **"timestamp"** in **ISO 8601 format** (e.g., "2025-03-19T12:00:00Z").
      - Each data point MUST include at least one numeric value field alongside the timestamp.' 
      - Each data point MUST contain a timestamp unless additional fields are specified by the user.'}
      - If the user requests additional fields, include them while maintaining logical coherence.
    
      **Data Generation Guidelines:**
      - **Timestamps:** Generate exactly ${expectedDataPoints} data points with consistent ${interval} intervals between ${formattedStartDate} and ${formattedEndDate}.
      - **Numeric Fields:** If applicable, generate values using appropriate statistical distributions:
        - **Gaussian (Normal)** for sensor readings or financial data.
        - **Poisson** for event counts (e.g., transactions per minute).
        - **Uniform** for randomized values within a defined range.
      - **Patterns & Trends:** 
        - Simulate realistic trends (e.g., increasing, decreasing, cyclical).
        - If seasonality is requested, follow daily, weekly, or yearly cycles.
        - Add randomness where appropriate to reflect real-world variability.
      - **Missing Data Handling:** If the user requests missing data simulation, randomly omit some timestamps or values.
      
      **Critical Instructions:**
      - DO NOT return metadata, comments, or explanations.
      - Your response MUST strictly be a **valid JSON array**, formatted correctly.
      - If constraints or patterns are unclear, use standard assumptions for realistic time series data.
      `
    };
    
    onProgressUpdate?.(15);
    
    // Build information about existing data if provided
    let existingDataInfo = '';
    if (existingData && existingData.length > 0) {
      // Get the field names from the first data point
      const fieldNames = Object.keys(existingData[0]);
      
      // Calculate basic statistics from existing data if value exists
      const values = existingData.map(point => point.value).filter(v => v !== undefined);
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 100;
      const avg = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 50;
      
      // Add statistics to the prompt
      existingDataInfo = `
      I have existing time series data with fields: ${fieldNames.join(', ')}.
      ${values.length > 0 ? `Value range: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)}` : ''}
      First few data points: ${JSON.stringify(existingData.slice(0, 3))}
      Last few data points: ${JSON.stringify(existingData.slice(-3))}`;
    }
    
    onProgressUpdate?.(25);
    
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
      content: `Generate ${expectedDataPoints} time series data points from ${formattedStartDate} to ${formattedEndDate} with ${interval} interval.
      ${prompt}
      ${existingDataInfo}
      ${additionalFieldsInfo}
      
      IMPORTANT: Respond with ONLY a valid JSON array of data points. DO NOT include ANY explanations, introductions, or code blocks. Your entire response should be JUST the JSON array of data points.`
    };
    
    onProgressUpdate?.(35);
    
    // Call the OpenAI API
    const messages = [systemMessage, userMessage];
    console.log("Calling OpenAI for time series generation with messages:", JSON.stringify(messages, null, 2));
    
    const response = await getCompletion(apiKey, messages, {
      model: localStorage.getItem('openai-model') || 'gpt-4o',
      temperature: 0.3,
      max_tokens: 16384
    });
    
    onProgressUpdate?.(75);
    console.log("Raw OpenAI response received:", response.substring(0, 200) + "...");
    
    try {
      // Clean the response to ensure we have valid JSON
      const cleanJsonResponse = (text: string): string => {
        let cleaned = text.trim();
        
        // Try to extract JSON from code blocks if present
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
        const match = cleaned.match(jsonBlockRegex);
        
        if (match && match[1]) {
          cleaned = match[1].trim();
          console.log("Extracted JSON from code block");
        }
        
        // Further clean potential markdown or text explanations
        // Look for arrays starting with [ and ending with ]
        const arrayRegex = /(\[[\s\S]*\])/;
        const arrayMatch = cleaned.match(arrayRegex);
        if (arrayMatch && arrayMatch[1]) {
          cleaned = arrayMatch[1].trim();
          console.log("Extracted array pattern from response");
        }
        
        return cleaned;
      };
      
      const cleanedResponse = cleanJsonResponse(response);
      console.log("Cleaned response start:", cleanedResponse.substring(0, 100) + "...");
      
      // Try to parse the cleaned response
      let parsedData: TimeSeriesDataPoint[];
      
      try {
        parsedData = JSON.parse(cleanedResponse);
        console.log("Successfully parsed JSON response");
      } catch (parseError) {
        console.error("Failed to parse cleaned response:", parseError);
        
        // If direct parsing fails, try more aggressive cleaning
        // Remove any non-JSON characters at the start and end
        let aggressivelyCleaned = cleanedResponse.replace(/^[^[]*/, '').replace(/[^\]]*$/, '');
        console.log("Aggressively cleaned JSON:", aggressivelyCleaned.substring(0, 100) + "...");
        
        try {
          parsedData = JSON.parse(aggressivelyCleaned);
          console.log("Successfully parsed aggressively cleaned JSON");
        } catch (secondParseError) {
          console.error("Failed to parse even after aggressive cleaning:", secondParseError);
          
          // Final attempt: try to extract just the array pattern with regex
          const jsonMatch = cleanedResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            try {
              parsedData = JSON.parse(jsonMatch[0]);
              console.log("Successfully parsed JSON using regex extraction");
            } catch (finalParseError) {
              console.error("All parsing attempts failed:", finalParseError);
              throw new Error('Failed to extract valid JSON from the response. The AI model did not return properly formatted data.');
            }
          } else {
            console.error("No JSON array pattern found in response");
            throw new Error('Failed to find a valid JSON array in the response');
          }
        }
      }
      
      onProgressUpdate?.(85);
      
      // Validate the data
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        console.error("Invalid data format. Received:", parsedData);
        throw new Error('The response is not a valid array of data points');
      }
      
      // Ensure each data point has the required properties
      parsedData = parsedData.map((point, index) => {
        if (!point || typeof point !== 'object') {
          console.error(`Invalid data point at index ${index}:`, point);
          throw new Error(`Invalid data point at index ${index}`);
        }
        
        if (!point.timestamp) {
          console.error(`Missing timestamp at index ${index}:`, point);
          throw new Error('Data points must have timestamp property');
        }
        
        // Create a valid data point with the timestamp
        const validPoint: TimeSeriesDataPoint = { timestamp: point.timestamp };
        
        // Copy all other properties
        Object.entries(point).forEach(([key, value]) => {
          if (key !== 'timestamp') {
            validPoint[key] = value;
          }
        });
        
        // Try to parse the timestamp if it's not in ISO format
        if (typeof validPoint.timestamp === 'string' && !validPoint.timestamp.includes('T')) {
          try {
            const date = new Date(validPoint.timestamp);
            validPoint.timestamp = date.toISOString();
          } catch (e) {
            console.error(`Invalid timestamp format at index ${index}:`, validPoint.timestamp);
            // Keep the timestamp as is if parsing fails
          }
        }
        
        return validPoint;
      });
      
      // Sort the data by timestamp
      parsedData.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      });
      
      onProgressUpdate?.(100);
      
      toast.success(`Generated ${parsedData.length} time series data points with AI`);
      return parsedData;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', response);
      toast.error(`Failed to parse the AI-generated data: ${(error as Error).message}`);
      throw new Error(`Failed to parse the AI-generated data: ${(error as Error).message}`);
    }
  } catch (error) {
    console.error('Error generating time series data with AI:', error);
    toast.error('Failed to generate time series data with AI');
    throw error;
  }
};

export interface AINoiseOptions {
  apiKey: string | null;
  data: TimeSeriesDataPoint[];
  prompt: string;
  noiseLevel: number;
  onProgressUpdate?: (progress: number) => void;
}

/**
 * Generate realistic noise or anomalies in time series data using AI
 */
export const addAINoiseToTimeSeries = async (options: AINoiseOptions): Promise<TimeSeriesDataPoint[]> => {
  try {
    const { apiKey, data, prompt, noiseLevel = 0.3, onProgressUpdate } = options;
    
    if (!data || data.length === 0) {
      throw new Error('No data provided for noise generation');
    }
    
    // Initial progress update
    onProgressUpdate?.(5);
    
    // Create a system message explaining the task
    const systemMessage: OpenAiMessage = {
      role: 'system',
      content: `You are a time series data noise generation expert. Add realistic noise, seasonality, or anomalies to the existing time series data based on the user's request.
      RETURN ONLY the modified data as a valid JSON array with NO additional text, comments, or markdown formatting.
      Maintain the original timestamp values and field structure.
      The modifications should match real-world patterns in similar data.
      IMPORTANT: Your response must only contain the raw JSON array and nothing else.`
    };
    
    onProgressUpdate?.(15);
    
    // Get the field names from the first data point
    const fieldNames = Object.keys(data[0]);
    
    // Identify numeric fields for potential noise application
    const numericFields = fieldNames.filter(field => {
      return field !== 'timestamp' && 
             data.some(point => typeof point[field] === 'number');
    });
    
    if (numericFields.length === 0) {
      throw new Error('No numeric fields found in the data to apply noise to');
    }
    
    // Calculate basic statistics from existing data for each numeric field
    const fieldStats = numericFields.reduce((stats, field) => {
      const values = data
        .map(point => point[field])
        .filter(v => v !== undefined && typeof v === 'number') as number[];
        
      if (values.length > 0) {
        stats[field] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length
        };
      }
      return stats;
    }, {} as Record<string, { min: number; max: number; avg: number }>);
    
    onProgressUpdate?.(25);
    
    // Build the user prompt with detailed information about the data
    const userMessage: OpenAiMessage = {
      role: 'user',
      content: `Modify the following time series data with realistic noise and/or anomalies:
      
      Noise level: ${noiseLevel} (0-1 scale, where 1 is maximum noise)
      Fields present: ${fieldNames.join(', ')}
      Numeric fields: ${numericFields.join(', ')}
      
      Field statistics:
      ${Object.entries(fieldStats).map(([field, stats]) => 
        `${field}: min=${stats.min.toFixed(2)}, max=${stats.max.toFixed(2)}, avg=${stats.avg.toFixed(2)}`
      ).join('\n')}
      
      Data points count: ${data.length}
      First few data points: ${JSON.stringify(data.slice(0, 3))}
      Last few data points: ${JSON.stringify(data.slice(-3))}
      
      Specific instructions: ${prompt}
      
      Return ONLY a JSON array of the modified data points with exactly the same structure as the input.
      DO NOT include any explanations, text, or code blocks in your response.
      IMPORTANT: Your entire response should be JUST the raw JSON array.`
    };
    
    onProgressUpdate?.(35);
    
    // Call the OpenAI API
    const messages = [systemMessage, userMessage];
    console.log("Calling OpenAI for adding noise with messages:", JSON.stringify(messages, null, 2));
    
    const response = await getCompletion(apiKey, messages, {
      model: localStorage.getItem('openai-model') || 'gpt-4o',
      temperature: 0.3,
      max_tokens: 16384
    });
    
    onProgressUpdate?.(75);
    console.log("Raw noise response received:", response.substring(0, 200) + "...");
    
    try {
      // Parse the response
      let parsedData: TimeSeriesDataPoint[];
      
      // Clean and parse JSON using the same robust approach as in generateTimeSeriesWithAI
      const cleanJsonResponse = (text: string): string => {
        let cleaned = text.trim();
        
        // Try to extract JSON from code blocks if present
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
        const match = cleaned.match(jsonBlockRegex);
        
        if (match && match[1]) {
          cleaned = match[1].trim();
          console.log("Extracted JSON from code block");
        }
        
        // Further clean potential markdown or text explanations
        const arrayRegex = /(\[[\s\S]*\])/;
        const arrayMatch = cleaned.match(arrayRegex);
        if (arrayMatch && arrayMatch[1]) {
          cleaned = arrayMatch[1].trim();
          console.log("Extracted array pattern from response");
        }
        
        return cleaned;
      };
      
      const cleanedResponse = cleanJsonResponse(response);
      console.log("Cleaned noise response start:", cleanedResponse.substring(0, 100) + "...");
      
      try {
        parsedData = JSON.parse(cleanedResponse);
        console.log("Successfully parsed noise JSON response");
      } catch (parseError) {
        console.error("Initial noise parsing failed:", parseError);
        
        // If direct parsing fails, try more aggressive cleaning
        let aggressivelyCleaned = cleanedResponse.replace(/^[^[]*/, '').replace(/[^\]]*$/, '');
        console.log("Aggressively cleaned noise JSON:", aggressivelyCleaned.substring(0, 100) + "...");
        
        try {
          parsedData = JSON.parse(aggressivelyCleaned);
          console.log("Successfully parsed aggressively cleaned noise JSON");
        } catch (secondParseError) {
          console.error("Failed to parse even after aggressive cleaning:", secondParseError);
          
          // Final attempt: try to extract just the array pattern with regex
          const jsonMatch = cleanedResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            try {
              parsedData = JSON.parse(jsonMatch[0]);
              console.log("Successfully parsed JSON using regex extraction");
            } catch (finalParseError) {
              console.error("All parsing attempts failed:", finalParseError);
              
              // Fallback to simple noise generation
              throw new Error('Failed to parse AI response. Will use programmatic noise generation instead.');
            }
          } else {
            console.error("No JSON array pattern found in response");
            
            // Fallback to simple noise generation
            throw new Error('Failed to find a valid JSON array in the response. Will use programmatic noise generation instead.');
          }
        }
      }
      
      onProgressUpdate?.(85);
      
      // Validate the data - ensure it's properly formatted
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error('The response is not a valid array of data points');
      }
      
      // Ensure the data has the same length as the input
      if (parsedData.length !== data.length) {
        console.error(`Length mismatch: Expected ${data.length} points, got ${parsedData.length}`);
        throw new Error('The modified data must have the same number of points as the input');
      }
      
      // Ensure all required fields exist in each data point
      parsedData = parsedData.map((point, index) => {
        const originalPoint = data[index];
        
        // Ensure the timestamp exists and is preserved
        if (!point.timestamp) {
          point.timestamp = originalPoint.timestamp;
        }
        
        // Ensure all fields from the original data are present
        for (const field of fieldNames) {
          if (!(field in point)) {
            // If a field is missing, copy it from the original data
            point[field] = originalPoint[field];
          }
          
          // If a field should be numeric but isn't, fix it
          if (numericFields.includes(field) && typeof point[field] !== 'number') {
            if (typeof originalPoint[field] === 'number') {
              point[field] = originalPoint[field];
            } else {
              // Default to 0 if neither is numeric
              point[field] = 0;
            }
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
      
      onProgressUpdate?.(100);
      
      toast.success(`Added AI-generated noise to ${parsedData.length} time series data points`);
      return parsedData;
    } catch (error) {
      console.error('Error parsing AI noise response:', error);
      toast.error(`Failed to process AI noise: ${(error as Error).message}`);
      
      // Fallback to simple noise generation
      console.warn("AI response processing failed. Falling back to programmatic noise generation");
      
      // Apply simple noise to numeric fields ourselves
      const fallbackData = data.map(point => {
        const newPoint = { ...point };
        numericFields.forEach(field => {
          if (typeof point[field] === 'number') {
            const value = point[field] as number;
            const range = fieldStats[field] ? (fieldStats[field].max - fieldStats[field].min) : value * 0.5;
            const noise = (Math.random() * 2 - 1) * noiseLevel * (range * 0.2);
            newPoint[field] = Number((value + noise).toFixed(4));
          }
        });
        return newPoint;
      });
      
      toast.warning('Encountered an error - applied simple noise pattern instead');
      return fallbackData;
    }
  } catch (error) {
    console.error('Error adding AI noise to time series data:', error);
    toast.error(`Failed to add AI noise: ${(error as Error).message}`);
    throw error;
  }
};

export const extendTimeSeriesData = (
  originalData: TimeSeriesDataPoint[],
  options: TimeSeriesOptions
): TimeSeriesDataPoint[] => {
  if (!originalData.length) {
    throw new Error('No original data provided for extension');
  }

  const {
    startDate,
    endDate,
    interval,
    noiseLevel = 0.3,
    trend = 'extend',
    additionalFields = [],
  } = options;

  // Use the original data to determine the pattern to extend
  const sortedOriginalData = [...originalData].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Analyze the original data to determine trends, patterns, and seasonality
  const analysis = analyzeTimeSeries(sortedOriginalData);
  
  // Generate new timestamps based on the last timestamp in the original data
  const lastTimestamp = new Date(sortedOriginalData[sortedOriginalData.length - 1].timestamp);
  const newTimestamps = generateTimestampsAfter(lastTimestamp, interval, calculateDataPointsCount(startDate, endDate, interval), endDate);
  
  // Create new data points by extending the patterns from original data
  const newDataPoints: TimeSeriesDataPoint[] = newTimestamps.map((timestamp, index) => {
    // Base data point with timestamp
    const dataPoint: TimeSeriesDataPoint = {
      timestamp: timestamp.toISOString(),
    };
    
    
    // Add additional fields based on the original data patterns
    additionalFields.forEach(field => {
      const fieldName = field.name;
      
      if (field.type === 'number') {
        // For numeric fields, predict based on patterns
        dataPoint[fieldName] = predictNextValue(
          sortedOriginalData.map(d => ({ 
            timestamp: d.timestamp, 
            value: typeof d[fieldName] === 'number' ? d[fieldName] : 0 
          })), 
          index, 
          analysis, 
          noiseLevel, 
          trend
        );
      } else if (field.type === 'boolean') {
        // For boolean fields, use probability based on original data
        const booleanValues = sortedOriginalData
          .filter(d => typeof d[fieldName] === 'boolean')
          .map(d => d[fieldName]);
          
        if (booleanValues.length) {
          const trueCount = booleanValues.filter(v => v === true).length;
          const trueProb = trueCount / booleanValues.length;
          dataPoint[fieldName] = Math.random() < trueProb;
        } else {
          dataPoint[fieldName] = Math.random() < 0.5;
        }
      } else if (field.type === 'category') {
        // For categorical fields, sample from the original categories
        const categories = sortedOriginalData
          .filter(d => d[fieldName] !== undefined)
          .map(d => d[fieldName]);
          
        if (categories.length) {
          const randomIndex = Math.floor(Math.random() * categories.length);
          dataPoint[fieldName] = categories[randomIndex];
        }
      }
    });
    
    return dataPoint;
  });
  
  return newDataPoints;
};

// Helper function to analyze time series data for patterns
const analyzeTimeSeries = (data: TimeSeriesDataPoint[]) => {
  if (!data.length || data.length < 3) {
    return { trend: 0, seasonality: [], mean: 0, stdDev: 0 };
  }
  
  // Extract values, handling potential missing values
  const values = data.map(d => typeof d.value === 'number' ? d.value : 0);
  
  // Calculate basic statistics
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Detect trend (basic linear regression slope)
  let trend = 0;
  if (values.length > 2) {
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((sum, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = indices.reduce((sum, i) => sum + i * values[i], 0);
    const sumXX = indices.reduce((sum, i) => sum + i * i, 0);
    trend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  
  // Simple seasonality detection (looking for repeating patterns)
  // This is a simplified approach - real seasonality detection would be more complex
  const seasonalityPeriods = [7, 12, 24, 30]; // Common periods: weekly, monthly, daily, monthly
  const seasonality = seasonalityPeriods.map(period => {
    // Skip if not enough data
    if (values.length <= period * 2) return 0;
    
    let seasonalityStrength = 0;
    for (let i = 0; i < period; i++) {
      const seasonalPoints = [];
      for (let j = i; j < values.length; j += period) {
        seasonalPoints.push(values[j]);
      }
      
      if (seasonalPoints.length > 1) {
        const seasonalMean = seasonalPoints.reduce((sum, v) => sum + v, 0) / seasonalPoints.length;
        seasonalityStrength += Math.abs(seasonalMean - mean);
      }
    }
    return seasonalityStrength / period;
  });
  
  const detectedSeasonality = seasonalityPeriods[
    seasonality.indexOf(Math.max(...seasonality))
  ];
  
  return { 
    trend, 
    seasonality: seasonality.length > 0 ? seasonality : [], 
    detectedPeriod: detectedSeasonality,
    mean, 
    stdDev 
  };
};

// Helper function to generate timestamps after a given date
const generateTimestampsAfter = (
  startAfter: Date, 
  interval: string, 
  count: number, 
  endDate?: Date
): Date[] => {
  const timestamps: Date[] = [];
  let currentDate = new Date(startAfter);
  
  for (let i = 0; i < count; i++) {
    // Move to next interval
    if (interval === 'hourly') {
      currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000);
    } else if (interval === 'daily') {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (interval === 'weekly') {
      currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (interval === 'monthly') {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );
    }
    
    // Check if we've gone past the end date
    if (endDate && currentDate > endDate) {
      break;
    }
    
    timestamps.push(new Date(currentDate));
  }
  
  return timestamps;
};

// Helper function to predict the next value based on patterns in original data
const predictNextValue = (
  data: TimeSeriesDataPoint[], 
  index: number, 
  analysis: any, 
  noiseLevel: number,
  trend: string
): number => {
  if (!data.length) return 0;
  
  const values = data.map(d => typeof d.value === 'number' ? d.value : 0);
  const { mean, stdDev, trend: trendValue, detectedPeriod } = analysis;
  
  let baseValue: number;
  
  // Use the last value as a starting point
  const lastValue = values[values.length - 1];
  
  // Add trend component
  let trendComponent = 0;
  if (trend === 'upward') {
    trendComponent = (stdDev / 10) * (1 + Math.random());
  } else if (trend === 'downward') {
    trendComponent = -(stdDev / 10) * (1 + Math.random());
  } else if (trend === 'extend') {
    trendComponent = trendValue;
  }
  
  // Add seasonal component if applicable
  let seasonalComponent = 0;
  if (detectedPeriod && (trend === 'seasonal' || trend === 'extend' || trend === 'cyclical')) {
    // Find the position in the seasonal cycle
    const position = index % detectedPeriod;
    
    // If we have enough data, use the value from previous cycles
    if (values.length > detectedPeriod) {
      const seasonalValues = [];
      for (let i = position; i < values.length; i += detectedPeriod) {
        seasonalValues.push(values[i]);
      }
      
      if (seasonalValues.length > 0) {
        const seasonalMean = seasonalValues.reduce((sum, v) => sum + v, 0) / seasonalValues.length;
        seasonalComponent = seasonalMean - mean;
      }
    }
  }
  
  // Add random noise component
  const noiseComponent = stdDev * noiseLevel * (Math.random() * 2 - 1);
  
  // Calculate base value using the various components
  baseValue = lastValue + trendComponent + seasonalComponent;
  
  // Add noise
  const predictedValue = baseValue + noiseComponent;
  
  // Ensure non-negative values for certain types of data
  return Math.max(0, predictedValue);
};
