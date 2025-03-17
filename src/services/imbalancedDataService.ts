
// This service re-exports all functionality from the modular imbalanced-data directory
// This maintains backward compatibility with existing code while allowing for better organization

// Re-export all types
export * from './imbalanced-data/types';

// Re-export all functionality
export * from './imbalanced-data/datasetGenerator';
export * from './imbalanced-data/balancingMethods';
export * from './imbalanced-data/syntheticDataGenerator';
export * from './imbalanced-data/aiRecommendations';
export * from './imbalanced-data/exportUtils';
