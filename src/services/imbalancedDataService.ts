import * as openAiService from './openAiService';

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
  minorityClass: string;
  majorityClass: string;
}

export interface BalancingOptions {
  technique: 'undersampling' | 'oversampling' | 'smote' | 'tomek' | 'hybrid';
  targetRatio: number;
  preserveMinorityClass: boolean;
  randomSeed?: number;
}

export interface BalancedDataResult {
  data: any[];
  originalCounts: Record<string, number>;
  newCounts: Record<string, number>;
  balancingDetails: {
    technique: string;
    targetRatio: number;
    addedSamples?: number;
    removedSamples?: number;
  };
}

export const analyzeClassDistribution = (
  data: any[],
  targetColumn: string
): DatasetInfo => {
  const classCounts: Record<string, number> = {};
  
  data.forEach(item => {
    const className = String(item[targetColumn]);
    classCounts[className] = (classCounts[className] || 0) + 1;
  });
  
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
    
    return { className, count, percentage, color: 'blue' };
  });
  
  classes.sort((a, b) => a.count - b.count);
  
  const imbalanceRatio = maxCount / minCount;
  
  return {
    totalSamples,
    classes,
    isImbalanced: imbalanceRatio > 1.5,
    imbalanceRatio,
    minorityClass: minClass,
    majorityClass: maxClass
  };
};

export const balanceDataset = async (
  data: any[],
  targetColumn: string,
  options: BalancingOptions,
  apiKey: string
): Promise<BalancedDataResult> => {
  const { technique, targetRatio, preserveMinorityClass, randomSeed } = options;
  const { classes, minorityClass, majorityClass } = analyzeClassDistribution(data, targetColumn);
  
  const classSamples: Record<string, any[]> = {};
  
  data.forEach(item => {
    const className = String(item[targetColumn]);
    classSamples[className] = classSamples[className] || [];
    classSamples[className].push({ ...item });
  });
  
  let balancedData: any[] = [];
  
  switch (technique) {
    case 'undersampling':
      balancedData = undersampleMajorityClasses(classSamples, classes, targetRatio, minorityClass, majorityClass);
      break;
      
    case 'oversampling':
      balancedData = oversampleMinorityClasses(classSamples, classes, targetRatio, minorityClass, majorityClass);
      break;
      
    case 'smote':
      balancedData = smoteBalancing(classSamples, classes, targetRatio, minorityClass, majorityClass);
      break;
      
    case 'tomek':
      balancedData = tomenBalancing(classSamples, classes, targetRatio, minorityClass, majorityClass);
      break;
      
    case 'hybrid':
      balancedData = hybridBalancing(classSamples, classes, targetRatio, minorityClass, majorityClass);
      break;
  }
  
  const newClassCounts: Record<string, number> = {};
  
  balancedData.forEach(item => {
    const className = String(item[targetColumn]);
    newClassCounts[className] = (newClassCounts[className] || 0) + 1;
  });
  
  const newDistribution: ClassDistribution[] = Object.entries(newClassCounts).map(([className, count]) => {
    const percentage = (count / balancedData.length) * 100;
    return { className, count, percentage, color: 'blue' };
  });
  
  newDistribution.sort((a, b) => a.count - b.count);
  
  return {
    data: balancedData,
    originalCounts: classCounts,
    newCounts: newClassCounts,
    balancingDetails: {
      technique,
      targetRatio,
      addedSamples: balancedData.length - data.length,
      removedSamples: data.length - balancedData.length
    }
  };
};

const oversampleMinorityClasses = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  const majorityCount = classSamples[majorityClass].length;
  let result: any[] = [];
  
  Object.values(classSamples).forEach(samples => {
    result = result.concat(samples);
  });
  
  classes.forEach(classInfo => {
    if (classInfo.className === majorityClass) return;
    
    const currentCount = classSamples[classInfo.className].length;
    const targetCount = Math.round(majorityCount / targetRatio);
    
    if (currentCount >= targetCount) return;
    
    const samplesToAdd = targetCount - currentCount;
    const samples = classSamples[classInfo.className];
    
    for (let i = 0; i < samplesToAdd; i++) {
      const randomIndex = Math.floor(Math.random() * samples.length);
      const sample = { ...samples[randomIndex] };
      
      sample.synthetic_id = `synth_${classInfo.className}_${i}`;
      
      for (const key in sample) {
        if (typeof sample[key] === 'number' && key !== 'id') {
          const noise = (Math.random() * 0.04) - 0.02;
          sample[key] = sample[key] * (1 + noise);
        }
      }
      
      result.push(sample);
    }
  });
  
  return result;
};

const undersampleMajorityClasses = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  const minorityCount = classSamples[minorityClass].length;
  let result: any[] = [];
  
  classes.forEach(classInfo => {
    const samples = classSamples[classInfo.className];
    
    if (classInfo.className === minorityClass) {
      result = result.concat(samples);
    } else {
      const targetCount = Math.round(minorityCount * targetRatio);
      const count = Math.min(samples.length, targetCount);
      
      const shuffled = [...samples].sort(() => 0.5 - Math.random());
      result = result.concat(shuffled.slice(0, count));
    }
  });
  
  return result;
};

const smoteBalancing = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  const majorityCount = classSamples[majorityClass].length;
  let result: any[] = [];
  
  Object.values(classSamples).forEach(samples => {
    result = result.concat(samples);
  });
  
  classes.forEach(classInfo => {
    if (classInfo.className === majorityClass) return;
    
    const currentCount = classSamples[classInfo.className].length;
    const targetCount = Math.round(majorityCount / targetRatio);
    
    if (currentCount >= targetCount) return;
    
    const samplesToAdd = targetCount - currentCount;
    const samples = classSamples[classInfo.className];
    
    for (let i = 0; i < samplesToAdd; i++) {
      const randomIndex = Math.floor(Math.random() * samples.length);
      const sample = { ...samples[randomIndex] };
      
      sample.synthetic_id = `synth_${classInfo.className}_${i}`;
      
      for (const key in sample) {
        if (typeof sample[key] === 'number' && key !== 'id') {
          const noise = (Math.random() * 0.04) - 0.02;
          sample[key] = sample[key] * (1 + noise);
        }
      }
      
      result.push(sample);
    }
  });
  
  return result;
};

const tomenBalancing = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  const majorityCount = classSamples[majorityClass].length;
  let result: any[] = [];
  
  Object.values(classSamples).forEach(samples => {
    result = result.concat(samples);
  });
  
  classes.forEach(classInfo => {
    if (classInfo.className === majorityClass) return;
    
    const currentCount = classSamples[classInfo.className].length;
    const targetCount = Math.round(majorityCount / targetRatio);
    
    if (currentCount >= targetCount) return;
    
    const samplesToAdd = targetCount - currentCount;
    const samples = classSamples[classInfo.className];
    
    for (let i = 0; i < samplesToAdd; i++) {
      const randomIndex = Math.floor(Math.random() * samples.length);
      const sample = { ...samples[randomIndex] };
      
      sample.synthetic_id = `synth_${classInfo.className}_${i}`;
      
      for (const key in sample) {
        if (typeof sample[key] === 'number' && key !== 'id') {
          const noise = (Math.random() * 0.04) - 0.02;
          sample[key] = sample[key] * (1 + noise);
        }
      }
      
      result.push(sample);
    }
  });
  
  return result;
};

const hybridBalancing = (
  classSamples: Record<string, any[]>,
  classes: ClassDistribution[],
  targetRatio: number,
  minorityClass: string,
  majorityClass: string
): any[] => {
  const classSizes = classes.map(c => c.count);
  const medianSize = getMedian(classSizes);
  
  let result: any[] = [];
  
  classes.forEach(classInfo => {
    const samples = classSamples[classInfo.className];
    
    if (classInfo.count < medianSize) {
      const targetCount = Math.round(medianSize * 0.8);
      const samplesToAdd = targetCount - classInfo.count;
      
      result = result.concat(samples);
      
      for (let i = 0; i < samplesToAdd; i++) {
        const randomIndex = Math.floor(Math.random() * samples.length);
        const sample = { ...samples[randomIndex] };
        
        sample.synthetic_id = `synth_hybrid_${classInfo.className}_${i}`;
        
        for (const key in sample) {
          if (typeof sample[key] === 'number' && key !== 'id') {
            const noise = (Math.random() * 0.06) - 0.03;
            sample[key] = sample[key] * (1 + noise);
          }
        }
        
        result.push(sample);
      }
    } else if (classInfo.count > medianSize * targetRatio) {
      const targetCount = Math.round(medianSize * targetRatio);
      
      const shuffled = [...samples].sort(() => 0.5 - Math.random());
      result = result.concat(shuffled.slice(0, targetCount));
    } else {
      result = result.concat(samples);
    }
  });
  
  return result;
};

const getMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
};

export const generateSyntheticRecords = async (
  data: any[],
  targetColumn: string,
  minorityClass: string,
  count: number,
  apiKey: string
): Promise<any[]> => {
  if (!data || data.length === 0) return [];
  
  const syntheticSamples = [];
  const diversityFactor = 0.15;
  
  for (let i = 0; i < count; i++) {
    const baseSample = data[Math.floor(Math.random() * data.length)];
    const syntheticSample = { ...baseSample };
    
    syntheticSample.synthetic_id = `syn_${i + 1}`;
    
    for (const key in syntheticSample) {
      if (key !== targetColumn && 
          key !== 'id' && 
          key !== 'synthetic_id' && 
          typeof syntheticSample[key] === 'number') {
        
        const originalValue = syntheticSample[key];
        const randomVariation = Math.random() * diversityFactor * 2 - diversityFactor;
        const additionalRandomness = Math.random() * 0.02 * (1 + i % 10);
        
        syntheticSample[key] = originalValue + (originalValue * (randomVariation + additionalRandomness));
        
        if (Number.isInteger(baseSample[key])) {
          syntheticSample[key] = Math.round(syntheticSample[key]);
        } else {
          syntheticSample[key] = parseFloat(syntheticSample[key].toFixed(4));
        }
      }
    }
    
    syntheticSamples.push(syntheticSample);
  }
  
  return syntheticSamples;
};

export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

export const exportAsCsv = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export const downloadData = (content: string, fileName: string, format: 'json' | 'csv'): void => {
  const mimeTypes = {
    json: 'application/json',
    csv: 'text/csv'
  };
  
  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
