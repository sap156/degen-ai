// Identify potential primary key fields in the dataset
export const detectPrimaryKeyFields = (records: any[]): string[] => {
  if (!records || records.length === 0) return [];
  
  const commonPrimaryKeyNames = [
    'id', 'ID', 'Id', '_id', 
    'patient_id', 'patientId', 'PatientId', 'patientID', 'PatientID',
    'user_id', 'userId', 'UserId', 'userID', 'UserID',
    'customer_id', 'customerId', 'CustomerId', 'customerID', 'CustomerID',
    'record_id', 'recordId', 'RecordId', 'recordID', 'RecordID',
    'uuid', 'UUID', 'guid', 'GUID'
  ];
  
  const potentialKeys: string[] = [];
  const sample = records[0];
  
  // Check for fields with names typically used for primary keys
  Object.keys(sample).forEach(field => {
    if (commonPrimaryKeyNames.includes(field)) {
      potentialKeys.push(field);
      return;
    }
    
    // Check if field name ends with _id, ID, Id
    if (field.endsWith('_id') || field.endsWith('ID') || field.endsWith('Id')) {
      potentialKeys.push(field);
      return;
    }
  });
  
  // If no obvious primary key fields found, check for fields with unique values
  if (potentialKeys.length === 0) {
    Object.keys(sample).forEach(field => {
      // Skip obvious non-key fields
      if (field === 'synthetic_id' || typeof sample[field] === 'object') {
        return;
      }
      
      // Check if values are unique across all records
      const values = new Set(records.map(item => item[field]));
      if (values.size === records.length) {
        potentialKeys.push(field);
      }
    });
  }
  
  return potentialKeys;
};

// Generate synthetic samples using improved SMOTE-like algorithm with primary key handling
export const generateSyntheticRecords = (
  records: any[],
  targetColumn: string,
  count: number,
  diversityLevel: 'low' | 'medium' | 'high' = 'medium'
): any[] => {
  if (records.length < 2) {
    console.warn("Need at least 2 records to generate synthetic samples");
    return [];
  }
  
  const syntheticRecords: any[] = [];
  const existingFingerprints = new Set<string>();
  
  // Detect potential primary key fields
  const primaryKeyFields = detectPrimaryKeyFields(records);
  console.log("Detected primary key fields:", primaryKeyFields);
  
  // Track existing key values to avoid duplication
  const existingKeyValues: Record<string, Set<any>> = {};
  primaryKeyFields.forEach(field => {
    existingKeyValues[field] = new Set(records.map(r => r[field]));
  });
  
  // Add fingerprints of original records to avoid duplicates
  records.forEach(record => {
    const fingerprint = createRecordFingerprint(record, targetColumn);
    existingFingerprints.add(fingerprint);
  });
  
  // Set diversity factor based on level
  const baseDiversityFactor = diversityLevel === 'low' ? 0.1 : 
                             diversityLevel === 'medium' ? 0.25 : 0.4;
  
  // Attempt to generate the requested number of unique samples
  let attempts = 0;
  const maxAttempts = count * 5; // Allow multiple attempts to find unique samples
  
  while (syntheticRecords.length < count && attempts < maxAttempts) {
    // Select two random records to interpolate between
    const idx1 = Math.floor(Math.random() * records.length);
    let idx2 = Math.floor(Math.random() * records.length);
    
    // Make sure we select different records if possible
    while (idx2 === idx1 && records.length > 1) {
      idx2 = Math.floor(Math.random() * records.length);
    }
    
    const record1 = records[idx1];
    const record2 = records[idx2];
    
    // Create a new record with properties from both source records
    const syntheticRecord: any = { ...record1 };
    
    // Add synthetic marker
    syntheticRecord.synthetic_id = `syn_${syntheticRecords.length + 1}`;
    
    // Generate unique primary key values for detected primary key fields
    primaryKeyFields.forEach(field => {
      const originalValue = record1[field];
      
      // Handle different types of primary keys
      if (typeof originalValue === 'number') {
        // Find the highest existing ID and increment
        const highestId = Math.max(
          ...[...existingKeyValues[field]].filter(v => typeof v === 'number') as number[]
        );
        syntheticRecord[field] = highestId + syntheticRecords.length + 1;
      } 
      else if (typeof originalValue === 'string' && /^[0-9]+$/.test(originalValue)) {
        // Numeric string IDs
        const numericIds = [...existingKeyValues[field]]
          .filter(v => typeof v === 'string' && /^[0-9]+$/.test(v as string))
          .map(v => parseInt(v as string, 10));
        
        const highestId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
        syntheticRecord[field] = String(highestId + syntheticRecords.length + 1);
      }
      else if (typeof originalValue === 'string') {
        // String IDs
        syntheticRecord[field] = `${originalValue.split('_')[0]}_syn_${syntheticRecords.length + 1}`;
      }
      else if (originalValue !== undefined) {
        // Other types
        syntheticRecord[field] = `${String(originalValue)}_syn_${syntheticRecords.length + 1}`;
      }
      
      // Add this new key value to the tracking set
      if (syntheticRecord[field] !== undefined) {
        existingKeyValues[field].add(syntheticRecord[field]);
      }
    });
    
    // Increase diversity with each generation to avoid duplicates
    const dynamicDiversityFactor = baseDiversityFactor * (1 + (attempts / maxAttempts));
    
    // Interpolate numeric features, add random noise to ensure uniqueness
    Object.keys(record1).forEach(key => {
      // Skip primary key fields and target column
      if (primaryKeyFields.includes(key) || key === targetColumn || key === 'synthetic_id') {
        return;
      }
      
      if (typeof record1[key] === 'number' && typeof record2[key] === 'number') {
        // Basic SMOTE interpolation with random alpha
        const alpha = Math.random();
        let interpolatedValue = record1[key] * alpha + record2[key] * (1 - alpha);
        
        // Add some random noise based on diversity factor
        const noiseRange = Math.abs(record1[key] - record2[key]) * dynamicDiversityFactor;
        const noise = (Math.random() * 2 - 1) * noiseRange; // Random value between -noiseRange and +noiseRange
        interpolatedValue += noise;
        
        // Round to integer if original values were integers
        if (Number.isInteger(record1[key]) && Number.isInteger(record2[key])) {
          syntheticRecord[key] = Math.round(interpolatedValue);
        } else {
          // Keep reasonable precision for floating point values
          syntheticRecord[key] = parseFloat(interpolatedValue.toFixed(4));
        }
      }
    });
    
    // Check if this synthetic record is unique (excluding primary keys from fingerprint)
    const fingerprint = createRecordFingerprint(syntheticRecord, targetColumn, primaryKeyFields);
    
    if (!existingFingerprints.has(fingerprint)) {
      existingFingerprints.add(fingerprint);
      syntheticRecords.push(syntheticRecord);
    }
    
    attempts++;
  }
  
  if (syntheticRecords.length < count) {
    console.warn(`Could only generate ${syntheticRecords.length} unique records out of ${count} requested`);
  }
  
  return syntheticRecords;
};

// Helper function to create a unique fingerprint for a record
const createRecordFingerprint = (
  record: any, 
  excludeKey: string,
  additionalExcludeKeys: string[] = []
): string => {
  const relevantData: Record<string, any> = {};
  
  Object.keys(record).forEach(key => {
    if (key !== excludeKey && 
        key !== 'synthetic_id' && 
        !additionalExcludeKeys.includes(key) && 
        typeof record[key] === 'number') {
      relevantData[key] = record[key];
    }
  });
  
  return JSON.stringify(relevantData);
};
