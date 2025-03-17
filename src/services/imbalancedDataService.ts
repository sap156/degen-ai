
export interface ClassDistribution {
  className: string;
  count: number;
  percentage: number;
  color?: string; // Adding color property
}

export interface DatasetInfo {
  totalSamples: number;
  classes: ClassDistribution[];
  isImbalanced: boolean;
  imbalanceRatio: number;
  minorityClass: string;
  majorityClass: string;
}

export interface BalancingOptions {
  technique: 'oversampling' | 'undersampling' | 'hybrid';
  ratio: number;
  preserveDistribution: boolean;
  targetCount?: number;
  minorityClass?: string;
  majorityClass?: string;
}

export interface BalancedDataResult {
  originalData: any[];
  balancedData: any[];
  originalDistribution: ClassDistribution[];
  balancedDistribution: ClassDistribution[];
  techniqueUsed: string;
  balancingRatio: number;
  totalOriginalSamples: number;
  totalBalancedSamples: number;
}

export const balanceDataset = (
  data: any[],
  targetColumn: string,
  options: BalancingOptions,
  apiKey: string
): BalancedDataResult => {
  // For now, this is a mock implementation
  // This would be replaced with actual implementation using the OpenAI API
  
  // Sort classes by count to identify minority and majority
  const classCounts: Record<string, number> = {};
  data.forEach(item => {
    const classValue = String(item[targetColumn]);
    classCounts[classValue] = (classCounts[classValue] || 0) + 1;
  });

  const classes = Object.entries(classCounts)
    .map(([className, count]) => ({
      className,
      count,
      percentage: (count / data.length) * 100,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    }))
    .sort((a, b) => a.count - b.count);

  const minorityClass = classes[0].className;
  const majorityClass = classes[classes.length - 1].className;

  // For demo, just duplicate some minority class instances
  let balancedData = [...data];
  const minorityInstances = data.filter(item => String(item[targetColumn]) === minorityClass);
  
  if (options.technique === 'oversampling') {
    // Simple oversampling
    const numberToAdd = Math.floor(classCounts[majorityClass] * options.ratio) - classCounts[minorityClass];
    
    for (let i = 0; i < numberToAdd; i++) {
      const randomIndex = Math.floor(Math.random() * minorityInstances.length);
      balancedData.push({...minorityInstances[randomIndex]});
    }
  } else if (options.technique === 'undersampling') {
    // Simple undersampling
    const targetCount = Math.ceil(classCounts[minorityClass] / options.ratio);
    
    // Get all majority instances
    const majorityInstances = data.filter(item => String(item[targetColumn]) === majorityClass);
    // Randomly select a subset
    const selectedIndices = new Set<number>();
    while (selectedIndices.size < targetCount) {
      selectedIndices.add(Math.floor(Math.random() * majorityInstances.length));
    }
    
    // Create the balanced dataset with all minority instances and selected majority instances
    balancedData = [
      ...data.filter(item => String(item[targetColumn]) !== majorityClass),
      ...Array.from(selectedIndices).map(idx => majorityInstances[idx])
    ];
  }
  
  // Calculate new distributions
  const balancedCounts: Record<string, number> = {};
  balancedData.forEach(item => {
    const classValue = String(item[targetColumn]);
    balancedCounts[classValue] = (balancedCounts[classValue] || 0) + 1;
  });
  
  const balancedDistribution = Object.entries(balancedCounts)
    .map(([className, count]) => ({
      className,
      count,
      percentage: (count / balancedData.length) * 100,
      color: classes.find(c => c.className === className)?.color || 
             `hsl(${Math.random() * 360}, 70%, 60%)`
    }));
  
  return {
    originalData: data,
    balancedData,
    originalDistribution: classes,
    balancedDistribution,
    techniqueUsed: options.technique,
    balancingRatio: options.ratio,
    totalOriginalSamples: data.length,
    totalBalancedSamples: balancedData.length
  };
};

export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

export const exportAsCsv = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  
  // Get headers from first item
  const headers = Object.keys(data[0]);
  
  // Convert each data row to CSV
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle CSV special characters
      const cellValue = value === null || value === undefined ? '' : String(value);
      
      // Quote values with commas, quotes, or newlines
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        return `"${cellValue.replace(/"/g, '""')}"`;
      }
      
      return cellValue;
    }).join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
};

export const downloadData = (data: string, filename: string, format: 'json' | 'csv'): void => {
  // Create file extension based on format
  const extension = format;
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  
  // Create a blob and download link
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  
  // Append to the document, click, and clean up
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
