
import { DatasetInfo, BalancingOptions } from './types';

// Apply balancing techniques to the dataset
export const balanceDataset = (
  dataset: DatasetInfo,
  options: BalancingOptions
): DatasetInfo => {
  if (options.method === 'none') {
    return dataset;
  }
  
  const balancedClasses = JSON.parse(JSON.stringify(dataset.classes));
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
    
    default:
      // Return original dataset if method is not recognized
      return dataset;
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
