import { toast } from 'sonner';

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
