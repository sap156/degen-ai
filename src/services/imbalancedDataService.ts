
/**
 * Service for handling imbalanced datasets
 */

export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
  color?: string; // Add color property for visualization
}

export interface DatasetInfo {
  classes: Array<ClassDistribution>;
  imbalanceRatio: number;
  minorityClass: string;
  majorityClass: string;
  totalSamples: number;  // Add the missing totalSamples property
  isImbalanced: boolean; // Add the missing isImbalanced property
}

export interface BalancedDataResult {
  originalData: any[];
  balancedData: any[];
  minorityCount: number;
  majorityCount: number;
  targetColumn: string;
  technique: string;
}

export interface BalancingOptions {
  method: 'none' | 'undersample' | 'oversample' | 'smote' | 'hybrid';
  targetRatio: number;
  targetColumn?: string;
}

/**
 * Generate synthetic records based on minority class samples
 * @param minoritySamples Samples from the minority class
 * @param targetColumn Column containing the class label
 * @param count Number of synthetic records to generate
 * @param diversity Level of diversity in generated records
 * @returns Array of synthetic records
 */
export const generateSyntheticRecords = (
  minoritySamples: any[],
  targetColumn: string,
  count: number,
  diversity: 'low' | 'medium' | 'high' = 'medium'
): any[] => {
  const syntheticRecords = [];
  const diversityFactor = diversity === 'low' ? 0.05 : diversity === 'medium' ? 0.15 : 0.25;
  
  // Generate the requested number of synthetic records
  for (let i = 0; i < count; i++) {
    // Select a random minority sample as the base
    const baseSample = {...minoritySamples[Math.floor(Math.random() * minoritySamples.length)]};
    
    // Add synthetic_id property to track synthetic records
    baseSample.synthetic_id = `syn_${i + 1}`;
    
    // Modify numeric features with some randomness
    for (const key in baseSample) {
      // Skip the target column and synthetic_id
      if (key === targetColumn || key === 'synthetic_id') continue;
      
      // Only modify numeric features
      if (typeof baseSample[key] === 'number') {
        const originalValue = baseSample[key];
        
        // Add randomness based on diversity level
        const randomVariation = (Math.random() * 2 - 1) * diversityFactor;
        baseSample[key] = originalValue + (originalValue * randomVariation);
        
        // Round to reasonable decimal places if the original was an integer
        if (Number.isInteger(originalValue)) {
          baseSample[key] = Math.round(baseSample[key]);
        } else {
          // Keep a few decimal places for non-integer values
          baseSample[key] = parseFloat(baseSample[key].toFixed(4));
        }
      }
    }
    
    syntheticRecords.push(baseSample);
  }
  
  return syntheticRecords;
};

/**
 * Balance dataset by undersampling the majority class
 * @param data Original dataset
 * @param targetColumn Column containing the class label
 * @param minorityClass Value of the minority class
 * @param majorityClass Value of the majority class
 * @param ratio Balancing ratio (0-1)
 * @returns Balanced dataset
 */
export const balanceByUndersampling = (
  data: any[],
  targetColumn: string,
  minorityClass: string,
  majorityClass: string,
  ratio: number = 1
): BalancedDataResult => {
  // Filter minority and majority samples
  const minoritySamples = data.filter(item => String(item[targetColumn]) === minorityClass);
  const majoritySamples = data.filter(item => String(item[targetColumn]) === majorityClass);
  
  const minorityCount = minoritySamples.length;
  const targetMajorityCount = ratio === 1 
    ? minorityCount 
    : Math.round(majoritySamples.length - (ratio * (majoritySamples.length - minorityCount)));
  
  // Randomly sample from majority class
  const sampledMajority = [...majoritySamples]
    .sort(() => Math.random() - 0.5)
    .slice(0, targetMajorityCount);
  
  // Combine minority samples with sampled majority
  const balancedData = [...minoritySamples, ...sampledMajority];
  
  return {
    originalData: data,
    balancedData,
    minorityCount,
    majorityCount: sampledMajority.length,
    targetColumn,
    technique: 'undersampling'
  };
};

/**
 * Balance dataset by oversampling the minority class
 * @param data Original dataset
 * @param targetColumn Column containing the class label
 * @param minorityClass Value of the minority class
 * @param majorityClass Value of the majority class
 * @param ratio Balancing ratio (0-1)
 * @returns Balanced dataset
 */
export const balanceByOversampling = (
  data: any[],
  targetColumn: string,
  minorityClass: string,
  majorityClass: string,
  ratio: number = 1
): BalancedDataResult => {
  // Filter minority and majority samples
  const minoritySamples = data.filter(item => String(item[targetColumn]) === minorityClass);
  const majoritySamples = data.filter(item => String(item[targetColumn]) === majorityClass);
  
  const minorityCount = minoritySamples.length;
  const majorityCount = majoritySamples.length;
  
  // Calculate how many synthetic samples to generate
  const targetMinorityCount = ratio === 1 
    ? majorityCount 
    : Math.round(minorityCount + (ratio * (majorityCount - minorityCount)));
  
  const syntheticCount = targetMinorityCount - minorityCount;
  
  // Generate synthetic samples
  const syntheticSamples = generateSyntheticRecords(
    minoritySamples,
    targetColumn,
    syntheticCount,
    'medium'
  );
  
  // Combine all samples
  const balancedData = [...data, ...syntheticSamples];
  
  return {
    originalData: data,
    balancedData,
    minorityCount: minorityCount + syntheticSamples.length,
    majorityCount,
    targetColumn,
    technique: 'oversampling'
  };
};

/**
 * Balance dataset using hybrid approach (both under and oversampling)
 * @param data Original dataset
 * @param targetColumn Column containing the class label
 * @param minorityClass Value of the minority class
 * @param majorityClass Value of the majority class
 * @param ratio Balancing ratio (0-1)
 * @returns Balanced dataset
 */
export const balanceByHybrid = (
  data: any[],
  targetColumn: string,
  minorityClass: string,
  majorityClass: string,
  ratio: number = 0.5
): BalancedDataResult => {
  // Filter minority and majority samples
  const minoritySamples = data.filter(item => String(item[targetColumn]) === minorityClass);
  const majoritySamples = data.filter(item => String(item[targetColumn]) === majorityClass);
  
  const minorityCount = minoritySamples.length;
  const majorityCount = majoritySamples.length;
  
  // Calculate the target counts for both classes
  const targetCount = Math.round((minorityCount + majorityCount) / 2);
  
  // Undersample majority class
  const undersampledMajority = [...majoritySamples]
    .sort(() => Math.random() - 0.5)
    .slice(0, targetCount);
  
  // Oversample minority class
  const syntheticCount = targetCount - minorityCount;
  const syntheticSamples = generateSyntheticRecords(
    minoritySamples,
    targetColumn,
    syntheticCount,
    'medium'
  );
  
  // Combine samples
  const balancedData = [...undersampledMajority, ...minoritySamples, ...syntheticSamples];
  
  return {
    originalData: data,
    balancedData,
    minorityCount: minorityCount + syntheticSamples.length,
    majorityCount: undersampledMajority.length,
    targetColumn,
    technique: 'hybrid'
  };
};

/**
 * Balance a dataset based on specified options
 * @param data The dataset to balance
 * @param options Balancing options
 * @returns Balanced dataset result
 */
export const balanceDataset = (
  data: any[],
  options: BalancingOptions,
  targetColumn: string,
  minorityClass: string,
  majorityClass: string
): BalancedDataResult => {
  switch (options.method) {
    case 'undersample':
      return balanceByUndersampling(data, targetColumn, minorityClass, majorityClass, options.targetRatio);
    case 'oversample':
      return balanceByOversampling(data, targetColumn, minorityClass, majorityClass, options.targetRatio);
    case 'smote':
      // SMOTE is a specialized form of oversampling
      return balanceByOversampling(data, targetColumn, minorityClass, majorityClass, options.targetRatio);
    case 'hybrid':
      return balanceByHybrid(data, targetColumn, minorityClass, majorityClass, options.targetRatio);
    case 'none':
    default:
      return {
        originalData: data,
        balancedData: data,
        minorityCount: data.filter(item => String(item[targetColumn]) === minorityClass).length,
        majorityCount: data.filter(item => String(item[targetColumn]) === majorityClass).length,
        targetColumn,
        technique: 'none'
      };
  }
};

/**
 * Exports data as JSON
 * @param data The data to export
 * @returns JSON string
 */
export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Exports data as CSV
 * @param data The data to export
 * @returns CSV string
 */
export const exportAsCsv = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  
  // Get headers from first item
  const headers = Object.keys(data[0]);
  
  // Convert each data row to CSV
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle CSV special characters
      const cellValue = value === null || value === undefined ? '' : String(value);
      
      // Quote values with commas, quotes, or newlines
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        return `"${cellValue.replace(/"/g, '""')}"`;
      }
      
      return cellValue;
    }).join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Downloads data as a file
 * @param data The data content to download
 * @param filename The name of the file without extension
 * @param format The file format ('json' or 'csv')
 */
export const downloadData = (data: string, filename: string, format: 'json' | 'csv'): void => {
  // Create file extension based on format
  const extension = format === 'json' ? 'json' : 'csv';
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  
  // Create a blob and download link
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  
  // Append to the document, click, and clean up
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
