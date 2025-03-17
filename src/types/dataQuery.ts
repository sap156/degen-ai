
export interface QueryResult {
  columns: string[];
  rows: any[][];
  metadata?: {
    executionTime?: number;
    rowCount?: number;
  };
  error?: string;
  // Add missing properties used in components
  sql?: string;
  optimizedSql?: string;
  analysis?: string;
  followUpQueries?: string[];
  results?: any[];
}

export enum ProcessingMode {
  GENERATE = 'generate',
  OPTIMIZE = 'optimize',
  ANALYZE = 'analyze',
  FOLLOWUP = 'followup'
}
