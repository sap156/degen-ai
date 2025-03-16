import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clipboard, Download, RefreshCw, Upload, Sparkles, Sliders } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useApiKey } from '@/contexts/ApiKeyContext';
import ModelSelector from '@/components/ModelSelector';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON, readFileContent } from '@/utils/fileUploadUtils';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';

import { 
  PiiData, 
  PiiDataMasked, 
  MaskingOptions,
  AiMaskingOptions,
  generateSamplePiiData, 
  maskPiiData, 
  exportAsJson, 
  exportAsCsv, 
  downloadData 
} from '@/services/piiHandlingService';

const PiiHandling = () => {
  const { toast } = useToast();
  const { apiKey } = useApiKey();
  const [originalData, setOriginalData] = useState<PiiData[]>([]);
  const [maskedData, setMaskedData] = useState<PiiDataMasked[]>([]);
  const [dataCount, setDataCount] = useState<number>(10);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadDataSchema, setUploadDataSchema] = useState<Record<string, string>>({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<string>('text');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isMaskingData, setIsMaskingData] = useState(false);
  
  const [aiMaskingOptions, setAiMaskingOptions] = useState<AiMaskingOptions>({
    useAi: false,
    maskingPrompt: '',
    preserveFormat: true,
    randomizationLevel: 'medium'
  });
  
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

  useEffect(() => {
    generateData();
  }, []);

  const generateData = () => {
    const data = generateSamplePiiData(dataCount);
    setOriginalData(data);
    applyMasking(data);
  };

  const applyMasking = async (data: PiiData[] = originalData) => {
    try {
      setIsMaskingData(true);
      const masked = await maskPiiData(data, maskingOptions, aiMaskingOptions, apiKey);
      setMaskedData(masked);
    } catch (error) {
      console.error("Error applying masking:", error);
      toast.error("Failed to apply masking to data");
    } finally {
      setIsMaskingData(false);
    }
  };

  const toggleMaskingOption = (field: keyof MaskingOptions) => {
    setMaskingOptions(prev => {
      const newOptions = { ...prev, [field]: !prev[field] };
      return newOptions;
    });
  };

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
      
      const processedData = processUploadedPiiData(parsedData);
      setOriginalData(processedData);
      applyMasking(processedData);
      
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
            if (/^\d{3}-\d{2}-\d{4}$/.test(value)) type = 'ssn';
            else if (/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(value)) type = 'creditCard';
            else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) type = 'email';
            else if (/^\d{3}-\d{3}-\d{4}$/.test(value)) type = 'phoneNumber';
          }
          
          schema[key] = type;
        });
        
        setUploadDataSchema(schema);
      }
      
      toast({
        title: "File processed",
        description: "File processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: (error as Error).message || 'Failed to process file',
        variant: "destructive"
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const processUploadedPiiData = (data: any[]): PiiData[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format. Expected an array of records.');
    }
    
    return data.map((item, index) => {
      const piiItem: Partial<PiiData> = { id: String(index + 1) };
      
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
      
      Object.keys(item).forEach(key => {
        const normalizedKey = key.toLowerCase();
        
        if (fieldMappings[normalizedKey]) {
          piiItem[fieldMappings[normalizedKey]] = String(item[key]);
        } else if (key === 'id') {
          piiItem.id = String(item[key]);
        } else {
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

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Error",
        description: "Field name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setUploadDataSchema(prev => ({
      ...prev,
      [newFieldName]: newFieldType
    }));
    
    setNewFieldName('');
    setNewFieldType('text');
  };

  const handleRemoveField = (fieldName: string) => {
    setUploadDataSchema(prev => {
      const newSchema = { ...prev };
      delete newSchema[fieldName];
      return newSchema;
    });
  };

  const handleGenerateFromSchema = () => {
    generateData();
    toast.success('Generated data based on schema');
  };

  const handleAIMaskingToggle = (value: boolean) => {
    setAiMaskingOptions(prev => ({
      ...prev,
      useAi: value
    }));
  };

  const handleAIMaskingPromptChange = (value: string) => {
    setAiMaskingOptions(prev => ({
      ...prev,
      maskingPrompt: value
    }));
  };

  const handleRandomizationLevelChange = (value: 'low' | 'medium' | 'high') => {
    setAiMaskingOptions(prev => ({
      ...prev,
      randomizationLevel: value
    }));
  };

  const handlePreserveFormatToggle = (value: boolean) => {
    setAiMaskingOptions(prev => ({
      ...prev,
      preserveFormat: value
    }));
  };

  useEffect(() => {
    if (originalData.length > 0) {
      applyMasking();
    }
  }, [maskingOptions, aiMaskingOptions.useAi]);

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
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Mask Fields</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-xs">AI Options</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>AI-Powered Masking</DialogTitle>
                      <DialogDescription>
                        Enhance privacy with AI-generated realistic but fictional data replacements
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-2">
                      <ApiKeyRequirement>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="use-ai" 
                            checked={aiMaskingOptions.useAi}
                            onCheckedChange={handleAIMaskingToggle}
                            disabled={!apiKey}
                          />
                          <Label htmlFor="use-ai" className="font-medium">
                            Enable AI-powered masking
                          </Label>
                        </div>
                        
                        {aiMaskingOptions.useAi && (
                          <>
                            <div className="space-y-2 mt-4">
                              <div className="mb-2">
                                <Label htmlFor="ai-model" className="text-sm">AI Model</Label>
                                <ModelSelector />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="randomization" className="text-sm">Randomization Level</Label>
                                <Select 
                                  defaultValue={aiMaskingOptions.randomizationLevel} 
                                  onValueChange={(v) => handleRandomizationLevelChange(v as 'low' | 'medium' | 'high')}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low - Subtle changes</SelectItem>
                                    <SelectItem value="medium">Medium - Balanced</SelectItem>
                                    <SelectItem value="high">High - Completely different</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-center space-x-2 mt-3">
                                <Switch 
                                  id="preserve-format" 
                                  checked={aiMaskingOptions.preserveFormat}
                                  onCheckedChange={handlePreserveFormatToggle}
                                />
                                <Label htmlFor="preserve-format" className="text-sm">
                                  Preserve original format and pattern
                                </Label>
                              </div>
                              
                              <div className="space-y-2 mt-4">
                                <Label htmlFor="masking-prompt" className="text-sm">Custom Instructions (Optional)</Label>
                                <Textarea 
                                  id="masking-prompt"
                                  placeholder="E.g., 'Keep initials the same' or 'Make all masked names more exotic'"
                                  className="min-h-[80px]"
                                  value={aiMaskingOptions.maskingPrompt}
                                  onChange={(e) => handleAIMaskingPromptChange(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Provide specific instructions for how the AI should mask your data
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </ApiKeyRequirement>
                    </div>
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button">Apply</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
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
              
              {aiMaskingOptions.useAi && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-powered masking enabled
                  </p>
                </div>
              )}
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
                      {isMaskingData ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                              {aiMaskingOptions.useAi && (
                                <p className="text-sm text-muted-foreground">Generating AI-powered masked data...</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : maskedData.length > 0 ? (
                        maskedData.map((item) => (
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
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">No data available</TableCell>
                        </TableRow>
                      )}
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
              
              <h3 className="text-lg font-medium">PII Masking Techniques:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Character masking:</strong> Replace characters with symbols (e.g., converting "John" to "J***")
                  <span className="ml-1 text-blue-600 dark:text-blue-400">- Now enhanced with AI to generate realistic fictional replacements</span>
                </li>
                <li>
                  <strong>Truncation:</strong> Remove portions of data (e.g., showing only last 4 digits of credit card)
                  <span className="ml-1 text-blue-600 dark:text-blue-400">- AI determines optimal truncation patterns</span>
                </li>
                <li><strong>Tokenization:</strong> Replace sensitive data with non-sensitive placeholders</li>
                <li><strong>Encryption:</strong> Transform data using algorithms that require keys to decrypt</li>
                <li><strong>Data redaction:</strong> Completely remove sensitive information from view</li>
              </ul>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI-Enhanced PII Masking
                </h4>
                <p className="mt-2 text-sm">
                  This demo now features AI-powered masking that can generate realistic but completely fictional
                  replacements for sensitive data. Unlike traditional masking techniques that use obvious patterns
                  (like asterisks), AI masking maintains the natural look and feel of the data while ensuring privacy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PiiHandling;
