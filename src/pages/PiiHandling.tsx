import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clipboard, 
  Download, 
  RefreshCw, 
  Upload, 
  Sparkles, 
  Sliders, 
  Key, 
  ShieldCheck, 
  FileText, 
  Lock,
  ClipboardCheck,
  ScissorsLineDashed
} from 'lucide-react';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';

import { 
  PiiData, 
  PiiDataMasked, 
  MaskingOptions,
  AiMaskingOptions,
  MaskingTechnique,
  EncryptionMethod,
  generateSamplePiiData, 
  maskPiiData, 
  exportAsJson, 
  exportAsCsv, 
  downloadData,
  analyzePiiData
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
  const [isAnalyzingData, setIsAnalyzingData] = useState(false);
  const [piiAnalysisResult, setPiiAnalysisResult] = useState<{identifiedPii: string[], suggestions: string} | null>(null);
  
  const [aiMaskingOptions, setAiMaskingOptions] = useState<AiMaskingOptions>({
    useAi: false,
    maskingPrompt: '',
    preserveFormat: true,
    randomizationLevel: 'medium',
    maskingTechnique: 'character-masking',
    encryptionMethod: 'aes-256'
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
      
      // Auto-switch to manual tab after successful upload
      setActiveTab('manual');

      // Automatically analyze PII data if API key is available
      if (apiKey) {
        analyzeDataWithAi(processedData);
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

  const analyzeDataWithAi = async (data: PiiData[]) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Set your OpenAI API key to use AI-powered analysis",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzingData(true);
      const result = await analyzePiiData(data, apiKey);
      setPiiAnalysisResult(result);
      
      toast({
        title: "PII Analysis Complete",
        description: `Identified ${result.identifiedPii.length} types of PII data`,
      });
    } catch (error) {
      console.error("Error analyzing data with AI:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze PII data with AI",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingData(false);
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

  const handleMaskingTechniqueChange = (value: MaskingTechnique) => {
    setAiMaskingOptions(prev => ({
      ...prev,
      maskingTechnique: value
    }));
  };

  const handleEncryptionMethodChange = (value: EncryptionMethod) => {
    setAiMaskingOptions(prev => ({
      ...prev,
      encryptionMethod: value
    }));
  };

  useEffect(() => {
    if (originalData.length > 0) {
      applyMasking();
    }
  }, [maskingOptions, aiMaskingOptions.useAi, aiMaskingOptions.maskingTechnique, aiMaskingOptions.encryptionMethod]);

  // Animation variants
  const [activeTab, setActiveTab] = useState<string>('manual');
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

  const renderMaskingTechniqueIcon = (technique: MaskingTechnique) => {
    switch (technique) {
      case 'character-masking':
        return <ClipboardCheck className="mr-2 h-4 w-4" />;
      case 'truncation':
        return <ScissorsLineDashed className="mr-2 h-4 w-4" />;
      case 'tokenization':
        return <FileText className="mr-2 h-4 w-4" />;
      case 'encryption':
        return <Lock className="mr-2 h-4 w-4" />;
      case 'redaction':
        return <ShieldCheck className="mr-2 h-4 w-4" />;
      case 'synthetic-replacement':
        return <Sparkles className="mr-2 h-4 w-4" />;
      default:
        return <Sparkles className="mr-2 h-4 w-4" />;
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
            <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Generate</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4">
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

                {/* Schema Editor section */}
                {Object.keys(uploadDataSchema).length > 0 && (
                  <div className="space-y-3 border p-3 rounded-md mt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Schema Configuration</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => analyzeDataWithAi(originalData)}
                        disabled={!apiKey || isAnalyzingData}
                        className="text-xs h-7"
                      >
                        {isAnalyzingData ? (
                          <>
                            <div className="animate-spin h-3 w-3 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Analyze PII
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {piiAnalysisResult && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-md text-xs space-y-1 mb-2">
                        <p className="font-medium text-blue-700 dark:text-blue-300">PII Analysis Results:</p>
                        <p>Identified: {piiAnalysisResult.identifiedPii.join(', ')}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {piiAnalysisResult.suggestions.substring(0, 120)}
                          {piiAnalysisResult.suggestions.length > 120 ? '...' : ''}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(uploadDataSchema).map(([field, type]) => (
                        <div key={field} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium">{field}:</span> {type}
                          </div>
                          <div className="flex items-center">
                            <Checkbox 
                              id={`edit-mask-${field}`}
                              checked={maskingOptions[field as keyof MaskingOptions] ?? false}
                              onCheckedChange={() => field in maskingOptions && toggleMaskingOption(field as keyof MaskingOptions)}
                              className="mr-2 h-3 w-3"
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveField(field)}
                              className="h-6 w-6 p-0"
                            >
                              &times;
                            </Button>
                          </div>
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
              
              <TabsContent value="upload" className="space-y-4">
                <div>
                  <Label className="mb-2 block">Upload JSON or CSV file</Label>
                  <FileUploader
                    onFileUpload={handleFileUpload}
                    accept=".json,.csv"
                    maxSize={5}
                    title="Upload Schema"
                    description="Upload a JSON or CSV file with sample data"
                  />
                </div>
                
                {isProcessingFile && (
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="text-sm">Processing file...</span>
                  </div>
                )}
                
                {uploadedFile && !isProcessingFile && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <p className="font-medium">File: {uploadedFile.name}</p>
                    <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
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
                  <DialogContent className="sm:max-w-[500px]">
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
                            <div className="space-y-4 mt-4">
                              <div className="mb-2">
                                <Label htmlFor="ai-model" className="text-sm">AI Model</Label>
                                <ModelSelector />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="masking-technique" className="text-sm">Masking Technique</Label>
                                <Select 
                                  defaultValue={aiMaskingOptions.maskingTechnique} 
                                  onValueChange={(v) => handleMaskingTechniqueChange(v as MaskingTechnique)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select technique" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="character-masking">
                                      <div className="flex items-center">
                                        <ClipboardCheck className="mr-2 h-4 w-4" />
                                        <span>Character Masking</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="truncation">
                                      <div className="flex items-center">
                                        <ScissorsLineDashed className="mr-2 h-4 w-4" />
                                        <span>Truncation</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="tokenization">
                                      <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>Tokenization</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="encryption">
                                      <div className="flex items-center">
                                        <Lock className="mr-2 h-4 w-4" />
                                        <span>Encryption</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="redaction">
                                      <div className="flex items-center">
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        <span>Data Redaction</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="synthetic-replacement">
                                      <div className="flex items-center">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        <span>Synthetic Replacement</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {aiMaskingOptions.maskingTechnique === 'encryption' && (
                                <div className="space-y-2 mt-1">
                                  <Label htmlFor="encryption-method" className="text-sm">Encryption Method</Label>
                                  <Select 
                                    defaultValue={aiMaskingOptions.encryptionMethod} 
                                    onValueChange={(v) => handleEncryptionMethodChange(v as EncryptionMethod)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="aes-256">
                                        <div className="flex items-center">
                                          <Key className="mr-2 h-4 w-4" />
                                          <span>AES-256</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="rsa">
                                        <div className="flex items-center">
                                          <Key className="mr-2 h-4 w-4" />
                                          <span>RSA</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="sha-256">
                                        <div className="flex items-center">
                                          <Key className="mr-2 h-4 w-4" />
                                          <span>SHA-256</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="md5">
                                        <div className="flex items-center">
                                          <Key className="mr-2 h-4 w-4" />
                                          <span>MD5</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="base64">
                                        <div className="flex items-center">
                                          <Key className="mr-2 h-4 w-4" />
                                          <span>Base64</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="ai-recommended">
                                        <div className="flex items-center">
                                          <Sparkles className="mr-2 h-4 w-4" />
                                          <span>AI Recommended</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <Label htmlFor="randomization" className="text-sm">Randomization Level</Label>
                                <Select 
                                  defaultValue={aiMaskingOptions.randomizationLevel} 
                                  onValueChange={(v) => handleRandomizationLevelChange(v as 'low' | 'medium' | 'high')}
                                >
                                  <SelectTrigger className="w-full">
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
