/**
 * Service for handling imbalanced datasets
 */

export interface DatasetInfo {
  classes: Array<{ className: string; count: number; percentage: number }>;
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
