import { getCompletion } from "./openAiService";

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

// Get AI recommendations for handling imbalanced data
export const getAIRecommendations = async (
  dataset: DatasetInfo,
  apiKey: string | null
): Promise<string> => {
  if (!apiKey) {
    return "AI recommendations require an OpenAI API key. Please set up your API key to use this feature.";
  }
  
  try {
    const messages = [
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
      temperature: 0.7,
      max_tokens: 800
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
