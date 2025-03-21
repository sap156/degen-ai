import { getCompletion, OpenAiMessage } from "./openAiService";

// Interfaces for imbalanced data operations
export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DatasetInfo {
  totalSamples: number;
  classes: ClassDistribution[];
  isImbalanced: boolean;
  imbalanceRatio: number;
}

export interface BalancingOptions {
  method: 'undersample' | 'oversample' | 'smote' | 'none';
  targetRatio?: number;
}

// Available class colors for visualization
const CLASS_COLORS = [
  '#4f46e5', // indigo-600
  '#0891b2', // cyan-600
  '#16a34a', // green-600
  '#ca8a04', // yellow-600
  '#dc2626', // red-600
  '#9333ea', // purple-600
  '#2563eb', // blue-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#db2777', // pink-600
];

// Generate a sample imbalanced dataset for demonstration
export const generateSampleDataset = (
  classCount: number = 4,
  maxImbalanceRatio: number = 10,
  totalSamples: number = 1000
): DatasetInfo => {
  // Create an array with the specified number of classes
  const classes: ClassDistribution[] = [];
  let remainingSamples = totalSamples;
  
  for (let i = 0; i < classCount - 1; i++) {
    // For all classes except the last one, assign a random number of samples
    const isMinorityClass = i >= Math.floor(classCount / 2);
    const maxClassSamples = isMinorityClass 
      ? Math.floor(totalSamples / (classCount * maxImbalanceRatio))
      : Math.floor(totalSamples / classCount * 2);
    
    const classSamples = Math.max(5, Math.floor(Math.random() * maxClassSamples));
    remainingSamples -= classSamples;
    
    classes.push({
      className: `Class ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
      count: classSamples,
      percentage: 0, // Will calculate after all counts are assigned
      color: CLASS_COLORS[i % CLASS_COLORS.length],
    });
  }
  
  // Assign the remaining samples to the last class
  classes.push({
    className: `Class ${String.fromCharCode(65 + classCount - 1)}`,
    count: Math.max(5, remainingSamples),
    percentage: 0,
    color: CLASS_COLORS[(classCount - 1) % CLASS_COLORS.length],
  });
  
  // Calculate percentages and determine imbalance ratio
  const totalCount = classes.reduce((sum, cls) => sum + cls.count, 0);
  let minClassSize = Infinity;
  let maxClassSize = 0;
  
  classes.forEach(cls => {
    cls.percentage = parseFloat(((cls.count / totalCount) * 100).toFixed(1));
    minClassSize = Math.min(minClassSize, cls.count);
    maxClassSize = Math.max(maxClassSize, cls.count);
  });
  
  // Sort classes by count (descending)
  classes.sort((a, b) => b.count - a.count);
  
  // Calculate imbalance ratio (majority class size / minority class size)
  const imbalanceRatio = parseFloat((maxClassSize / minClassSize).toFixed(2));
  
  return {
    totalSamples,
    classes,
    isImbalanced: imbalanceRatio > 1.5,
    imbalanceRatio,
  };
};

// Apply balancing techniques to the dataset
export const balanceDataset = (
  dataset: DatasetInfo,
  options: BalancingOptions
): DatasetInfo => {
  if (options.method === 'none') {
    return dataset;
  }
  
  const balancedClasses: ClassDistribution[] = JSON.parse(JSON.stringify(dataset.classes));
  const majorityClass = Math.max(...balancedClasses.map(c => c.count));
  const minorityClass = Math.min(...balancedClasses.map(c => c.count));
  
  // Target count based on the specified ratio or default to a moderately balanced dataset
  const targetRatio = options.targetRatio || 1.2;
  let totalSamples = 0;
  
  switch (options.method) {
    case 'undersample':
      // Reduce majority classes
      {
        const targetMajorityCount = Math.ceil(minorityClass * targetRatio);
        
        balancedClasses.forEach(cls => {
          if (cls.count > targetMajorityCount) {
            cls.count = targetMajorityCount;
          }
          totalSamples += cls.count;
        });
      }
      break;
      
    case 'oversample':
      // Increase minority classes
      {
        const targetMinorityCount = Math.floor(majorityClass / targetRatio);
        
        balancedClasses.forEach(cls => {
          if (cls.count < targetMinorityCount) {
            cls.count = targetMinorityCount;
          }
          totalSamples += cls.count;
        });
      }
      break;
      
    case 'smote':
      // Synthetic Minority Over-sampling Technique (simulated)
      // In a real implementation, this would generate synthetic samples
      // Here we'll just simulate by increasing minority classes with a slightly different ratio
      {
        // Use a more moderate increase for SMOTE compared to simple oversampling
        const targetMinorityCount = Math.floor(majorityClass / (targetRatio * 1.2));
        
        balancedClasses.forEach(cls => {
          if (cls.count < targetMinorityCount) {
            cls.count = targetMinorityCount;
          }
          totalSamples += cls.count;
        });
      }
      break;
    
    default:
      // Return original dataset if method is not recognized
      return dataset;
  }
  
  // Recalculate percentages
  balancedClasses.forEach(cls => {
    cls.percentage = parseFloat(((cls.count / totalSamples) * 100).toFixed(1));
  });
  
  // Sort by count (descending)
  balancedClasses.sort((a, b) => b.count - a.count);
  
  // Calculate new imbalance ratio
  const newMaxClass = Math.max(...balancedClasses.map(c => c.count));
  const newMinClass = Math.min(...balancedClasses.map(c => c.count));
  const newImbalanceRatio = parseFloat((newMaxClass / newMinClass).toFixed(2));
  
  return {
    totalSamples,
    classes: balancedClasses,
    isImbalanced: newImbalanceRatio > 1.5,
    imbalanceRatio: newImbalanceRatio,
  };
};

// Identify potential primary key fields in the dataset
export const detectPrimaryKeyFields = (records: any[]): string[] => {
  if (!records || records.length === 0) return [];
  
  const commonPrimaryKeyNames = [
    'id', 'ID', 'Id', '_id', 
    'patient_id', 'patientId', 'PatientId', 'patientID', 'PatientID',
    'user_id', 'userId', 'UserId', 'userID', 'UserID',
    'customer_id', 'customerId', 'CustomerId', 'customerID', 'CustomerID',
    'record_id', 'recordId', 'RecordId', 'recordID', 'RecordID',
    'uuid', 'UUID', 'guid', 'GUID'
  ];
  
  const potentialKeys: string[] = [];
  const sample = records[0];
  
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
      if (field === 'synthetic_id' || typeof sample[field] === 'object') {
        return;
      }
      
      // Check if values are unique across all records
      const values = new Set(records.map(item => item[field]));
      if (values.size === records.length) {
        potentialKeys.push(field);
      }
    });
  }
  
  return potentialKeys;
};

// Generate synthetic samples using improved SMOTE-like algorithm with primary key handling
export const generateSyntheticRecords = (
  records: any[],
  targetColumn: string,
  count: number,
  diversityLevel: 'low' | 'medium' | 'high' = 'medium'
): any[] => {
  if (records.length < 2) {
    console.warn("Need at least 2 records to generate synthetic samples");
    return [];
  }
  
  const syntheticRecords: any[] = [];
  const existingFingerprints = new Set<string>();
  
  // Detect potential primary key fields
  const primaryKeyFields = detectPrimaryKeyFields(records);
  console.log("Detected primary key fields:", primaryKeyFields);
  
  // Track existing key values to avoid duplication
  const existingKeyValues: Record<string, Set<any>> = {};
  primaryKeyFields.forEach(field => {
    existingKeyValues[field] = new Set(records.map(r => r[field]));
  });
  
  // Add fingerprints of original records to avoid duplicates
  records.forEach(record => {
    const fingerprint = createRecordFingerprint(record, targetColumn);
    existingFingerprints.add(fingerprint);
  });
  
  // Set diversity factor based on level
  const baseDiversityFactor = diversityLevel === 'low' ? 0.1 : 
                             diversityLevel === 'medium' ? 0.25 : 0.4;
  
  // Attempt to generate the requested number of unique samples
  let attempts = 0;
  const maxAttempts = count * 5; // Allow multiple attempts to find unique samples
  
  while (syntheticRecords.length < count && attempts < maxAttempts) {
    // Select two random records to interpolate between
    const idx1 = Math.floor(Math.random() * records.length);
    let idx2 = Math.floor(Math.random() * records.length);
    
    // Make sure we select different records if possible
    while (idx2 === idx1 && records.length > 1) {
      idx2 = Math.floor(Math.random() * records.length);
    }
    
    const record1 = records[idx1];
    const record2 = records[idx2];
    
    // Create a new record with properties from both source records
    const syntheticRecord: any = { ...record1 };
    
    // Add synthetic marker
    syntheticRecord.synthetic_id = `syn_${syntheticRecords.length + 1}`;
    
    // Generate unique primary key values for detected primary key fields
    primaryKeyFields.forEach(field => {
      const originalValue = record1[field];
      
      // Handle different types of primary keys
      if (typeof originalValue === 'number') {
        // Find the highest existing ID and increment
        const highestId = Math.max(
          ...[...existingKeyValues[field]].filter(v => typeof v === 'number') as number[]
        );
        syntheticRecord[field] = highestId + syntheticRecords.length + 1;
      } 
      else if (typeof originalValue === 'string' && /^[0-9]+$/.test(originalValue)) {
        // Numeric string IDs
        const numericIds = [...existingKeyValues[field]]
          .filter(v => typeof v === 'string' && /^[0-9]+$/.test(v as string))
          .map(v => parseInt(v as string, 10));
        
        const highestId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
        syntheticRecord[field] = String(highestId + syntheticRecords.length + 1);
      }
      else if (typeof originalValue === 'string') {
        // String IDs
        syntheticRecord[field] = `${originalValue.split('_')[0]}_syn_${syntheticRecords.length + 1}`;
      }
      else if (originalValue !== undefined) {
        // Other types
        syntheticRecord[field] = `${String(originalValue)}_syn_${syntheticRecords.length + 1}`;
      }
      
      // Add this new key value to the tracking set
      if (syntheticRecord[field] !== undefined) {
        existingKeyValues[field].add(syntheticRecord[field]);
      }
    });
    
    // Increase diversity with each generation to avoid duplicates
    const dynamicDiversityFactor = baseDiversityFactor * (1 + (attempts / maxAttempts));
    
    // Interpolate numeric features, add random noise to ensure uniqueness
    Object.keys(record1).forEach(key => {
      // Skip primary key fields and target column
      if (primaryKeyFields.includes(key) || key === targetColumn || key === 'synthetic_id') {
        return;
      }
      
      if (typeof record1[key] === 'number' && typeof record2[key] === 'number') {
        // Basic SMOTE interpolation with random alpha
        const alpha = Math.random();
        let interpolatedValue = record1[key] * alpha + record2[key] * (1 - alpha);
        
        // Add some random noise based on diversity factor
        const noiseRange = Math.abs(record1[key] - record2[key]) * dynamicDiversityFactor;
        const noise = (Math.random() * 2 - 1) * noiseRange; // Random value between -noiseRange and +noiseRange
        interpolatedValue += noise;
        
        // Round to integer if original values were integers
        if (Number.isInteger(record1[key]) && Number.isInteger(record2[key])) {
          syntheticRecord[key] = Math.round(interpolatedValue);
        } else {
          // Keep reasonable precision for floating point values
          syntheticRecord[key] = parseFloat(interpolatedValue.toFixed(4));
        }
      }
    });
    
    // Check if this synthetic record is unique (excluding primary keys from fingerprint)
    const fingerprint = createRecordFingerprint(syntheticRecord, targetColumn, primaryKeyFields);
    
    if (!existingFingerprints.has(fingerprint)) {
      existingFingerprints.add(fingerprint);
      syntheticRecords.push(syntheticRecord);
    }
    
    attempts++;
  }
  
  if (syntheticRecords.length < count) {
    console.warn(`Could only generate ${syntheticRecords.length} unique records out of ${count} requested`);
  }
  
  return syntheticRecords;
};

// Helper function to create a unique fingerprint for a record
const createRecordFingerprint = (
  record: any, 
  excludeKey: string,
  additionalExcludeKeys: string[] = []
): string => {
  const relevantData: Record<string, any> = {};
  
  Object.keys(record).forEach(key => {
    if (key !== excludeKey && 
        key !== 'synthetic_id' && 
        !additionalExcludeKeys.includes(key) && 
        typeof record[key] === 'number') {
      relevantData[key] = record[key];
    }
  });
  
  return JSON.stringify(relevantData);
};

// Get AI recommendations for handling imbalanced data
export const getAIRecommendations = async (
  dataset: DatasetInfo,
  apiKey: string | null
): Promise<string> => {
  if (!apiKey) {
    return "AI recommendations require an OpenAI API key. Please set up your API key to use this feature.";
  }
  
  try {
    const messages: OpenAiMessage[] = [
      {
        role: "system",
        content: "You are an expert in machine learning and data science specializing in handling imbalanced datasets. Provide practical recommendations for the given dataset."
      },
      {
        role: "user",
        content: `I have a dataset with the following class distribution:
        
        ${dataset.classes.map(c => `${c.className}: ${c.count} samples (${c.percentage}%)`).join('\n')}
        
        Total samples: ${dataset.totalSamples}
        Imbalance ratio: ${dataset.imbalanceRatio}
        
        Please provide specific recommendations for handling this imbalanced dataset, including:
        1. Which sampling techniques might work best
        2. Algorithm recommendations
        3. Evaluation metrics to use
        4. Any other best practices`
      }
    ];
    
    return await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model: 'gpt-4o'
    });
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return "An error occurred while fetching AI recommendations. Please try again later.";
  }
};

// Export data as JSON
export const exportAsJson = (data: DatasetInfo): string => {
  return JSON.stringify(data, null, 2);
};

// Export data as CSV
export const exportAsCsv = (data: DatasetInfo): string => {
  const headers = ['Class', 'Count', 'Percentage'];
  const rows = data.classes.map(cls => 
    [cls.className, cls.count.toString(), cls.percentage.toString()]
  );
  
  // Add summary row
  rows.push(['Total', data.totalSamples.toString(), '100.0']);
  rows.push(['Imbalance Ratio', data.imbalanceRatio.toString(), '']);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Download data as a file
export const downloadData = (data: string, filename: string, type: 'json' | 'csv'): void => {
  const blob = new Blob([data], { type: type === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
