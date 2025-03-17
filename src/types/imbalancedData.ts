
// Define the types for imbalanced data handling

export interface ClassDistribution {
  name: string;
  className?: string; // Add for backward compatibility
  count: number;
  percentage: number;
  color?: string;
}

export interface DatasetInfo {
  totalSamples: number;
  classes: ClassDistribution[];
  isImbalanced: boolean;
  imbalanceRatio: number;
  recommendations?: string;
}

export type BalancingMethod = 'oversampling' | 'undersampling' | 'smote' | 'adasyn';

export interface BalancingOptions {
  method: BalancingMethod;
  targetRatio: number;
  majorityClass?: string;
  minorityClass?: string;
  randomSeed?: number;
  customWeights?: Record<string, number>; // Add this field
}

export interface BalancedDatasetResult {
  originalData: any[];
  balancedData: any[];
  statistics: {
    originalClassDistribution: ClassDistribution[];
    balancedClassDistribution: ClassDistribution[];
    balancingRatio: number;
    originalSampleCount: number;
    balancedSampleCount: number;
  };
}
