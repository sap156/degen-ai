
export interface QueryResult {
  columns: string[];
  rows: any[][];
  metadata?: {
    executionTime?: number;
    rowCount?: number;
  };
  error?: string;
}

export enum ProcessingMode {
  SQL = 'sql',
  NATURAL_LANGUAGE = 'naturalLanguage',
  PYTHON = 'python'
}
