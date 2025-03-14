
import { toast } from "sonner";

// Types for our service
export type DataField = {
  name: string;
  type: string;
  included: boolean;
};

export type SyntheticDataOptions = {
  dataType: string;
  fields: DataField[];
  rowCount: number;
  distributionType: string;
  includeNulls: boolean;
  nullPercentage: number;
  outputFormat: string;
  customSchema?: string;
};

// Helper functions to generate different types of synthetic data
const generateId = (index: number) => index + 1;

const generateName = () => {
  const firstNames = ["John", "Jane", "Michael", "Emma", "David", "Sarah", "Robert", "Lisa", "William", "Mary"];
  const lastNames = ["Smith", "Johnson", "Brown", "Jones", "Davis", "Wilson", "Miller", "Taylor", "Anderson", "Thomas"];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

const generateEmail = (name?: string) => {
  const emailProviders = ["gmail.com", "yahoo.com", "outlook.com", "example.com", "company.com"];
  const provider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
  
  const nameParts = name ? name.toLowerCase().split(" ") : [
    ["john", "jane", "user", "contact", "info"][Math.floor(Math.random() * 5)]
  ];
  
  const username = Math.random() > 0.5 
    ? `${nameParts[0]}.${nameParts[nameParts.length - 1]}` 
    : `${nameParts[0]}${Math.floor(Math.random() * 100)}`;
  
  return `${username}@${provider}`;
};

const generateAge = () => Math.floor(Math.random() * 60) + 18;

const generateAddress = () => {
  const streetNumbers = Array.from({ length: 1000 }, (_, i) => i + 1);
  const streetNames = ["Main St", "Oak Ave", "Pine Rd", "Maple Dr", "Cedar Ln", "Elm Blvd", "Park Ave", "River Rd"];
  const cities = ["Anytown", "Springfield", "Riverside", "Georgetown", "Franklin", "Clinton", "Arlington", "Manchester"];
  const states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA"];
  
  const streetNumber = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];
  const zipCode = Math.floor(Math.random() * 90000) + 10000;
  
  return `${streetNumber} ${streetName}, ${city}, ${state} ${zipCode}`;
};

const generatePhoneNumber = () => {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  
  return `${areaCode}-${prefix}-${lineNumber}`;
};

const generateBoolean = () => Math.random() > 0.5;

const generateDate = () => {
  const start = new Date(2020, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const generateNumber = (min = 0, max = 1000) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Main function to generate synthetic data
export const generateSyntheticData = async (options: SyntheticDataOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Simulate an API call or processing time
      setTimeout(() => {
        const { fields, rowCount, outputFormat } = options;
        
        // Filter only included fields
        const includedFields = fields.filter(field => field.included);
        
        // Generate header row
        const headers = includedFields.map(field => field.name);
        
        // Generate data rows
        const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
          const row: Record<string, any> = {};
          
          includedFields.forEach(field => {
            // Check if we should include null value based on settings
            if (options.includeNulls && Math.random() * 100 < options.nullPercentage) {
              row[field.name] = null;
              return;
            }
            
            // Generate value based on field type
            switch (field.type) {
              case 'id':
                row[field.name] = generateId(rowIndex);
                break;
              case 'name':
                row[field.name] = generateName();
                break;
              case 'email':
                row[field.name] = generateEmail(row['full_name'] as string);
                break;
              case 'number':
                row[field.name] = generateNumber();
                break;
              case 'date':
                row[field.name] = generateDate();
                break;
              case 'address':
                row[field.name] = generateAddress();
                break;
              case 'phone':
                row[field.name] = generatePhoneNumber();
                break;
              case 'boolean':
                row[field.name] = generateBoolean();
                break;
              case 'string':
              default:
                row[field.name] = generateString();
                break;
            }
          });
          
          return row;
        });
        
        // Format output based on selected format
        let result = '';
        
        switch (outputFormat) {
          case 'json':
            result = JSON.stringify(rows, null, 2);
            break;
          case 'csv':
          default:
            // Add headers
            result = headers.join(',') + '\n';
            
            // Add data rows
            rows.forEach(row => {
              const rowValues = headers.map(header => {
                const value = row[header];
                // Properly format values for CSV
                if (value === null) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              });
              result += rowValues.join(',') + '\n';
            });
            break;
        }
        
        resolve(result);
      }, 1500); // Simulate processing time
    } catch (error) {
      console.error('Error generating synthetic data:', error);
      reject(error);
    }
  });
};

// Function to save data to a file and trigger download
export const downloadSyntheticData = (data: string, format: string): void => {
  const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `synthetic_data_${Date.now()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success('Download started');
};

// Add mock database saving function 
export const saveSyntheticDataToDatabase = async (data: string): Promise<void> => {
  return new Promise((resolve) => {
    // Simulate API call
    setTimeout(() => {
      console.log('Data saved to database:', data.slice(0, 100) + '...');
      toast.success('Data saved to database successfully');
      resolve();
    }, 1500);
  });
};
