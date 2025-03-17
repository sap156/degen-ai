
import { DataTypeResult } from './fileTypes';

// Helper function to detect data types in files
export const detectDataType = async (file: File, apiKey: string): Promise<DataTypeResult> => {
  // For now, this is a simple implementation that returns a default result
  // In a real app, you would use more sophisticated detection logic or ML
  
  const fileType = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Basic detection based on file extension
  if (['csv', 'xlsx', 'xls'].includes(fileType)) {
    return {
      type: 'tabular',
      confidence: 0.8,
      categoricalColumns: []
    };
  }
  
  if (['json'].includes(fileType)) {
    // Try to detect if it's time series data
    const text = await readFileAsText(file);
    try {
      const data = JSON.parse(text);
      const sample = Array.isArray(data) ? data[0] : data;
      
      // Check for timestamp-like fields
      const timeFields = Object.keys(sample || {}).filter(key => 
        key.toLowerCase().includes('time') || 
        key.toLowerCase().includes('date') || 
        key === 'timestamp'
      );
      
      if (timeFields.length > 0) {
        return {
          type: 'timeseries',
          confidence: 0.7,
          timeColumn: timeFields[0],
          valueColumns: Object.keys(sample).filter(key => 
            typeof sample[key] === 'number' && !key.toLowerCase().includes('time')
          )
        };
      }
    } catch (e) {
      // Parsing failed, continue with default detection
    }
  }
  
  // Default to generic tabular data type
  return {
    type: 'tabular', 
    confidence: 0.5
  };
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
