/**
 * Utilities for handling file uploads across different data types
 */
// Re-export types from fileTypes
export * from './fileTypes';

// Re-export basic file operations
export * from './fileOperations';

// Re-export data parsing functions
export * from './dataParsing';

// Re-export text extraction utilities
export * from './textExtraction';

// Re-export schema detection utilities
export * from './schemaDetection';

export const calculateDataPointsCount = (
  startDate: Date,
  endDate: Date,
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly'
): number => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const millisecondsDiff = endTime - startTime;
  
  switch (interval) {
    case 'hourly':
      return Math.ceil(millisecondsDiff / (60 * 60 * 1000)) + 1;
    case 'daily':
      return Math.ceil(millisecondsDiff / (24 * 60 * 60 * 1000)) + 1;
    case 'weekly':
      return Math.ceil(millisecondsDiff / (7 * 24 * 60 * 60 * 1000)) + 1;
    case 'monthly':
      // Calculate months between dates
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth();
      return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    default:
      return 0;
  }
};
