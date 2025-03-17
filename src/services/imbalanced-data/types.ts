
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
export const CLASS_COLORS = [
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
