import { toast } from "sonner";
import { SchemaFieldType } from './fileUploadUtils';
import { processTextWithAI, ProcessingType } from '../services/textProcessingService';

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
  const existingValues = sourceData.map(item => item[field]);
  
  switch (type) {
    case "string":
    case "email":
    case "phone":
      return existingValues[Math.floor(Math.random() * existingValues.length)];
      
    case "integer":
      const intRange = getNumericRange(sourceData, field);
      const rangeDiff = intRange.max - intRange.min;
      const noise = (Math.random() * 2 - 1) * noiseLevel * rangeDiff;
      const baseValue = existingValues[Math.floor(Math.random() * existingValues.length)];
      return Math.round(Number(baseValue) + noise);
      
    case "float":
    case "number":
      const floatRange = getNumericRange(sourceData, field);
      const floatRangeDiff = floatRange.max - floatRange.min;
      const floatNoise = (Math.random() * 2 - 1) * noiseLevel * floatRangeDiff;
      const floatBaseValue = existingValues[Math.floor(Math.random() * existingValues.length)];
      return Number((Number(floatBaseValue) + floatNoise).toFixed(4));
      
    case "boolean":
      return Math.random() > 0.5;
      
    case "date":
      if (dateRange) {
        const minTime = dateRange.min.getTime();
        const maxTime = dateRange.max.getTime();
        const randomTime = minTime + Math.random() * (maxTime - minTime);
        return new Date(randomTime).toISOString();
      } else {
        return existingValues[Math.floor(Math.random() * existingValues.length)];
      }
      
    case "object":
      return JSON.parse(JSON.stringify(existingValues[Math.floor(Math.random() * existingValues.length)]));
      
    default:
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
  const newPoint: any = {};
  
  newPoint[dateField] = newDate.toISOString();
  
  const existingDates = baseData.map(item => new Date(item[dateField]));
  const newTime = newDate.getTime();
  
  const sortedIndices = existingDates
    .map((date, index) => ({ index, diff: Math.abs(date.getTime() - newTime) }))
    .sort((a, b) => a.diff - b.diff);
  
  const closestIndices = sortedIndices.slice(0, 3).map(item => item.index);
  const closestPoints = closestIndices.map(index => baseData[index]);
  
  Object.keys(fieldSchema).forEach(field => {
    if (field === dateField) return;
    
    const type = fieldSchema[field];
    
    if (type === 'integer' || type === 'float' || type === 'number') {
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
    
    if (isTimeSeries && dateField) {
      let dateRange: { min: Date; max: Date };
      
      if (startDate && endDate) {
        dateRange = { min: startDate, max: endDate };
      } else {
        dateRange = getDateRange(sourceData, dateField);
      }
      
      const timeStep = (dateRange.max.getTime() - dateRange.min.getTime()) / (count + 1);
      
      for (let i = 0; i < count; i++) {
        const newDate = new Date(dateRange.min.getTime() + timeStep * (i + 1));
        const newPoint = generateTimeSeriesPoint(sourceData, dateField, schema, noiseLevel, newDate);
        result.push(newPoint);
      }
      
      result.sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
      
    } else {
      for (let i = 0; i < count; i++) {
        const newItem: any = {};
        
        Object.keys(schema).forEach(field => {
          const type = schema[field];
          
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
  
  const possibleDateFields = fields.filter(field => {
    const value = sampleItem[field];
    return typeof value === 'string' && (
      /^\d{4}-\d{2}-\d{2}/.test(value) || 
      /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || 
      !isNaN(Date.parse(value)) || 
      field.toLowerCase().includes('time') ||
      field.toLowerCase().includes('date') ||
      field.toLowerCase() === 'timestamp'
    );
  });
  
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

export const generateTimeSeriesInRange = (
  sourceData: any[], 
  dateField: string,
  schema: Record<string, SchemaFieldType>,
  startDate: Date,
  endDate: Date,
  pointCount: number,
  noiseLevel: number
): any[] => {
  const filteredData = sourceData.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= startDate && itemDate <= endDate;
  });
  
  const baseData = filteredData.length > 0 ? filteredData : sourceData;
  
  const result: any[] = [];
  
  const timeStep = (endDate.getTime() - startDate.getTime()) / (pointCount + 1);
  
  for (let i = 0; i < pointCount; i++) {
    const newDate = new Date(startDate.getTime() + timeStep * (i + 1));
    const newPoint = generateTimeSeriesPoint(baseData, dateField, schema, noiseLevel, newDate);
    result.push(newPoint);
  }
  
  result.sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  
  return result;
};

export const addNoiseToTimeSeries = (
  data: any[],
  schema: Record<string, SchemaFieldType>,
  noiseLevel: number,
  dateField?: string,
  startDate?: Date,
  endDate?: Date
): any[] => {
  const result = JSON.parse(JSON.stringify(data));
  
  const filteredIndices = dateField && startDate && endDate 
    ? result.map((item, index) => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= startDate && itemDate <= endDate ? index : -1;
      }).filter(index => index !== -1)
    : result.map((_, index) => index);
  
  Object.entries(schema).forEach(([field, type]) => {
    if (field === dateField) return;
    
    if (type === 'integer' || type === 'float' || type === 'number') {
      const fieldValues = data.map(item => Number(item[field]));
      const min = Math.min(...fieldValues);
      const max = Math.max(...fieldValues);
      const range = max - min;
      
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

export const generatePiiData = (
  sampleData: any[],
  schema: Record<string, SchemaFieldType>,
  count: number
): any[] => {
  const result = [];
  
  for (let i = 0; i < count; i++) {
    const newItem: any = {};
    
    Object.entries(schema).forEach(([field, type]) => {
      switch (type) {
        case 'name':
          const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica'];
          const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia'];
          newItem[field] = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
          break;
          
        case 'email':
          const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
          const username = Math.random().toString(36).substring(2, 10);
          const domain = domains[Math.floor(Math.random() * domains.length)];
          newItem[field] = `${username}@${domain}`;
          break;
          
        case 'phone':
          const areaCode = Math.floor(Math.random() * 900) + 100;
          const prefix = Math.floor(Math.random() * 900) + 100;
          const lineNum = Math.floor(Math.random() * 9000) + 1000;
          newItem[field] = `(${areaCode}) ${prefix}-${lineNum}`;
          break;
          
        case 'address':
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
          const part1 = Math.floor(Math.random() * 900) + 100;
          const part2 = Math.floor(Math.random() * 90) + 10;
          const part3 = Math.floor(Math.random() * 9000) + 1000;
          newItem[field] = `${part1}-${part2}-${part3}`;
          break;
          
        case 'creditcard':
          const groups = Array.from({length: 4}, () => Math.floor(Math.random() * 9000) + 1000);
          newItem[field] = groups.join('-');
          break;
          
        case 'date':
          const now = new Date();
          const pastDate = new Date(
            now.getFullYear() - Math.floor(Math.random() * 50),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          );
          newItem[field] = pastDate.toISOString().split('T')[0];
          break;
          
        default:
          newItem[field] = generateValueForField(field, type, sampleData, 0.2);
      }
    });
    
    result.push(newItem);
  }
  
  return result;
};

/**
 * Interface for AI processing options
 */
export interface AIProcessingOptions {
  apiKey: string | null;
  processingTypes: ProcessingType[];
  detailLevel?: 'brief' | 'standard' | 'detailed';
  outputFormat?: 'json' | 'text';
  userContext?: string;
}

/**
 * Process extracted text data with AI
 */
export const processDataWithAI = async (
  textData: string,
  options: AIProcessingOptions
): Promise<Record<string, any>> => {
  if (!options.apiKey) {
    throw new Error("API key is required for AI processing");
  }
  
  try {
    const results: Record<string, any> = {};
    
    for (const processingType of options.processingTypes) {
      try {
        const result = await processTextWithAI(
          options.apiKey, 
          textData, 
          processingType, 
          {
            detailLevel: options.detailLevel || 'standard',
            outputFormat: options.outputFormat || 'json',
            userContext: options.userContext
          }
        );
        
        results[processingType] = result;
      } catch (error) {
        console.error(`Error in ${processingType} processing:`, error);
        toast.error(`Failed to complete ${processingType} analysis`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in AI processing:', error);
    throw error;
  }
};

/**
 * Clean and normalize structured data using AI
 */
export const cleanDataWithAI = async (
  data: any[],
  apiKey: string | null,
  options?: {
    detailLevel?: 'brief' | 'standard' | 'detailed';
    fields?: string[];
    rules?: string[];
  }
): Promise<any[]> => {
  if (!apiKey || !data.length) {
    return data;
  }
  
  try {
    const fields = options?.fields || Object.keys(data[0]);
    const rules = options?.rules || [];
    const detailLevel = options?.detailLevel || 'standard';
    
    const dataString = JSON.stringify(data.slice(0, 100), null, 2);
    
    const systemMessage = `You are an expert data cleaning and normalization assistant.
    Your task is to clean and normalize the provided data array.
    
    Clean and normalize these fields: ${fields.join(', ')}
    ${rules.length > 0 ? `Apply these specific rules: ${rules.join('; ')}` : ''}
    
    Return the cleaned data as a valid JSON array with the same structure but normalized values.
    Do not add or remove fields - only clean the existing values.
    
    Cleaning should include:
    - Fixing typographical errors
    - Standardizing date formats (to ISO where possible)
    - Standardizing phone numbers, email addresses, and other common formats
    - Removing extra whitespace and normalizing case where appropriate
    - Fixing obvious data errors
    - Ensuring consistent formatting across similar values
    
    ${detailLevel === 'detailed' ? 'Apply thorough cleaning to all values, with exhaustive normalization.' : 
      detailLevel === 'brief' ? 'Apply minimal cleaning, focusing only on critical issues.' : 
      'Apply standard cleaning to maintain data quality while preserving original information.'}`;
    
    const userMessage = `Clean and normalize this data:\n\n${dataString}`;
    
    const { getCompletion } = await import('../services/openAiService');
    const response = await getCompletion(
      apiKey, 
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      { model: localStorage.getItem('openai-model') || 'gpt-4o',
        temperature : 0.3,
        max_tokens : 16,385,
       }
    );
    
    try {
      const cleanedData = JSON.parse(response);
      
      if (Array.isArray(cleanedData)) {
        return cleanedData;
      } else {
        throw new Error('Response is not an array');
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      toast.error('Failed to clean data - invalid response format');
      return data;
    }
  } catch (error) {
    console.error('Error cleaning data with AI:', error);
    toast.error('Failed to clean data');
    return data;
  }
};

/**
 * Detect and extract entities from text data
 */
export const extractEntities = async (
  text: string,
  apiKey: string | null,
  entityTypes: ('people' | 'organizations' | 'locations' | 'dates' | 'amounts' | 'all')[] = ['all']
): Promise<Record<string, string[]>> => {
  if (!apiKey) {
    throw new Error("API key is required for entity extraction");
  }
  
  try {
    const systemMessage = `You are an expert Named Entity Recognition (NER) assistant.
    Your task is to extract entities from the provided text.
    
    Extract these entity types: ${entityTypes.includes('all') ? 'all entity types' : entityTypes.join(', ')}
    
    Return the extracted entities as a valid JSON object with entity types as keys and arrays of entities as values.
    Format:
    {
      "people": ["Person 1", "Person 2", ...],
      "organizations": ["Org 1", "Org 2", ...],
      "locations": ["Location 1", "Location 2", ...],
      "dates": ["Date 1", "Date 2", ...],
      "amounts": ["Amount 1", "Amount 2", ...],
      "other": ["Entity 1", "Entity 2", ...]
    }
    
    Only include entity types that are found in the text.`;
    
    const userMessage = `Extract entities from this text:\n\n${text}`;
    
    const { getCompletion } = await import('../services/openAiService');
    const response = await getCompletion(
      apiKey, 
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      { model: localStorage.getItem('openai-model') || 'gpt-4o',
        temperature : 0.3,
        max_tokens : 16,385,
       }
    );
    
    try {
      const entities = JSON.parse(response);
      return entities;
    } catch (error) {
      console.error('Failed to parse entity extraction response:', error);
      throw new Error('Invalid response format from entity extraction');
    }
  } catch (error) {
    console.error('Error extracting entities:', error);
    throw error;
  }
};

/**
 * Analyze sentiment in text data
 */
export const analyzeSentiment = async (
  text: string,
  apiKey: string | null
): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  intent?: string;
  analysis: string;
}> => {
  if (!apiKey) {
    throw new Error("API key is required for sentiment analysis");
  }
  
  try {
    const systemMessage = `You are an expert sentiment analysis assistant.
    Your task is to analyze the sentiment and intent in the provided text.
    
    Return your analysis as a valid JSON object with the following structure:
    {
      "sentiment": "positive" | "negative" | "neutral" | "mixed",
      "score": number between -1 and 1,
      "intent": primary intent detected (e.g., "complaint", "inquiry", "praise", "request", "information"),
      "analysis": brief explanation of the sentiment and intent detection
    }`;
    
    const userMessage = `Analyze the sentiment in this text:\n\n${text}`;
    
    const { getCompletion } = await import('../services/openAiService');
    const response = await getCompletion(
      apiKey, 
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      { model: localStorage.getItem('openai-model') || 'gpt-4o',
        temperature : 0.3,
        max_tokens : 16,385,
       }
    );
    
    try {
      const sentimentAnalysis = JSON.parse(response);
      return sentimentAnalysis;
    } catch (error) {
      console.error('Failed to parse sentiment analysis response:', error);
      throw new Error('Invalid response format from sentiment analysis');
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
};

/**
 * Generate tags and categories for text data
 */
export const generateTags = async (
  text: string,
  apiKey: string | null,
  options?: {
    maxTags?: number;
    categories?: string[];
    domainSpecific?: boolean;
  }
): Promise<{
  tags: string[];
  categories: string[];
  keywords: string[];
}> => {
  if (!apiKey) {
    throw new Error("API key is required for tag generation");
  }
  
  try {
    const maxTags = options?.maxTags || 10;
    const categories = options?.categories || [];
    const domainSpecific = options?.domainSpecific || false;
    
    const systemMessage = `You are an expert content tagging and categorization assistant.
    Your task is to generate relevant tags and categories for the provided text.
    
    Generate up to ${maxTags} tags that accurately represent the content.
    ${categories.length > 0 ? `Categorize the text into these categories if applicable: ${categories.join(', ')}` : 'Suggest appropriate categories for the content.'}
    ${domainSpecific ? 'Focus on domain-specific terminology and concepts.' : 'Use general terminology that would be widely understood.'}
    
    Return your analysis as a valid JSON object with the following structure:
    {
      "tags": array of relevant tags,
      "categories": array of applicable categories,
      "keywords": array of key terms/phrases that appear in the text
    }`;
    
    const userMessage = `Generate tags for this text:\n\n${text}`;
    
    const { getCompletion } = await import('../services/openAiService');
    const response = await getCompletion(
      apiKey, 
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
            
      { model: localStorage.getItem('openai-model') || 'gpt-4o',
        temperature : 0.3,
        max_tokens : 16,385,
       }
    );
    
    try {
      const taggingResults = JSON.parse(response);
      return taggingResults;
    } catch (error) {
      console.error('Failed to parse tag generation response:', error);
      throw new Error('Invalid response format from tag generation');
    }
  } catch (error) {
    console.error('Error generating tags:', error);
    throw error;
  }
};
