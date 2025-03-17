import * as openAiService from '@/services/openAiService';

export interface ClassDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface DatasetInfo {
  totalSamples: number;
  classes: ClassDistribution[];
  isImbalanced: boolean;
  imbalanceRatio: number;
  minorityClass?: string;
  majorityClass?: string;
}

export interface BalancingOptions {
  method: 'oversampling' | 'undersampling' | 'smote' | 'adasyn';
  targetRatio: number;
  customWeights?: Record<string, number>;
}

export interface BalancedDataResult {
  originalData: any[];
  balancedData: any[];
  originalDistribution: ClassDistribution[];
  newDistribution: ClassDistribution[];
  balancingMethod: string;
  classColumn: string;
}

/**
 * Analyzes the class distribution of a dataset.
 */
export const analyzeClassDistribution = (data: any[], classColumn: string): DatasetInfo => {
  const classCounts: Record<string, number> = {};
  
  if (!data || data.length === 0) {
    return {
      totalSamples: 0,
      classes: [],
      isImbalanced: false,
      imbalanceRatio: 1
    };
  }

  data.forEach(item => {
    const className = String(item[classColumn]);
    classCounts[className] = (classCounts[className] || 0) + 1;
  });

  const totalSamples = data.length;
  const classes: ClassDistribution[] = Object.entries(classCounts).map(([name, count]) => ({
    name,
    count,
    percentage: (count / totalSamples) * 100
  }));

  const sortedClasses = classes.sort((a, b) => a.count - b.count);
  const isImbalanced = sortedClasses[0].count / sortedClasses[sortedClasses.length - 1].count < 0.2;
  const imbalanceRatio = sortedClasses[0].count / sortedClasses[sortedClasses.length - 1].count;
  const minorityClass = sortedClasses[0].name;
  const majorityClass = sortedClasses[sortedClasses.length - 1].name;

  return {
    totalSamples,
    classes: sortedClasses,
    isImbalanced,
    imbalanceRatio,
    minorityClass,
    majorityClass
  };
};

/**
 * Balances a dataset using oversampling.
 */
export const balanceDataset = (data: any[], classColumn: string, options: BalancingOptions): any[] => {
  const { method, targetRatio, customWeights } = options;
  const classCounts: Record<string, number> = {};

  data.forEach(item => {
    const className = String(item[classColumn]);
    classCounts[className] = (classCounts[className] || 0) + 1;
  });

  const maxClassCount = Math.max(...Object.values(classCounts));
  let targetClassCount = maxClassCount;

  if (targetRatio < 1) {
    targetClassCount = Math.floor(maxClassCount * targetRatio);
  }

  let balancedData: any[] = [...data];

  for (const className in classCounts) {
    const classCount = classCounts[className];
    let numToGenerate = targetClassCount - classCount;

    if (customWeights) {
      const weight = customWeights[className] || 1;
      numToGenerate = Math.floor(numToGenerate * weight);
    }

    if (numToGenerate > 0) {
      const classData = data.filter(item => String(item[classColumn]) === className);

      if (method === 'oversampling') {
        for (let i = 0; i < numToGenerate; i++) {
          const randomIndex = Math.floor(Math.random() * classData.length);
          balancedData.push(classData[randomIndex]);
        }
      } else if (method === 'undersampling') {
        const numToKeep = Math.max(1, classCount - numToGenerate);
        const shuffledData = classData.sort(() => 0.5 - Math.random());
        balancedData = balancedData.filter(item => String(item[classColumn]) !== className);
        balancedData.push(...shuffledData.slice(0, numToKeep));
      } else if (method === 'smote') {
        balancedData = applySMOTE(balancedData, classData, numToGenerate, classColumn);
      } else if (method === 'adasyn') {
        balancedData = applyADASYN(balancedData, classData, numToGenerate, classColumn);
      }
    }
  }

  return balancedData;
};

/**
 * Applies Synthetic Minority Oversampling Technique (SMOTE).
 */
const applySMOTE = (existingData: any[], minorityClassData: any[], numToGenerate: number, classColumn: string): any[] => {
  if (minorityClassData.length < 2) {
    console.warn('SMOTE requires at least 2 samples in the minority class.');
    return existingData;
  }

  const k = Math.min(5, minorityClassData.length - 1); // Number of nearest neighbors
  let syntheticSamples: any[] = [];

  for (let i = 0; i < numToGenerate; i++) {
    const baseSample = minorityClassData[Math.floor(Math.random() * minorityClassData.length)];
    const nearestNeighbors = findNearestNeighbors(baseSample, minorityClassData, k, classColumn);
    const neighbor = nearestNeighbors[Math.floor(Math.random() * nearestNeighbors.length)];

    let newSample: any = {};
    for (const key in baseSample) {
      if (typeof baseSample[key] === 'number') {
        newSample[key] = baseSample[key] + Math.random() * (neighbor[key] - baseSample[key]);
      } else {
        newSample[key] = baseSample[key];
      }
    }
    newSample[classColumn] = baseSample[classColumn];
    syntheticSamples.push(newSample);
  }

  return [...existingData, ...syntheticSamples];
};

/**
 * Applies Adaptive Synthetic Sampling Approach (ADASYN).
 */
const applyADASYN = (existingData: any[], minorityClassData: any[], numToGenerate: number, classColumn: string): any[] => {
  if (minorityClassData.length < 2) {
    console.warn('ADASYN requires at least 2 samples in the minority class.');
    return existingData;
  }

  const k = Math.min(5, minorityClassData.length - 1); // Number of nearest neighbors
  let syntheticSamples: any[] = [];

  for (let i = 0; i < numToGenerate; i++) {
    const baseSample = minorityClassData[Math.floor(Math.random() * minorityClassData.length)];
    const nearestNeighbors = findNearestNeighbors(baseSample, minorityClassData, k, classColumn);
    const neighbor = nearestNeighbors[Math.floor(Math.random() * nearestNeighbors.length)];

    let newSample: any = {};
    for (const key in baseSample) {
      if (typeof baseSample[key] === 'number') {
        newSample[key] = baseSample[key] + Math.random() * (neighbor[key] - baseSample[key]);
      } else {
        newSample[key] = baseSample[key];
      }
    }
    newSample[classColumn] = baseSample[classColumn];
    syntheticSamples.push(newSample);
  }

  return [...existingData, ...syntheticSamples];
};

/**
 * Finds the k-nearest neighbors of a sample.
 */
const findNearestNeighbors = (sample: any, data: any[], k: number, classColumn: string): any[] => {
  const distances = data
    .filter(item => item !== sample)
    .map(item => ({
      item,
      distance: euclideanDistance(sample, item, classColumn)
    }))
    .sort((a, b) => a.distance - b.distance);

  return distances.slice(0, k).map(d => d.item);
};

/**
 * Calculates the Euclidean distance between two samples.
 */
const euclideanDistance = (sample1: any, sample2: any, classColumn: string): number => {
  let distance = 0;
  for (const key in sample1) {
    if (key !== classColumn && typeof sample1[key] === 'number' && typeof sample2[key] === 'number') {
      distance += Math.pow(sample1[key] - sample2[key], 2);
    }
  }
  return Math.sqrt(distance);
};

/**
 * Generates AI-based recommendations for balancing a dataset.
 */
export const generateAIRecommendations = async (data: any[], classColumn: string, apiKey: string): Promise<string> => {
  try {
    const datasetInfo = analyzeClassDistribution(data, classColumn);

    const messages = openAiService.createMessages(
      'You are an AI assistant specialized in providing recommendations for balancing imbalanced datasets.',
      `Analyze the following dataset information and provide recommendations on which balancing method to use (oversampling, undersampling, SMOTE, ADASYN) and what target ratio to aim for.
      Dataset Info: ${JSON.stringify(datasetInfo)}`
    );

    const response = await openAiService.getCompletion(
      messages,
      'gpt-4o-mini',
      apiKey
    );

    return response;
  } catch (error: any) {
    console.error('Error generating AI recommendations:', error);
    return 'Failed to generate AI recommendations.';
  }
};
