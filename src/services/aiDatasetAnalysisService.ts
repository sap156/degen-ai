import { getCompletion, OpenAiMessage } from "./openAiService";

// Dataset analysis data types
export interface DatasetAnalysis {
  schema: Record<string, string>;
  summary: {
    totalSamples: number;
    missingValues: number;
    duplicates: number;
    outliers: number;
  };
  preview: any[]; // Preview of the dataset (first 10 rows)
  potentialIssues: string[];
  detectedTarget?: string;
  potentialPrimaryKeys?: string[];
}

// Dataset preferences selected by user
export interface DatasetPreferences {
  targetColumn: string;
  classLabels: string[];
  majorityClass?: string;
  minorityClass?: string;
  datasetContext?: string;
  primaryKeys?: string[];
}

// Model options interface
export interface ModelOptions {
  syntheticDataPreferences?: {
    enabled: boolean;
    volume: number;
    diversity: 'low' | 'medium' | 'high';
  };
  enableFeatureEngineering: boolean;
}

/**
 * Analyze dataset using OpenAI API
 * @param data Dataset to analyze
 * @param apiKey OpenAI API key
 * @returns Analysis results from OpenAI
 */
export const analyzeDataset = async (
  data: any[],
  apiKey: string | null
): Promise<DatasetAnalysis | null> => {
  if (!apiKey) return null;
  
  try {
    // No need to send the entire dataset to OpenAI, just a sample
    const sampleData = data.slice(0, 10);
    const schema = generateSchema(data);
    
    // Generate basic statistics without AI
    const summary = {
      totalSamples: data.length,
      missingValues: countMissingValues(data),
      duplicates: countDuplicates(data),
      outliers: detectOutliers(data),
    };
    
    // Get potential issues through AI
    const potentialIssues = await detectIssues(data, schema, apiKey);
    
    // Try to detect target variable with improved methods
    const detectedTarget = detectPotentialTargetVariable(data, schema);
    
    // Detect potential primary keys
    const potentialPrimaryKeys = detectPotentialPrimaryKeys(data);
    
    return {
      schema,
      summary,
      preview: sampleData,
      potentialIssues,
      detectedTarget,
      potentialPrimaryKeys,
    };
  } catch (error) {
    console.error('Error analyzing dataset:', error);
    return null;
  }
};

/**
 * Generate schema for the dataset
 */
const generateSchema = (data: any[]): Record<string, string> => {
  if (!data.length) return {};
  
  const schema: Record<string, string> = {};
  const sampleRow = data[0];
  
  Object.keys(sampleRow).forEach(key => {
    const value = sampleRow[key];
    let type = typeof value;
    
    // Enhanced type detection
    if (type === 'number') {
      // Use string representation for the schema type rather than actual TypeScript types
      schema[key] = Number.isInteger(value) ? 'integer_type' : 'float_type';
    } else if (type === 'string') {
      // Check for date
      if (!isNaN(Date.parse(value))) {
        schema[key] = 'date_type';
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        schema[key] = 'email_type';
      } else {
        schema[key] = 'string';
      }
    } else {
      schema[key] = type;
    }
  });
  
  return schema;
};

/**
 * Count missing values in the dataset
 */
const countMissingValues = (data: any[]): number => {
  let count = 0;
  
  data.forEach(row => {
    Object.values(row).forEach(value => {
      if (value === null || value === undefined || value === '') {
        count++;
      }
    });
  });
  
  return count;
};

/**
 * Count duplicate rows in the dataset
 */
const countDuplicates = (data: any[]): number => {
  const stringified = data.map(item => JSON.stringify(item));
  const uniqueSet = new Set(stringified);
  return data.length - uniqueSet.size;
};

/**
 * Detect outliers in numeric columns (simple Z-score method)
 */
const detectOutliers = (data: any[]): number => {
  if (!data.length) return 0;
  
  let outlierCount = 0;
  const numericColumns = Object.keys(data[0]).filter(key => {
    const value = data[0][key];
    return typeof value === 'number';
  });
  
  // For each numeric column, detect outliers
  numericColumns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => typeof v === 'number');
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation
    const squareDiffs = values.map(value => (value - mean) ** 2);
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    // Count values more than 3 standard deviations from mean
    values.forEach(value => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > 3) {
        outlierCount++;
      }
    });
  });
  
  return outlierCount;
};

/**
 * Detect potential issues in the dataset using OpenAI
 */
const detectIssues = async (
  data: any[],
  schema: Record<string, string>,
  apiKey: string
): Promise<string[]> => {
  try {
    // Sample data and provide statistical summary
    const sampleData = data.slice(0, 5);
    const columnStats: Record<string, any> = {};
    
    // Generate basic statistics for each column
    Object.keys(schema).forEach(column => {
      const values = data.map(row => row[column]);
      const numericValues = values.filter(v => typeof v === 'number') as number[];
      
      if (numericValues.length > 0) {
        columnStats[column] = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length
        };
      } else {
        // For non-numeric columns, count unique values
        const uniqueValues = new Set(values);
        columnStats[column] = {
          uniqueCount: uniqueValues.size
        };
      }
    });
    
    const messages: OpenAiMessage[] = [
      {
        role: "system",
        content: "You are a data science expert who specializes in identifying data quality issues and dataset problems."
      },
      {
        role: "user",
        content: `Analyze this dataset and identify potential data quality issues or problems for machine learning. 
        
        Dataset Schema: ${JSON.stringify(schema)}
        Sample Data: ${JSON.stringify(sampleData)}
        Column Statistics: ${JSON.stringify(columnStats)}
        
        Return only a JSON array of strings, each describing a specific issue, with no additional text or explanation. 
        Focus on imbalanced data problems, missing values, outliers, potential encoding issues, and other critical issues.`
      }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16,385,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    try {
      // Parse the response as JSON array
      return JSON.parse(response);
    } catch {
      // Fallback if the AI doesn't return valid JSON
      return response.split('\n').filter(line => line.trim().length > 0);
    }
  } catch (error) {
    console.error('Error detecting issues:', error);
    return ['Could not analyze dataset for issues. OpenAI API error.'];
  }
};

/**
 * Try to detect which column might be the target variable
 * Improved with better heuristics for class detection
 */
const detectPotentialTargetVariable = (
  data: any[],
  schema: Record<string, string>
): string | undefined => {
  if (!data.length) return undefined;
  
  // Common target column names (expanded list)
  const possibleTargetNames = [
    'target', 'label', 'class', 'outcome', 'result', 'y', 'category',
    'Target', 'Label', 'Class', 'Outcome', 'Result', 'Y', 'Category',
    'diagnosis', 'Diagnosis', 'disease', 'Disease', 'condition', 'Condition',
    'type', 'Type', 'classification', 'Classification', 'status', 'Status',
    'group', 'Group', 'response', 'Response', 'dependent', 'Dependent'
  ];
  
  // First check existing columns against common target column names
  for (const name of possibleTargetNames) {
    if (schema[name]) {
      return name;
    }
  }
  
  // Check for columns that contain any of the target names
  for (const column of Object.keys(schema)) {
    for (const targetName of possibleTargetNames) {
      if (column.toLowerCase().includes(targetName.toLowerCase())) {
        return column;
      }
    }
  }
  
  // Find columns with low cardinality (few unique values)
  const columnStats = Object.keys(schema).map(column => {
    const values = data.map(row => row[column]);
    const uniqueValues = new Set(values);
    
    // Calculate entropy to determine if values look like classes
    const valueCounts: Record<string, number> = {};
    values.forEach(val => {
      const strVal = String(val);
      valueCounts[strVal] = (valueCounts[strVal] || 0) + 1;
    });
    
    // Calculate class-like score: lower is more class-like
    // We want columns with few unique values but not too few (at least 2)
    // and not numeric ID-like columns
    const uniqueCount = uniqueValues.size;
    const isNumeric = Array.from(uniqueValues).every(v => !isNaN(Number(v)));
    const hasCommonClassNames = Array.from(uniqueValues).some(val => 
      ['yes', 'no', 'true', 'false', 'positive', 'negative', 'normal', 'abnormal',
       'benign', 'malignant', 'healthy', 'sick', 'active', 'inactive'].includes(String(val).toLowerCase())
    );
    
    // Higher score = more likely to be a target column
    let score = 0;
    
    // Ideal number of classes is between 2 and 10
    if (uniqueCount >= 2 && uniqueCount <= 10) {
      score += 3;
    } else if (uniqueCount > 10 && uniqueCount <= 20) {
      score += 1;
    }
    
    // Prefer non-numeric classes (unless they're binary 0/1)
    if (!isNumeric || (isNumeric && uniqueCount <= 2)) {
      score += 2;
    }
    
    // Bonus for columns that have common class names
    if (hasCommonClassNames) {
      score += 3;
    }
    
    // Penalty for columns that look like IDs
    if (column.toLowerCase().includes('id') || 
        column.toLowerCase().endsWith('_id') || 
        column.toLowerCase().startsWith('id_')) {
      score -= 5;
    }
    
    return {
      column,
      uniqueCount,
      score
    };
  });
  
  // Sort by score descending
  columnStats.sort((a, b) => b.score - a.score);
  
  // Return the column with the highest score if it's positive
  return columnStats.length > 0 && columnStats[0].score > 0 
    ? columnStats[0].column 
    : undefined;
};

/**
 * Detect potential primary key fields in the dataset
 */
const detectPotentialPrimaryKeys = (data: any[]): string[] => {
  if (!data || data.length === 0) return [];
  
  const commonPrimaryKeyNames = [
    'id', 'ID', 'Id', '_id', 
    'patient_id', 'patientId', 'PatientId', 'patientID', 'PatientID',
    'user_id', 'userId', 'UserId', 'userID', 'UserID',
    'customer_id', 'customerId', 'CustomerId', 'customerID', 'CustomerID',
    'record_id', 'recordId', 'RecordId', 'recordID', 'RecordID',
    'uuid', 'UUID', 'guid', 'GUID'
  ];
  
  const potentialKeys: string[] = [];
  const sample = data[0];
  
  // Check for fields with names typically used for primary keys
  Object.keys(sample).forEach(field => {
    if (commonPrimaryKeyNames.includes(field)) {
      potentialKeys.push(field);
      return;
    }
    
    // Check if field name ends with _id, ID, Id
    if (field.endsWith('_id') || field.endsWith('ID') || field.endsWith('Id')) {
      potentialKeys.push(field);
      return;
    }
  });
  
  // If no obvious primary key fields found, check for fields with unique values
  if (potentialKeys.length === 0) {
    Object.keys(sample).forEach(field => {
      // Skip obvious non-key fields
      if (typeof sample[field] === 'object') {
        return;
      }
      
      // Check if values are unique across all records
      const values = new Set(data.map(item => item[field]));
      if (values.size === data.length) {
        potentialKeys.push(field);
      }
    });
  }
  
  return potentialKeys;
};

/**
 * Get AI-generated feature engineering suggestions for imbalanced data
 */
export const getFeatureEngineeringSuggestions = async (
  data: any[],
  preferences: DatasetPreferences,
  apiKey: string | null
): Promise<{ 
  suggestedFeatures: Array<{name: string; description: string; formula: string}>;
  expectedImpact: string;
} | null> => {
  if (!apiKey || !data.length) return null;
  
  try {
    // Sample data and extract schema
    const sampleData = data.slice(0, 5);
    const schema = generateSchema(data);
    
    const messages: OpenAiMessage[] = [
      {
        role: "system",
        content: "You are a data science expert specializing in feature engineering for imbalanced datasets."
      },
      {
        role: "user",
        content: `Suggest new features to engineer for this imbalanced dataset to improve model performance.
        
        Dataset Schema: ${JSON.stringify(schema)}
        Sample Data: ${JSON.stringify(sampleData)}
        Target Column: ${preferences.targetColumn}
        Class Labels: ${JSON.stringify(preferences.classLabels)}
        Majority Class: ${preferences.majorityClass}
        Minority Class: ${preferences.minorityClass}
        Dataset Context: ${preferences.datasetContext || "Not provided"}
        
        Return a JSON object with these properties:
        - suggestedFeatures: Array of objects, each with {name, description, formula}
        - expectedImpact: A short explanation of the expected impact on model performance
        
        Focus on features that will help with the class imbalance problem.`
      }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16,385,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    try {
      // Parse the response as JSON
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing feature suggestions:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting feature suggestions:', error);
    return null;
  }
};

/**
 * Generate synthetic samples to balance the dataset
 */
export const generateSyntheticSamples = async (
  data: any[],
  preferences: DatasetPreferences,
  apiKey: string | null
): Promise<any[] | null> => {
  if (!apiKey || !data.length) return null;
  
  try {
    // Extract schema and sample data
    const sampleData = data.slice(0, 5);
    const schema = generateSchema(data);
    
    // Count occurrences of each class
    const classCounts: Record<string, number> = {};
    const targetColumn = preferences.targetColumn;
    
    data.forEach(row => {
      const className = String(row[targetColumn]);
      classCounts[className] = (classCounts[className] || 0) + 1;
    });
    
    // Determine minority class
    let minorityClass = '';
    let minorityCount = Infinity;
    
    Object.entries(classCounts).forEach(([className, count]) => {
      if (count < minorityCount) {
        minorityCount = count;
        minorityClass = className;
      }
    });
    
    // Get examples of the minority class
    const minorityExamples = data.filter(row => 
      String(row[targetColumn]) === minorityClass
    ).slice(0, 3);
    
    const messages: OpenAiMessage[] = [
      {
        role: "system",
        content: "You are a data science expert specializing in synthetic data generation for imbalanced datasets."
      },
      {
        role: "user",
        content: `Generate 5 synthetic samples for the minority class in this imbalanced dataset.
        
        Dataset Schema: ${JSON.stringify(schema)}
        Target Column: ${targetColumn}
        Minority Class: ${minorityClass}
        Example Minority Class Samples: ${JSON.stringify(minorityExamples)}
        Dataset Context: ${preferences.datasetContext || "Not provided"}
        
        Return only a JSON array of objects, each representing a synthetic data point with the same structure as the examples.
        Ensure variation in the synthetic samples while maintaining the characteristics of the minority class.`
      }
    ];
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16,385,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    try {
      // Parse the response as JSON array
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing synthetic samples:', error);
      return null;
    }
  } catch (error) {
    console.error('Error generating synthetic samples:', error);
    return null;
  }
};
