
import { ReactNode } from 'react';

export interface DataParsingResult {
  format: string;
  structured?: any;
  raw: string;
}

export interface ProcessedResult {
  [key: string]: DataParsingResult;
}
