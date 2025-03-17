
/**
 * Service for handling imbalanced datasets
 */

export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
  color?: string; // Added color property for visualization
}

export interface DatasetInfo {
  classes: ClassDistribution[];
  totalSamples: number;
  isImbalanced: boolean;
  imbalanceRatio: number;
  minorityClass: string;
  majorityClass: string;
}

export interface BalancedDataResult {
  originalData: any[];
  balancedData: any[];
  minorityCount: number;
  majorityCount: number;
  targetColumn: string;
  technique: string;
  classes?: ClassDistribution[];
  imbalanceRatio?: number;
  isImbalanced?: boolean;
  totalSamples?: number;
  minorityClass?: string;
  majorityClass?: string;
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
  
  // Calculate class distributions for the balanced dataset
  const classes = calculateClassDistributions(balancedData, targetColumn);
  const totalSamples = balancedData.length;
  const imbalanceRatio = calculateImbalanceRatio(classes);
  const isImbalanced = imbalanceRatio > 1.5;

  return {
    originalData: data,
    balancedData,
    minorityCount,
    majorityCount: sampledMajority.length,
    targetColumn,
    technique: 'undersampling',
    classes,
    totalSamples,
    imbalanceRatio,
    isImbalanced,
    minorityClass,
    majorityClass
  };
};

/**
 * Balance dataset by oversampling the minority class
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
  
  // Calculate class distributions for the balanced dataset
  const classes = calculateClassDistributions(balancedData, targetColumn);
  const totalSamples = balancedData.length;
  const imbalanceRatio = calculateImbalanceRatio(classes);
  const isImbalanced = imbalanceRatio > 1.5;
  
  return {
    originalData: data,
    balancedData,
    minorityCount: minorityCount + syntheticSamples.length,
    majorityCount,
    targetColumn,
    technique: 'oversampling',
    classes,
    totalSamples,
    imbalanceRatio,
    isImbalanced,
    minorityClass,
    majorityClass
  };
};

/**
 * Balance dataset using hybrid approach (both under and oversampling)
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
  
  // Calculate class distributions for the balanced dataset
  const classes = calculateClassDistributions(balancedData, targetColumn);
  const totalSamples = balancedData.length;
  const imbalanceRatio = calculateImbalanceRatio(classes);
  const isImbalanced = imbalanceRatio > 1.5;
  
  return {
    originalData: data,
    balancedData,
    minorityCount: minorityCount + syntheticSamples.length,
    majorityCount: undersampledMajority.length,
    targetColumn,
    technique: 'hybrid',
    classes,
    totalSamples,
    imbalanceRatio,
    isImbalanced,
    minorityClass,
    majorityClass
  };
};

/**
 * Helper function to calculate class distributions
 */
const calculateClassDistributions = (data: any[], targetColumn: string): ClassDistribution[] => {
  const classCounts: Record<string, number> = {};
  
  data.forEach(item => {
    const className = String(item[targetColumn]);
    classCounts[className] = (classCounts[className] || 0) + 1;
  });
  
  const totalSamples = data.length;
  
  const classColors = [
    '#4f46e5', '#0891b2', '#16a34a', '#ca8a04', 
    '#dc2626', '#9333ea', '#2563eb', '#059669', 
    '#d97706', '#db2777'
  ];
  
  const distributions = Object.entries(classCounts).map(([className, count], index) => ({
    className,
    count,
    percentage: parseFloat(((count / totalSamples) * 100).toFixed(1)),
    color: classColors[index % classColors.length]
  }));
  
  return distributions.sort((a, b) => b.count - a.count);
};

/**
 * Helper function to calculate imbalance ratio
 */
const calculateImbalanceRatio = (classes: ClassDistribution[]): number => {
  if (classes.length < 2) return 1;
  const maxCount = classes[0].count;
  const minCount = classes[classes.length - 1].count;
  return minCount > 0 ? parseFloat((maxCount / minCount).toFixed(2)) : maxCount;
};

/**
 * Balance a dataset based on specified options
 * @param dataset The dataset to balance
 * @param options Balancing options
 * @returns Balanced dataset result
 */
export const balanceDataset = (
  dataset: DatasetInfo,
  options: BalancingOptions
): DatasetInfo => {
  // Create a mock balancing result that satisfies the DatasetInfo interface
  // This just maintains the shape but doesn't actually do the balancing
  // You would need to implement actual balancing logic based on your data structure
  
  let balancedClasses = [...dataset.classes];
  let totalSamples = dataset.totalSamples;
  
  const majorityClass = dataset.majorityClass;
  const minorityClass = dataset.minorityClass;
  
  // Simple example for adjusting class counts (not actual balancing)
  if (options.method === 'undersample') {
    // Reduce majority class
    balancedClasses = balancedClasses.map(cls => {
      if (cls.className === majorityClass) {
        const newCount = Math.ceil(cls.count * options.targetRatio);
        return {
          ...cls,
          count: newCount,
          percentage: 0 // Will be recalculated below
        };
      }
      return cls;
    });
  } else if (options.method === 'oversample') {
    // Increase minority class
    balancedClasses = balancedClasses.map(cls => {
      if (cls.className === minorityClass) {
        const newCount = Math.ceil(cls.count * (1 + options.targetRatio));
        return {
          ...cls,
          count: newCount,
          percentage: 0 // Will be recalculated below
        };
      }
      return cls;
    });
  }
  
  // Recalculate total samples and percentages
  totalSamples = balancedClasses.reduce((sum, cls) => sum + cls.count, 0);
  balancedClasses = balancedClasses.map(cls => ({
    ...cls,
    percentage: parseFloat(((cls.count / totalSamples) * 100).toFixed(1))
  }));
  
  // Recalculate imbalance ratio
  const maxClassSize = balancedClasses.length > 0 ? balancedClasses[0].count : 0;
  const minClassSize = balancedClasses.length > 0 ? balancedClasses[balancedClasses.length - 1].count : 0;
  const imbalanceRatio = minClassSize > 0 ? parseFloat((maxClassSize / minClassSize).toFixed(2)) : 0;
  
  return {
    classes: balancedClasses,
    totalSamples,
    isImbalanced: imbalanceRatio > 1.5,
    imbalanceRatio,
    minorityClass,
    majorityClass
  };
};

/**
 * Exports data as JSON
 * @param data The data to export
 * @returns JSON string
 */
export const exportAsJson = (data: any): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Exports data as CSV
 * @param data The data to export
 * @returns CSV string
 */
export const exportAsCsv = (data: any): string => {
  if (!data || !data.classes || data.classes.length === 0) return '';
  
  // Headers
  const headers = ['className', 'count', 'percentage'];
  
  // Rows
  const rows = data.classes.map((cls: ClassDistribution) => {
    return [cls.className, cls.count, cls.percentage].join(',');
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
