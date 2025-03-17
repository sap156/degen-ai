import * as openAiService from './openAiService';
import { SchemaFieldType } from '@/utils/fileTypes';

export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface DatasetInfo {
  totalSamples: number;
  classes: ClassDistribution[];
  isImbalanced: boolean;
  imbalanceRatio: number;
  minorityClass?: string;
  majorityClass?: string;
  data?: any[];
}

export interface BalancingOptions {
  technique: 'oversample' | 'undersample' | 'smote' | 'adasyn' | 'hybrid' | string;
  targetClass?: string;
  targetRatio?: number;
  preserveMinority?: boolean;
  keepOriginal?: boolean;
}

export interface BalancedDataResult {
  originalData: any[];
  balancedData: any[];
  originalDistribution: ClassDistribution[];
  newDistribution: ClassDistribution[];
  techniquesApplied: string[];
  originalCount: number;
  newCount: number;
  minorityClassOriginal?: number;
  minorityClassNew?: number;
}

export const analyzeImbalance = (data: any[], targetColumn: string): DatasetInfo => {
  if (!data || data.length === 0 || !targetColumn) {
    throw new Error('Invalid data or target column');
  }

  const classCounts: Record<string, number> = {};
  for (const item of data) {
    const classValue = String(item[targetColumn]);
    classCounts[classValue] = (classCounts[classValue] || 0) + 1;
  }

  const totalSamples = data.length;
  const classes: ClassDistribution[] = Object.entries(classCounts).map(([className, count]) => {
    return {
      className,
      count,
      percentage: (count / totalSamples) * 100,
      color: getRandomColor()
    };
  });

  classes.sort((a, b) => b.count - a.count);

  const majorityClass = classes[0];
  const minorityClass = classes[classes.length - 1];
  const imbalanceRatio = majorityClass.count / (minorityClass.count || 1);

  const isImbalanced = imbalanceRatio > 1.5;

  return {
    totalSamples,
    classes,
    isImbalanced,
    imbalanceRatio,
    minorityClass: minorityClass.className,
    majorityClass: majorityClass.className
  };
};

export const balanceDataset = async (
  data: any[],
  targetColumn: string,
  options: BalancingOptions,
  apiKey?: string
): Promise<any[]> => {
  if (!data || data.length === 0) {
    throw new Error('Invalid data');
  }

  switch (options.technique) {
    case 'oversample':
      return oversampleMinorityClass(data, targetColumn, options.targetClass);
    case 'undersample':
      return undersampleMajorityClass(data, targetColumn, options.targetClass);
    case 'hybrid':
      const undersampled = undersampleMajorityClass(data, targetColumn, options.targetClass);
      return oversampleMinorityClass(undersampled, targetColumn, options.targetClass);
    default:
      return data;
  }
};

export const getBalancingResult = async (
  data: any[],
  targetColumn: string,
  options: BalancingOptions,
  apiKey?: string
): Promise<BalancedDataResult> => {
  const originalAnalysis = analyzeImbalance(data, targetColumn);
  
  const balancedData = await balanceDataset(data, targetColumn, options, apiKey);
  
  const newAnalysis = analyzeImbalance(balancedData, targetColumn);
  
  const newClassCounts = newAnalysis.classes.reduce((acc, cls) => {
    acc[cls.className] = cls.count;
    return acc;
  }, {} as Record<string, number>);
  
  const minorityClassName = options.targetClass || originalAnalysis.minorityClass;
  const minorityClassOriginal = originalAnalysis.classes.find(c => 
    c.className === minorityClassName)?.count || 0;
  const minorityClassNew = newClassCounts[minorityClassName] || 0;
  
  return {
    originalData: data,
    balancedData,
    originalDistribution: originalAnalysis.classes,
    newDistribution: newAnalysis.classes,
    techniquesApplied: [options.technique],
    originalCount: data.length,
    newCount: balancedData.length,
    minorityClassOriginal,
    minorityClassNew
  };
};

function getRandomColor(): string {
  const colors = [
    '#4299E1',
    '#F56565',
    '#48BB78',
    '#ED8936',
    '#9F7AEA',
    '#38B2AC',
    '#F687B3',
    '#D53F8C',
    '#805AD5',
    '#3182CE',
    '#DD6B20',
    '#718096',
    '#F6E05E',
    '#D69E2E',
    '#4FD1C5',
    '#667EEA',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

function oversampleMinorityClass(data: any[], targetColumn: string, targetClass?: string): any[] {
  const analysis = analyzeImbalance(data, targetColumn);
  
  const minorityClass = targetClass || analysis.minorityClass;
  
  if (!minorityClass) {
    return data;
  }
  
  const groupedData: Record<string, any[]> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    if (!groupedData[classValue]) {
      groupedData[classValue] = [];
    }
    groupedData[classValue].push(item);
  });
  
  const majorityClass = analysis.majorityClass;
  const majorityClassSize = groupedData[majorityClass]?.length || 0;
  
  const minorityClassSamples = groupedData[minorityClass] || [];
  const result = [...data];
  
  if (minorityClassSamples.length > 0 && minorityClassSamples.length < majorityClassSize) {
    const samplesNeeded = majorityClassSize - minorityClassSamples.length;
    
    for (let i = 0; i < samplesNeeded; i++) {
      const randomIndex = Math.floor(Math.random() * minorityClassSamples.length);
      const sample = {...minorityClassSamples[randomIndex]};
      
      Object.keys(sample).forEach(key => {
        if (key !== targetColumn && typeof sample[key] === 'number') {
          const noise = sample[key] * (Math.random() * 0.1 - 0.05);
          sample[key] += noise;
          const str = String(minorityClassSamples[randomIndex][key]);
          const decimal = str.includes('.') ? str.split('.')[1].length : 0;
          sample[key] = parseFloat(sample[key].toFixed(decimal));
        }
      });
      
      result.push(sample);
    }
  }
  
  return result;
}

function undersampleMajorityClass(data: any[], targetColumn: string, targetClass?: string): any[] {
  const analysis = analyzeImbalance(data, targetColumn);
  
  const majorityClass = targetClass || analysis.majorityClass;
  
  if (!majorityClass) {
    return data;
  }
  
  const minorityClass = analysis.minorityClass;
  const minoritySamples = data.filter(item => String(item[targetColumn]) === minorityClass);
  const targetSize = minoritySamples.length;
  
  const nonMajoritySamples = data.filter(item => String(item[targetColumn]) !== majorityClass);
  
  const majoritySamples = data.filter(item => String(item[targetColumn]) === majorityClass);
  const shuffled = [...majoritySamples].sort(() => 0.5 - Math.random());
  const selectedMajoritySamples = shuffled.slice(0, targetSize);
  
  return [...nonMajoritySamples, ...selectedMajoritySamples];
}

export function generateSyntheticRecords(
  minoritySamples: any[],
  targetColumn: string,
  count: number,
  diversity: 'low' | 'medium' | 'high' = 'medium'
): any[] {
  const result: any[] = [];
  const diversityFactor = diversity === 'low' ? 0.05 : diversity === 'medium' ? 0.15 : 0.25;
  
  for (let i = 0; i < count; i++) {
    const baseSample = minoritySamples[Math.floor(Math.random() * minoritySamples.length)];
    const syntheticSample = { ...baseSample };
    
    syntheticSample.synthetic_id = `syn_${i + 1}`;
    
    for (const key in syntheticSample) {
      if (key !== targetColumn && typeof syntheticSample[key] === 'number') {
        const originalValue = syntheticSample[key];
        const randomVariation = Math.random() * diversityFactor * 2 - diversityFactor;
        syntheticSample[key] = originalValue + (originalValue * randomVariation);
        
        if (Number.isInteger(baseSample[key])) {
          syntheticSample[key] = Math.round(syntheticSample[key]);
        } else {
          syntheticSample[key] = parseFloat(syntheticSample[key].toFixed(4));
        }
      }
    }
    
    result.push(syntheticSample);
  }
  
  return result;
}

export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

export const exportAsCsv = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => {
    return Object.values(item).map(value => {
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
};

export const downloadData = (data: any[], filename: string, format: 'json' | 'csv'): void => {
  const content = format === 'json' ? exportAsJson(data) : exportAsCsv(data);
  const contentType = format === 'json' ? 'application/json' : 'text/csv';
  const extension = format;
  
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
