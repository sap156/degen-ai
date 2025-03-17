export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
}

export interface DatasetInfo {
  totalSamples: number;
  classes: ClassDistribution[];
  isImbalanced: boolean;
  imbalanceRatio: number;
  minorityClass: string;
  majorityClass: string;
}

export interface BalancingOptions {
  technique: 'oversampling' | 'undersampling' | 'hybrid';
  ratio: number;
  preserveDistribution?: boolean;
}

export interface BalancedDataResult {
  data: any[];
  originalCount: number;
  balancedCount: number;
  classDistribution: ClassDistribution[];
}

export const analyzeClassDistribution = (
  data: any[],
  targetColumn: string
): DatasetInfo => {
  // Count instances of each class
  const classCounts: Record<string, number> = {};
  
  data.forEach(item => {
    const className = String(item[targetColumn]);
    classCounts[className] = (classCounts[className] || 0) + 1;
  });
  
  // Calculate distribution and find min/max classes
  const totalSamples = data.length;
  let minClass = '';
  let maxClass = '';
  let minCount = Infinity;
  let maxCount = 0;
  
  const classes: ClassDistribution[] = Object.entries(classCounts).map(([className, count]) => {
    const percentage = (count / totalSamples) * 100;
    
    if (count < minCount) {
      minCount = count;
      minClass = className;
    }
    
    if (count > maxCount) {
      maxCount = count;
      maxClass = className;
    }
    
    return { className, count, percentage };
  });
  
  // Sort classes by count (ascending)
  classes.sort((a, b) => a.count - b.count);
  
  // Calculate imbalance ratio (majority class count / minority class count)
  const imbalanceRatio = maxCount / minCount;
  
  return {
    totalSamples,
    classes,
    isImbalanced: imbalanceRatio > 1.5, // Common threshold, could be configurable
    imbalanceRatio,
    minorityClass: minClass,
    majorityClass: maxClass
  };
};

export const balanceDataset = (
  data: any[],
  targetColumn: string,
  options: BalancingOptions,
  datasetInfo: DatasetInfo
): BalancedDataResult => {
  const { technique, ratio } = options;
  const { classes, minorityClass, majorityClass } = datasetInfo;
  
  const classSamples: Record<string, any[]> = {};
  
  // Group samples by class
  data.forEach(item => {
    const className = String(item[targetColumn]);
    classSamples[className] = classSamples[className] || [];
    classSamples[className].push({ ...item });
  });
  
  let balancedData: any[] = [];
  
  switch (technique) {
    case 'oversampling':
      balancedData = oversampleMinorityClasses(classSamples, classes, ratio, minorityClass, majorityClass);
      break;
      
    case 'undersampling':
      balancedData = undersampleMajorityClasses(classSamples, classes, ratio, minorityClass, majorityClass);
      break;
      
    case 'hybrid':
      balancedData = hybridBalancing(classSamples, classes, ratio, minorityClass, majorityClass);
      break;
  }
  
  // Calculate new class distribution
  const newClassCounts: Record<string, number> = {};
  
  balancedData.forEach(item => {
    const className = String(item[targetColumn]);
    newClassCounts[className] = (newClassCounts[className] || 0) + 1;
  });
  
  const newDistribution: ClassDistribution[] = Object.entries(newClassCounts).map(([className, count]) => {
    const percentage = (count / balancedData.length) * 100;
    return { className, count, percentage };
  });
  
  // Sort by count (ascending)
  newDistribution.sort((a, b) => a.count - b.count);
  
  return {
    data: balancedData,
    originalCount: data.length,
    balancedCount: balancedData.length,
    classDistribution: newDistribution
  };
};

// Helper function for oversampling
const oversampleMinorityClasses = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  const majorityCount = classSamples[majorityClass].length;
  let result: any[] = [];
  
  // Add all original samples
  Object.values(classSamples).forEach(samples => {
    result = result.concat(samples);
  });
  
  // Oversample minority classes
  classes.forEach(classInfo => {
    if (classInfo.className === majorityClass) return;
    
    const currentCount = classSamples[classInfo.className].length;
    const targetCount = Math.round(majorityCount / targetRatio);
    
    if (currentCount >= targetCount) return;
    
    const samplesToAdd = targetCount - currentCount;
    const samples = classSamples[classInfo.className];
    
    for (let i = 0; i < samplesToAdd; i++) {
      // Pick a random sample to duplicate with slight modifications
      const randomIndex = Math.floor(Math.random() * samples.length);
      const sample = { ...samples[randomIndex] };
      
      // Add a synthetic ID to track generated samples
      sample.synthetic_id = `synth_${classInfo.className}_${i}`;
      
      // Add small variations to numeric fields to avoid exact duplicates
      for (const key in sample) {
        if (typeof sample[key] === 'number' && key !== 'id') {
          // Add small random noise (±2%)
          const noise = (Math.random() * 0.04) - 0.02;
          sample[key] = sample[key] * (1 + noise);
        }
      }
      
      result.push(sample);
    }
  });
  
  return result;
};

// Helper function for undersampling
const undersampleMajorityClasses = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  const minorityCount = classSamples[minorityClass].length;
  let result: any[] = [];
  
  // Add samples based on target ratio
  classes.forEach(classInfo => {
    const samples = classSamples[classInfo.className];
    
    if (classInfo.className === minorityClass) {
      // Add all minority class samples
      result = result.concat(samples);
    } else {
      // Sample the majority classes
      const targetCount = Math.round(minorityCount * targetRatio);
      const count = Math.min(samples.length, targetCount);
      
      // Randomly select samples
      const shuffled = [...samples].sort(() => 0.5 - Math.random());
      result = result.concat(shuffled.slice(0, count));
    }
  });
  
  return result;
};

// Helper function for hybrid approach
const hybridBalancing = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  // Calculate median class size
  const classSizes = classes.map(c => c.count);
  const medianSize = getMedian(classSizes);
  
  let result: any[] = [];
  
  // Process each class
  classes.forEach(classInfo => {
    const samples = classSamples[classInfo.className];
    
    if (classInfo.count < medianSize) {
      // Oversample classes below median
      const targetCount = Math.round(medianSize * 0.8);
      const samplesToAdd = targetCount - classInfo.count;
      
      // Add all original samples
      result = result.concat(samples);
      
      // Add synthetic samples
      for (let i = 0; i < samplesToAdd; i++) {
        // Pick a random sample to duplicate with slight modifications
        const randomIndex = Math.floor(Math.random() * samples.length);
        const sample = { ...samples[randomIndex] };
        
        // Add a synthetic ID
        sample.synthetic_id = `synth_hybrid_${classInfo.className}_${i}`;
        
        // Add variations to avoid duplicates
        for (const key in sample) {
          if (typeof sample[key] === 'number' && key !== 'id') {
            const noise = (Math.random() * 0.06) - 0.03;
            sample[key] = sample[key] * (1 + noise);
          }
        }
        
        result.push(sample);
      }
    } else if (classInfo.count > medianSize * targetRatio) {
      // Undersample classes significantly above median
      const targetCount = Math.round(medianSize * targetRatio);
      
      // Randomly select samples
      const shuffled = [...samples].sort(() => 0.5 - Math.random());
      result = result.concat(shuffled.slice(0, targetCount));
    } else {
      // Keep classes near the median as they are
      result = result.concat(samples);
    }
  });
  
  return result;
};

// Helper function to get median value
const getMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
};

// Synthetic record generation function
export const generateSyntheticRecords = (
  samples: any[],
  targetColumn: string,
  count: number,
  diversity: 'low' | 'medium' | 'high' = 'medium'
): any[] => {
  if (!samples || samples.length === 0) return [];
  
  const syntheticSamples = [];
  const diversityFactor = diversity === 'low' ? 0.05 : diversity === 'medium' ? 0.15 : 0.25;
  
  for (let i = 0; i < count; i++) {
    // Pick a random sample to use as base
    const baseSample = samples[Math.floor(Math.random() * samples.length)];
    const syntheticSample = { ...baseSample };
    
    // Add synthetic_id
    syntheticSample.synthetic_id = `syn_${i + 1}`;
    
    // Vary numeric features
    for (const key in syntheticSample) {
      if (key !== targetColumn && 
          key !== 'id' && 
          key !== 'synthetic_id' && 
          typeof syntheticSample[key] === 'number') {
        
        const originalValue = syntheticSample[key];
        // Add randomness based on diversity level
        const randomVariation = Math.random() * diversityFactor * 2 - diversityFactor;
        const additionalRandomness = Math.random() * 0.02 * (1 + i % 10);
        
        syntheticSample[key] = originalValue + (originalValue * (randomVariation + additionalRandomness));
        
        // Round to reasonable decimal places
        if (Number.isInteger(baseSample[key])) {
          syntheticSample[key] = Math.round(syntheticSample[key]);
        } else {
          // Keep a few decimal places for non-integer values
          syntheticSample[key] = parseFloat(syntheticSample[key].toFixed(4));
        }
      }
    }
    
    syntheticSamples.push(syntheticSample);
  }
  
  return syntheticSamples;
};
