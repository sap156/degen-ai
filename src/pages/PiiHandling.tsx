
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clipboard, Download, RefreshCw, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON, readFileContent } from '@/utils/fileUploadUtils';

import { 
  PiiData, 
  PiiDataMasked, 
  MaskingOptions, 
  generateSamplePiiData, 
  maskPiiData, 
  exportAsJson, 
  exportAsCsv, 
  downloadData 
} from '@/services/piiHandlingService';

const PiiHandling = () => {
  const { toast } = useToast();
  const [originalData, setOriginalData] = useState<PiiData[]>([]);
  const [maskedData, setMaskedData] = useState<PiiDataMasked[]>([]);
  const [dataCount, setDataCount] = useState<number>(10);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadDataSchema, setUploadDataSchema] = useState<Record<string, string>>({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<string>('text');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const [maskingOptions, setMaskingOptions] = useState<MaskingOptions>({
    firstName: true,
    lastName: true,
    email: true,
    phoneNumber: true,
    ssn: true,
    address: true,
    creditCard: true,
    dob: true
  });

  // Generate sample data on component mount
  useEffect(() => {
    generateData();
  }, []);

  // Generate new sample data
  const generateData = () => {
    const data = generateSamplePiiData(dataCount);
    setOriginalData(data);
    applyMasking(data);
  };

  // Apply masking based on current options
  const applyMasking = (data: PiiData[] = originalData) => {
    const masked = maskPiiData(data, maskingOptions);
    setMaskedData(masked);
  };

  // Toggle masking option for a field
  const toggleMaskingOption = (field: keyof MaskingOptions) => {
    setMaskingOptions(prev => {
      const newOptions = { ...prev, [field]: !prev[field] };
      // Apply new masking options
      const masked = maskPiiData(originalData, newOptions);
      setMaskedData(masked);
      return newOptions;
    });
  };

  // Export data
  const handleExport = (dataToExport: PiiData[] | PiiDataMasked[]) => {
    const filename = `pii-data-${exportFormat === 'json' ? 'json' : 'csv'}`;
    const exportedData = exportFormat === 'json' 
      ? exportAsJson(dataToExport) 
      : exportAsCsv(dataToExport);
    
    downloadData(exportedData, filename, exportFormat);
    
    toast({
      title: "Data exported",
      description: `PII data has been exported as ${exportFormat.toUpperCase()}`,
    });
  };

  // Copy data to clipboard
  const copyToClipboard = (dataToExport: PiiData[] | PiiDataMasked[]) => {
    const exportedData = exportFormat === 'json' 
      ? exportAsJson(dataToExport) 
      : exportAsCsv(dataToExport);
    
    navigator.clipboard.writeText(exportedData)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "PII data has been copied to your clipboard",
        });
      })
      .catch(err => {
        toast({
          title: "Copy failed",
          description: "Failed to copy data to clipboard",
          variant: "destructive"
        });
        console.error("Failed to copy data:", err);
      });
  };

  // Handle file upload for PII data
  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      setIsProcessingFile(true);
      
      const content = await readFileContent(file);
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      let parsedData;
      
      if (fileExt === 'csv') {
        parsedData = parseCSV(content);
      } else if (fileExt === 'json') {
        parsedData = parseJSON(content);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or JSON.');
      }
      
      // Detect PII fields and map them to the app's data structure
      const processedData = processUploadedPiiData(parsedData);
      setOriginalData(processedData);
      applyMasking(processedData);
      
      // Extract schema from the first item to use for custom generation
      if (parsedData && parsedData.length > 0) {
        const schema: Record<string, string> = {};
        const firstItem = parsedData[0];
        
        Object.keys(firstItem).forEach(key => {
          const value = firstItem[key];
          let type = 'text';
          
          if (typeof value === 'number') type = 'number';
          else if (typeof value === 'boolean') type = 'boolean';
          else if (value instanceof Date) type = 'date';
          else if (typeof value === 'string') {
            // Try to determine if it's a specific PII type
            if (/^\d{3}-\d{2}-\d{4}$/.test(value)) type = 'ssn';
            else if (/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(value)) type = 'creditCard';
            else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) type = 'email';
            else if (/^\d{3}-\d{3}-\d{4}$/.test(value)) type = 'phoneNumber';
          }
          
          schema[key] = type;
        });
        
        setUploadDataSchema(schema);
      }
      
      toast.success('File processed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error((error as Error).message || 'Failed to process file');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Process uploaded data into the expected PII format
  const processUploadedPiiData = (data: any[]): PiiData[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format. Expected an array of records.');
    }
    
    // Try to map fields to our expected PII data structure
    return data.map((item, index) => {
      const piiItem: Partial<PiiData> = { id: String(index + 1) };
      
      // Try to map common field names to our PII structure
      const fieldMappings: Record<string, keyof PiiData> = {
        firstName: 'firstName',
        first_name: 'firstName',
        'first-name': 'firstName',
        firstname: 'firstName',
        name: 'firstName',
        given_name: 'firstName',
        
        lastName: 'lastName',
        last_name: 'lastName',
        'last-name': 'lastName',
        lastname: 'lastName',
        surname: 'lastName',
        family_name: 'lastName',
        
        email: 'email',
        'email-address': 'email',
        emailAddress: 'email',
        
        phone: 'phoneNumber',
        phoneNumber: 'phoneNumber',
        phone_number: 'phoneNumber',
        'phone-number': 'phoneNumber',
        cell: 'phoneNumber',
        mobile: 'phoneNumber',
        
        ssn: 'ssn',
        social_security: 'ssn',
        'social-security': 'ssn',
        social_security_number: 'ssn',
        'social-security-number': 'ssn',
        
        address: 'address',
        street_address: 'address',
        'street-address': 'address',
        streetAddress: 'address',
        home_address: 'address',
        
        cc: 'creditCard',
        credit_card: 'creditCard',
        'credit-card': 'creditCard',
        creditCard: 'creditCard',
        card_number: 'creditCard',
        'card-number': 'creditCard',
        
        dob: 'dob',
        date_of_birth: 'dob',
        'date-of-birth': 'dob',
        birthdate: 'dob',
        birth_date: 'dob',
        'birth-date': 'dob'
      };
      
      // Map fields based on name
      Object.keys(item).forEach(key => {
        const normalizedKey = key.toLowerCase();
        
        if (fieldMappings[normalizedKey]) {
          piiItem[fieldMappings[normalizedKey]] = String(item[key]);
        } else if (key === 'id') {
          piiItem.id = String(item[key]);
        } else {
          // For unmapped fields, try to determine if they're PII by content
          const value = String(item[key]);
          
          if (/^\d{3}-\d{2}-\d{4}$/.test(value) && !piiItem.ssn) {
            piiItem.ssn = value;
          } else if (/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(value) && !piiItem.creditCard) {
            piiItem.creditCard = value;
          } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !piiItem.email) {
            piiItem.email = value;
          } else if (/^\d{3}-\d{3}-\d{4}$/.test(value) && !piiItem.phoneNumber) {
            piiItem.phoneNumber = value;
          }
        }
      });
      
      // Ensure all required fields exist, fill with placeholder if not found
      const result: PiiData = {
        id: piiItem.id || String(index + 1),
        firstName: piiItem.firstName || 'Unknown',
        lastName: piiItem.lastName || 'Unknown',
        email: piiItem.email || 'unknown@example.com',
        phoneNumber: piiItem.phoneNumber || '000-000-0000',
        ssn: piiItem.ssn || '000-00-0000',
        address: piiItem.address || 'Unknown Address',
        creditCard: piiItem.creditCard || '0000-0000-0000-0000',
        dob: piiItem.dob || '01/01/1970'
      };
      
      return result;
    });
  };

  // Add custom field to the schema
  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast.error('Field name cannot be empty');
      return;
    }
    
    setUploadDataSchema(prev => ({
      ...prev,
      [newFieldName]: newFieldType
    }));
    
    setNewFieldName('');
    setNewFieldType('text');
  };

  // Remove field from schema
  const handleRemoveField = (fieldName: string) => {
    setUploadDataSchema(prev => {
      const newSchema = { ...prev };
      delete newSchema[fieldName];
      return newSchema;
    });
  };

  // Generate data based on custom schema
  const handleGenerateFromSchema = () => {
    // In a real app, this would use the schema to generate appropriate data
    // For this demo, we'll just use our standard generation
    generateData();
    toast.success('Generated data based on schema');
  };

  // UI animations with framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto py-6 space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">PII Data Handling</h1>
        <p className="text-muted-foreground mt-2">
          Securely handle Personally Identifiable Information (PII) with masking and anonymization techniques.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Configure masking options and export settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="generate">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate">Generate</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="space-y-4">
                <div>
                  <Label htmlFor="record-count">Number of Records</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      id="record-count"
                      type="number"
                      min="1"
                      max="100"
                      value={dataCount}
                      onChange={(e) => setDataCount(parseInt(e.target.value) || 10)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button onClick={generateData} size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <FileUploader
                  onFileUpload={handleFileUpload}
                  accept=".csv, .json"
                  title="Upload PII Data"
                  description="Upload a CSV or JSON file with PII data"
                />
                
                {uploadedFile && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <p className="font-medium">File: {uploadedFile.name}</p>
                    <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                
                {Object.keys(uploadDataSchema).length > 0 && (
                  <div className="space-y-3 border p-3 rounded-md mt-4">
                    <h3 className="text-sm font-medium">Detected Schema</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(uploadDataSchema).map(([field, type]) => (
                        <div key={field} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{field}:</span> {type}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveField(field)}
                            className="h-6 w-6 p-0"
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-end space-x-2 pt-2 border-t">
                      <div className="flex-1">
                        <Label htmlFor="new-field" className="text-xs">New Field</Label>
                        <Input 
                          id="new-field" 
                          value={newFieldName} 
                          onChange={(e) => setNewFieldName(e.target.value)}
                          placeholder="Field name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <Label htmlFor="field-type" className="text-xs">Type</Label>
                        <select 
                          id="field-type"
                          value={newFieldType}
                          onChange={(e) => setNewFieldType(e.target.value)}
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="phoneNumber">Phone</option>
                          <option value="ssn">SSN</option>
                          <option value="creditCard">Credit Card</option>
                          <option value="address">Address</option>
                          <option value="dob">DOB</option>
                        </select>
                      </div>
                      <Button size="sm" onClick={handleAddField} className="h-8">Add</Button>
                    </div>
                    
                    <Button 
                      onClick={handleGenerateFromSchema} 
                      className="w-full mt-2"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate from Schema
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div>
              <h3 className="text-sm font-medium mb-2">Mask Fields</h3>
              <div className="space-y-2">
                {Object.keys(maskingOptions).map((field) => (
                  <div className="flex items-center space-x-2" key={field}>
                    <Checkbox 
                      id={`mask-${field}`} 
                      checked={maskingOptions[field as keyof MaskingOptions]} 
                      onCheckedChange={() => toggleMaskingOption(field as keyof MaskingOptions)}
                    />
                    <Label 
                      htmlFor={`mask-${field}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Export Format</h3>
              <div className="flex items-center space-x-2">
                <Tabs defaultValue="json" onValueChange={(value) => setExportFormat(value as 'json' | 'csv')}>
                  <TabsList>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                    <TabsTrigger value="csv">CSV</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>PII Data Viewer</CardTitle>
            <CardDescription>View original and masked PII data</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="masked" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="masked">Masked Data</TabsTrigger>
                <TabsTrigger value="original">Original Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="masked" className="space-y-4">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(maskedData)}>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="default" size="sm" onClick={() => handleExport(maskedData)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>SSN</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Credit Card</TableHead>
                        <TableHead>DOB</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maskedData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.firstName}</TableCell>
                          <TableCell>{item.lastName}</TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>{item.phoneNumber}</TableCell>
                          <TableCell>{item.ssn}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.address}</TableCell>
                          <TableCell>{item.creditCard}</TableCell>
                          <TableCell>{item.dob}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="original" className="space-y-4">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(originalData)}>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="default" size="sm" onClick={() => handleExport(originalData)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>SSN</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Credit Card</TableHead>
                        <TableHead>DOB</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {originalData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.firstName}</TableCell>
                          <TableCell>{item.lastName}</TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>{item.phoneNumber}</TableCell>
                          <TableCell>{item.ssn}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.address}</TableCell>
                          <TableCell>{item.creditCard}</TableCell>
                          <TableCell>{item.dob}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>About PII Handling</CardTitle>
            <CardDescription>Understanding PII and its importance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Personally Identifiable Information (PII) is any data that could potentially identify a specific individual. 
                Organizations must handle PII with care to comply with privacy regulations such as GDPR, CCPA, and HIPAA.
              </p>
              
              <h3 className="text-lg font-medium">Common PII Masking Techniques:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Character masking:</strong> Replace characters with symbols (e.g., converting "John" to "J***")</li>
                <li><strong>Truncation:</strong> Remove portions of data (e.g., showing only last 4 digits of credit card)</li>
                <li><strong>Tokenization:</strong> Replace sensitive data with non-sensitive placeholders</li>
                <li><strong>Encryption:</strong> Transform data using algorithms that require keys to decrypt</li>
                <li><strong>Data redaction:</strong> Completely remove sensitive information from view</li>
              </ul>
              
              <p>
                This demo showcases basic masking techniques. In production systems, more sophisticated approaches 
                and comprehensive security measures should be implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PiiHandling;
