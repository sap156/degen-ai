import { OpenAiMessage, getCompletion } from '@/services/openAiService';

// Class distribution interface
export interface ClassDistribution {
  name: string;
  className: string; // Adding className for backward compatibility
  count: number;
  percentage: number;
  color: string; // Adding color for visualization
}

// Dataset information interface
export interface DatasetInfo {
  totalSamples: number;
  classes: ClassDistribution[];
  isImbalanced: boolean;
  imbalanceRatio: number;
}

// Balancing options interface
export interface BalancingOptions {
  targetClass: string;
  method: 'oversampling' | 'undersampling' | 'smote' | 'adasyn';
  targetRatio: number;
  preserveMinority?: boolean;
  useAI?: boolean;
}

// Synthetic data generation options
export interface SyntheticDataOptions {
  minorityClass: string;
  majorityClass: string;
  volume: number;
  diversity: 'low' | 'medium' | 'high';
}

/**
 * Analyze dataset and detect class distribution and imbalance
 */
export const analyzeDataset = (
  data: any[],
  targetColumn: string
): DatasetInfo => {
  if (!data || !data.length || !targetColumn) {
    return {
      totalSamples: 0,
      classes: [],
      isImbalanced: false,
      imbalanceRatio: 1
    };
  }

  // Count class distribution
  const classCount: Record<string, number> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    classCount[classValue] = (classCount[classValue] || 0) + 1;
  });

  // Calculate percentages and create class distribution objects
  const totalCount = data.length;
  const classes: ClassDistribution[] = Object.entries(classCount).map(([className, count], index) => {
    const percentage = (count / totalCount) * 100;
    // Generate a color based on index
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', 
      '#FF6D01', '#46BDC6', '#7B36D9', '#00A98F',
      '#BF4B96', '#2FC2EF', '#6D9B16', '#EF2ECF'
    ];
    
    return {
      name: className, // For interface compatibility
      className, // For backward compatibility
      count,
      percentage,
      color: colors[index % colors.length]
    };
  });

  // Sort classes by count (descending)
  classes.sort((a, b) => b.count - a.count);

  // Calculate imbalance ratio (majority class count / minority class count)
  const majorityClass = classes[0];
  const minorityClass = classes[classes.length - 1];
  const imbalanceRatio = majorityClass.count / minorityClass.count;

  // Dataset is considered imbalanced if the ratio is greater than 1.5
  const isImbalanced = imbalanceRatio > 1.5;

  return {
    totalSamples: totalCount,
    classes,
    isImbalanced,
    imbalanceRatio
  };
};

/**
 * Exports data as JSON
 */
export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Exports data as CSV
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

/**
 * Generate synthetic records for minority class using statistical methods
 */
export const generateSyntheticRecords = (
  minoritySamples: any[],
  targetColumn: string,
  count: number,
  diversity: 'low' | 'medium' | 'high' = 'medium'
): any[] => {
  if (!minoritySamples || minoritySamples.length === 0) {
    return [];
  }
  
  const syntheticSamples = [];
  const diversityFactor = diversity === 'low' ? 0.05 : diversity === 'medium' ? 0.15 : 0.25;
  
  // Generate the requested number of synthetic samples
  for (let i = 0; i < count; i++) {
    // Pick a random sample to use as base
    const baseSample = minoritySamples[Math.floor(Math.random() * minoritySamples.length)];
    const syntheticSample = { ...baseSample };
    
    // Add synthetic_id
    syntheticSample.synthetic_id = `syn_${i + 1}`;
    
    // Vary numeric features
    for (const key in syntheticSample) {
      if (key !== targetColumn && typeof syntheticSample[key] === 'number') {
        const originalValue = syntheticSample[key];
        // Add randomness based on diversity level
        const randomVariation = Math.random() * diversityFactor * 2 - diversityFactor;
        syntheticSample[key] = originalValue + (originalValue * randomVariation);
        
        // Round to reasonable decimal places if the original was an integer
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

/**
 * Apply AI-powered data balancing
 */
export const balanceDataset = async (
  data: any[],
  options: BalancingOptions,
  targetColumn: string,
  apiKey: string
): Promise<any[]> => {
  if (!data || data.length === 0 || !options.targetClass) {
    return data;
  }

  // Handle different balancing methods
  switch (options.method) {
    case 'oversampling':
      return oversampleClass(data, options.targetClass, targetColumn, options.targetRatio);
    case 'undersampling':
      return undersampleClass(data, options.targetClass, targetColumn, options.targetRatio);
    case 'smote':
    case 'adasyn':
      if (options.useAI && apiKey) {
        return aiBalanceDataset(data, options, targetColumn, apiKey);
      } else {
        // Fallback to basic oversampling if AI is not available
        return oversampleClass(data, options.targetClass, targetColumn, options.targetRatio);
      }
    default:
      return data;
  }
};

/**
 * Basic oversampling implementation
 */
const oversampleClass = (
  data: any[],
  targetClass: string,
  targetColumn: string,
  targetRatio: number
): any[] => {
  // Count classes
  const classCount: Record<string, number> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    classCount[classValue] = (classCount[classValue] || 0) + 1;
  });
  
  // Find majority class count
  const majorityClass = Object.entries(classCount).reduce(
    (max, [cls, count]) => (count > max.count ? { cls, count } : max),
    { cls: '', count: 0 }
  );
  
  // Calculate target count for minority class
  const targetClassCount = classCount[targetClass] || 0;
  const targetCount = Math.round(majorityClass.count / targetRatio);
  const samplesToAdd = Math.max(0, targetCount - targetClassCount);
  
  if (samplesToAdd <= 0) {
    return data;
  }
  
  // Get all samples of the target class
  const targetSamples = data.filter(item => String(item[targetColumn]) === targetClass);
  
  if (targetSamples.length === 0) {
    return data;
  }
  
  // Create synthetic samples by randomly selecting and duplicating
  const syntheticSamples = [];
  for (let i = 0; i < samplesToAdd; i++) {
    const baseSample = targetSamples[Math.floor(Math.random() * targetSamples.length)];
    const newSample = { ...baseSample, synthetic_id: `syn_${i + 1}` };
    syntheticSamples.push(newSample);
  }
  
  return [...data, ...syntheticSamples];
};

/**
 * Basic undersampling implementation
 */
const undersampleClass = (
  data: any[],
  targetClass: string,
  targetColumn: string,
  targetRatio: number
): any[] => {
  // Count classes
  const classSamples: Record<string, any[]> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    if (!classSamples[classValue]) {
      classSamples[classValue] = [];
    }
    classSamples[classValue].push(item);
  });
  
  // Calculate how many samples to keep from majority classes
  const targetClassSamples = classSamples[targetClass] || [];
  const targetClassCount = targetClassSamples.length;
  
  let result: any[] = [];
  
  // Add all target class samples
  result = result.concat(targetClassSamples);
  
  // Undersample other classes
  for (const classValue in classSamples) {
    if (classValue !== targetClass) {
      const samples = classSamples[classValue];
      const targetCount = Math.round(targetClassCount * targetRatio);
      
      // Randomly select samples to keep
      const shuffled = [...samples].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(targetCount, samples.length));
      
      result = result.concat(selected);
    }
  }
  
  return result;
};

/**
 * AI-powered data balancing
 */
const aiBalanceDataset = async (
  data: any[],
  options: BalancingOptions,
  targetColumn: string,
  apiKey: string
): Promise<any[]> => {
  // Sample data to send to OpenAI
  const sampleData = data.slice(0, Math.min(5, data.length));
  
  const messages: OpenAiMessage[] = [
    {
      role: 'system',
      content: `You are a data science expert specializing in handling imbalanced datasets.
      Your task is to suggest how to balance this dataset with ${options.method.toUpperCase()} approach.`
    },
    {
      role: 'user',
      content: `I have an imbalanced dataset with a target column "${targetColumn}".
      I want to balance it using ${options.method} to achieve a class ratio of 1:${options.targetRatio}.
      The minority class is "${options.targetClass}".
      Here's a sample of my data: ${JSON.stringify(sampleData, null, 2)}`
    }
  ];
  
  try {
    // Get AI suggestions (this won't actually modify data, just for demonstration)
    await getCompletion(messages, 'gpt-4o-mini', apiKey);
    
    // For now, fall back to basic oversampling
    if (options.method === 'smote' || options.method === 'adasyn') {
      return oversampleClass(data, options.targetClass, targetColumn, options.targetRatio);
    }
    
    return data;
  } catch (error) {
    console.error('Error in AI balancing:', error);
    // Fallback to basic methods
    return options.method === 'undersampling'
      ? undersampleClass(data, options.targetClass, targetColumn, options.targetRatio)
      : oversampleClass(data, options.targetClass, targetColumn, options.targetRatio);
  }
};
