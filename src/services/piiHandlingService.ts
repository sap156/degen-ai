
export interface PiiData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  ssn: string;
  address: string;
  creditCard: string;
  dob: string;
}

export type PiiDataMasked = {
  [K in keyof PiiData]: string;
};

export type MaskingOptions = {
  [K in keyof Omit<PiiData, 'id'>]: boolean;
};

// Generate sample PII data for demonstration
export const generateSamplePiiData = (count: number = 10): PiiData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    firstName: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'][Math.floor(Math.random() * 6)],
    lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis'][Math.floor(Math.random() * 6)],
    email: `user${i + 1}@example.com`,
    phoneNumber: `(${Math.floor(Math.random() * 900) + 100})-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    ssn: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`,
    address: `${Math.floor(Math.random() * 9000) + 1000} Main St, Anytown, ST ${Math.floor(Math.random() * 90000) + 10000}`,
    creditCard: `${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
    dob: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${Math.floor(Math.random() * 40) + 1960}`,
  }));
};

// Masking functions for different PII types
const maskingFunctions = {
  firstName: (value: string) => value.charAt(0) + '*'.repeat(value.length - 1),
  lastName: (value: string) => value.charAt(0) + '*'.repeat(value.length - 1),
  email: (value: string) => {
    const [name, domain] = value.split('@');
    return `${name.charAt(0)}${'*'.repeat(name.length - 1)}@${domain}`;
  },
  phoneNumber: (value: string) => {
    const lastFour = value.slice(-4);
    return `***-***-${lastFour}`;
  },
  ssn: () => '***-**-****',
  address: (value: string) => {
    const parts = value.split(' ');
    const number = parts[0];
    return `${number} ${'*'.repeat(value.length - number.length - 1)}`;
  },
  creditCard: (value: string) => {
    const lastFour = value.slice(-4);
    return `****-****-****-${lastFour}`;
  },
  dob: (value: string) => {
    const parts = value.split('/');
    return `**/${parts[1]}/${parts[2].slice(-2)}`;
  }
};

// Apply masking based on selected options
export const maskPiiData = (data: PiiData[], options: MaskingOptions): PiiDataMasked[] => {
  return data.map(item => {
    const maskedItem: Partial<PiiDataMasked> = { id: item.id };
    
    (Object.keys(options) as Array<keyof MaskingOptions>).forEach(key => {
      if (options[key]) {
        maskedItem[key] = maskingFunctions[key](item[key]);
      } else {
        maskedItem[key] = item[key];
      }
    });
    
    return maskedItem as PiiDataMasked;
  });
};

// Export data as JSON
export const exportAsJson = (data: any[]): string => {
  return JSON.stringify(data, null, 2);
};

// Export data as CSV
export const exportAsCsv = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
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
