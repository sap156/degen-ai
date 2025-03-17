
import { DatasetInfo, ClassDistribution, CLASS_COLORS } from './types';

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
