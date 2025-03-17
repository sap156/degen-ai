
import { DatasetInfo } from './types';

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
