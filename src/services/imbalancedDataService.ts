import { ClassDistribution, BalancingOptions, BalancedDatasetResult } from '@/types/imbalancedData';
import { OpenAiMessage, createMessages, getCompletion } from './openAiService';

export const analyzeClassDistribution = (data: any[], targetColumn: string): ClassDistribution[] => {
  if (!data || !targetColumn || data.length === 0) {
    return [];
  }

  // Count occurrences of each class
  const classCounts: Record<string, number> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn] || 'unknown');
    classCounts[classValue] = (classCounts[classValue] || 0) + 1;
  });

  // Convert to array format
  return Object.entries(classCounts).map(([className, count]) => ({
    name: className,
    className, // For backward compatibility
    count,
    percentage: (count / data.length) * 100
  }));
};

export const balanceDataset = (
  data: any[], 
  targetColumn: string, 
  options: BalancingOptions
): BalancedDatasetResult => {
  // Implementation of data balancing logic
  // This is a placeholder - you would implement actual balancing algorithms
  
  const originalDistribution = analyzeClassDistribution(data, targetColumn);
  
  // Clone the data for balancing
  let balancedData = [...data];
  
  // Simple implementation for demonstration
  if (options.method === 'oversampling') {
    // Oversample minority classes
    balancedData = oversampleData(data, targetColumn, options);
  } else if (options.method === 'undersampling') {
    // Undersample majority classes
    balancedData = undersampleData(data, targetColumn, options);
  } else if (options.method === 'smote' || options.method === 'adasyn') {
    // These would require more sophisticated implementations
    // For now, we'll use simple oversampling as a fallback
    balancedData = oversampleData(data, targetColumn, options);
  }
  
  const balancedDistribution = analyzeClassDistribution(balancedData, targetColumn);
  
  return {
    originalData: data,
    balancedData,
    statistics: {
      originalClassDistribution: originalDistribution,
      balancedClassDistribution: balancedDistribution,
      balancingRatio: options.targetRatio,
      originalSampleCount: data.length,
      balancedSampleCount: balancedData.length
    }
  };
};

// Oversample minority classes
const oversampleData = (data: any[], targetColumn: string, options: BalancingOptions): any[] => {
  // Simple implementation that duplicates minority class samples
  const classCounts: Record<string, number> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    classCounts[classValue] = (classCounts[classValue] || 0) + 1;
  });
  
  // Find majority and minority classes
  const sortedClasses = Object.entries(classCounts)
    .sort(([, countA], [, countB]) => countB - countA);
  
  const majorityClass = options.majorityClass || sortedClasses[0][0];
  const majorityCount = classCounts[majorityClass];
  
  // Balance dataset
  const balancedData = [...data];
  
  // For each class
  Object.entries(classCounts).forEach(([className, count]) => {
    if (className !== majorityClass) {
      // Calculate target count based on ratio
      const targetCount = Math.round(majorityCount * options.targetRatio);
      
      if (count < targetCount) {
        // We need to oversample
        const samplesNeeded = targetCount - count;
        const classData = data.filter(item => String(item[targetColumn]) === className);
        
        // Simple duplication (in a real implementation, you would use SMOTE or other techniques)
        for (let i = 0; i < samplesNeeded; i++) {
          const randomIndex = Math.floor(Math.random() * classData.length);
          balancedData.push({...classData[randomIndex]});
        }
      }
    }
  });
  
  return balancedData;
};

// Undersample majority classes
const undersampleData = (data: any[], targetColumn: string, options: BalancingOptions): any[] => {
  // Simple implementation that removes samples from majority class
  const classCounts: Record<string, number> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    classCounts[classValue] = (classCounts[classValue] || 0) + 1;
  });
  
  // Find minority and majority classes
  const sortedClasses = Object.entries(classCounts)
    .sort(([, countA], [, countB]) => countA - countB);
  
  const minorityClass = options.minorityClass || sortedClasses[0][0];
  const minorityCount = classCounts[minorityClass];
  
  // Create balanced dataset
  const balancedData: any[] = [];
  
  // Group data by class
  const dataByClass: Record<string, any[]> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    if (!dataByClass[classValue]) {
      dataByClass[classValue] = [];
    }
    dataByClass[classValue].push(item);
  });
  
  // For each class
  Object.entries(dataByClass).forEach(([className, classData]) => {
    // Calculate target count based on the inverse of the target ratio
    // If we want majority:minority to be 2:1, we'd use 1/2 = 0.5 as the reduction factor
    const targetCount = className === minorityClass ? 
      classData.length : 
      Math.round(minorityCount / options.targetRatio);
    
    // Randomly select samples
    const shuffled = [...classData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, targetCount);
    
    balancedData.push(...selected);
  });
  
  return balancedData;
};

// Add the missing functions that were referenced in ImbalancedData.tsx
export const exportAsJson = (data: any[], filename: string = 'data'): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

export const exportAsCsv = (data: any[], filename: string = 'data'): void => {
  if (!data || data.length === 0) return;
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Convert data to CSV rows
  const rows = [
    headers.join(','), // Header row
    ...data.map(item => 
      headers.map(header => {
        const value = item[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ];
  
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${filename}.csv`);
};

export const downloadData = (data: any[], format: 'json' | 'csv', filename: string = 'data'): void => {
  if (format === 'json') {
    exportAsJson(data, filename);
  } else {
    exportAsCsv(data, filename);
  }
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateSyntheticRecords = async (
  data: any[],
  targetColumn: string,
  options: {
    count: number;
    classToGenerate: string;
    apiKey: string;
  }
): Promise<any[]> => {
  try {
    if (!data || data.length === 0 || !targetColumn || !options.apiKey) {
      return [];
    }
    
    // Get samples of the target class to use as reference
    const samples = data
      .filter(item => String(item[targetColumn]) === options.classToGenerate)
      .slice(0, 5); // Take a few samples
      
    if (samples.length === 0) {
      console.error(`No samples found for class "${options.classToGenerate}"`);
      return [];
    }
    
    // Create a system message
    const messages = createMessages(
      "You are an AI specialized in generating synthetic data that matches the patterns of real data.",
      `Generate ${options.count} synthetic records that look similar to these samples but with different values.
       The records should be of the class "${options.classToGenerate}" for the field "${targetColumn}".
       
       Sample records:
       ${JSON.stringify(samples, null, 2)}
       
       Return the generated records as a valid JSON array.`
    );
    
    // Call the API
    const response = await getCompletion(messages, 'gpt-4o-mini', options.apiKey);
    
    // Try to extract JSON
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/);
                      
    const jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    try {
      const generatedData = JSON.parse(jsonStr);
      return Array.isArray(generatedData) ? generatedData : [];
    } catch (error) {
      console.error('Failed to parse generated data:', error);
      return [];
    }
  } catch (error) {
    console.error('Error generating synthetic records:', error);
    return [];
  }
};
