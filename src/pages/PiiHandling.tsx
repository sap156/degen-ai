
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clipboard, 
  Download, 
  RefreshCw, 
  Sparkles,
  Key,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiKey } from '@/contexts/ApiKeyContext';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON, readFileContent } from '@/utils/fileUploadUtils';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import MaskingFieldControl from '@/components/MaskingFieldControl';
import AddFieldForm from '@/components/AddFieldForm';
import { AddFieldParams, PerFieldMaskingOptions } from '@/types/piiHandling';

import { 
  PiiData, 
  PiiDataMasked, 
  MaskingTechnique,
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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isMaskingData, setIsMaskingData] = useState(false);
  const [isAnalyzingData, setIsAnalyzingData] = useState(false);
  const [piiAnalysisResult, setPiiAnalysisResult] = useState<{identifiedPii: string[], suggestions: string} | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [dataReady, setDataReady] = useState(false);
  
  const [perFieldMaskingOptions, setPerFieldMaskingOptions] = useState<PerFieldMaskingOptions>({
    firstName: { enabled: true, technique: 'character-masking' },
    lastName: { enabled: true, technique: 'character-masking' },
    email: { enabled: true, technique: 'character-masking' },
    phoneNumber: { enabled: true, technique: 'character-masking' },
    ssn: { enabled: true, technique: 'character-masking' },
    address: { enabled: true, technique: 'character-masking' },
    creditCard: { enabled: true, technique: 'character-masking' },
    dob: { enabled: true, technique: 'character-masking' }
  });
  
  const [globalMaskingPreferences, setGlobalMaskingPreferences] = useState({
    preserveFormat: true,
    randomizationLevel: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    generateData();
  }, []);

  const generateData = () => {
    const data = generateSamplePiiData(dataCount);
    setOriginalData(data);
    setDataReady(true);
  };

  const applyMasking = async () => {
    if (!originalData.length) {
      toast({
        title: "No data available",
        description: "Please generate or upload data first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsMaskingData(true);
      const masked = await maskPiiData(originalData, perFieldMaskingOptions, globalMaskingPreferences, apiKey);
      setMaskedData(masked);
      toast({
        title: "Masking complete",
        description: "PII data has been masked successfully",
      });
    } catch (error) {
      console.error("Error applying masking:", error);
      toast({
        title: "Masking failed",
        description: "Failed to apply masking to data",
        variant: "destructive"
      });
    } finally {
      setIsMaskingData(false);
    }
  };

  const toggleFieldMasking = (field: string) => {
    setPerFieldMaskingOptions(prev => {
      const config = prev[field] || { enabled: false, technique: 'character-masking' };
      return {
        ...prev,
        [field]: {
          ...config,
          enabled: !config.enabled
        }
      };
    });
  };
  
  const updateFieldMaskingTechnique = (field: string, technique: MaskingTechnique) => {
    setPerFieldMaskingOptions(prev => {
      const config = prev[field] || { enabled: true, technique: 'character-masking' };
      return {
        ...prev,
        [field]: {
          ...config,
          technique
        }
      };
    });
  };
  
  const updateFieldCustomPrompt = (field: string, customPrompt: string) => {
    setPerFieldMaskingOptions(prev => {
      const config = prev[field] || { enabled: true, technique: 'character-masking' };
      return {
        ...prev,
        [field]: {
          ...config,
          customPrompt
        }
      };
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
      
      // Just detect the fields and structure without applying masking
      const processedData = detectDataFields(parsedData);
      setOriginalData(processedData);
      
      if (parsedData && parsedData.length > 0) {
        const newPerFieldOptions: PerFieldMaskingOptions = {};
        
        // Get all keys from the first object
        const fields = Object.keys(processedData[0]).filter(k => k !== 'id');
        
        // Add each field to masking options with default settings
        fields.forEach(field => {
          newPerFieldOptions[field] = {
            enabled: true,
            technique: 'character-masking'
          };
        });
        
        setPerFieldMaskingOptions(newPerFieldOptions);
      }
      
      setActiveTab('manual');
      setDataReady(true);
      
      if (apiKey) {
        analyzeDataWithAi(processedData);
      }
      
      toast({
        title: "File processed",
        description: "Please configure masking options and click Generate PII Masking",
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

  // Helper function to detect fields in uploaded data instead of using hardcoded mappings
  const detectDataFields = (data: any[]): PiiData[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format. Expected an array of records.');
    }
    
    return data.map((item, index) => {
      // Create a dynamic object for each record
      const record: Record<string, string> = {
        id: item.id || String(index + 1)
      };
      
      // Add all fields from the original data
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id') {
          record[key] = String(value);
        }
      });
      
      return record as unknown as PiiData;
    });
  };

  const handleAddField = ({ name, type }: AddFieldParams) => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Field name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    // Add field to masking options
    setPerFieldMaskingOptions(prev => ({
      ...prev,
      [name]: {
        enabled: true,
        technique: 'character-masking'
      }
    }));
    
    // Add the field to the original data with a default value
    if (originalData.length > 0) {
      const defaultValue = type === 'number' ? '0' : 
                          type === 'email' ? 'example@domain.com' :
                          type === 'phone' ? '000-000-0000' :
                          'Sample value';
      
      setOriginalData(prev => 
        prev.map(item => ({
          ...item,
          [name]: defaultValue
        }))
      );
    }
    
    toast({
      title: "Field added",
      description: `Added new field: ${name}`,
    });
  };

  const handleRemoveField = (fieldName: string) => {
    // Remove from masking options
    setPerFieldMaskingOptions(prev => {
      const newOptions = { ...prev };
      delete newOptions[fieldName];
      return newOptions;
    });
    
    // Remove from data
    if (originalData.length > 0) {
      setOriginalData(prev => 
        prev.map(item => {
          const newItem = { ...item };
          delete newItem[fieldName];
          return newItem;
        })
      );
    }
    
    toast({
      title: "Field removed",
      description: `Removed field: ${fieldName}`,
    });
  };

  const handleRandomizationLevelChange = (value: 'low' | 'medium' | 'high') => {
    setGlobalMaskingPreferences(prev => ({
      ...prev,
      randomizationLevel: value
    }));
  };

  const handlePreserveFormatToggle = (value: boolean) => {
    setGlobalMaskingPreferences(prev => ({
      ...prev,
      preserveFormat: value
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PII Data Handling</h1>
        <p className="text-muted-foreground mt-2">
          Securely handle Personally Identifiable Information (PII) with AI-powered masking and anonymization techniques.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
              <CardDescription>Configure masking options and export settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Generate</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <Label htmlFor="record-count">Number of Records</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="record-count"
                        type="number"
                        min="1"
                        max="100"
                        value={dataCount}
                        onChange={(e) => setDataCount(parseInt(e.target.value) || 10)}
                      />
                      <Button onClick={generateData} size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
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
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Schema Management</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => analyzeDataWithAi(originalData)}
                  disabled={!apiKey || isAnalyzingData || originalData.length === 0}
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
              <CardDescription>
                Add, edit, or remove fields from your data schema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {piiAnalysisResult && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm space-y-2 mb-2">
                  <p className="font-medium text-blue-700 dark:text-blue-300">PII Analysis Results:</p>
                  <p className="text-sm">Identified: {piiAnalysisResult.identifiedPii.join(', ')}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {piiAnalysisResult.suggestions.substring(0, 120)}
                    {piiAnalysisResult.suggestions.length > 120 ? '...' : ''}
                  </p>
                </div>
              )}
              
              <AddFieldForm onAddField={handleAddField} />
              
              <div className="border rounded-md p-3 space-y-3 mt-4">
                <h3 className="text-sm font-medium">Global Masking Preferences</h3>
                
                <div className="space-y-4">
                  <ApiKeyRequirement>
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="randomization" className="text-xs">Randomization Level</Label>
                      <Select 
                        value={globalMaskingPreferences.randomizationLevel} 
                        onValueChange={(v) => handleRandomizationLevelChange(v as 'low' | 'medium' | 'high')}
                      >
                        <SelectTrigger id="randomization" className="h-8 text-sm">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Subtle changes</SelectItem>
                          <SelectItem value="medium">Medium - Balanced</SelectItem>
                          <SelectItem value="high">High - Completely different</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                      
                    <div className="flex items-center justify-between mt-3">
                      <Label htmlFor="preserve-format" className="text-xs">Preserve Format</Label>
                      <div className="flex h-8 items-center space-x-2">
                        <div className={`px-3 py-1 text-xs rounded-l-md cursor-pointer ${!globalMaskingPreferences.preserveFormat ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                            onClick={() => handlePreserveFormatToggle(false)}>
                          No
                        </div>
                        <div className={`px-3 py-1 text-xs rounded-r-md cursor-pointer ${globalMaskingPreferences.preserveFormat ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                            onClick={() => handlePreserveFormatToggle(true)}>
                          Yes
                        </div>
                      </div>
                    </div>
                  </ApiKeyRequirement>
                </div>
              </div>
              
              {dataReady && (
                <Button 
                  className="w-full mt-4" 
                  onClick={applyMasking}
                  disabled={isMaskingData || originalData.length === 0}
                >
                  {isMaskingData ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate PII Masking
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Export or copy your masked data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-sm">Format</Label>
                <div className="flex items-center space-x-2">
                  <div
                    className={`px-3 py-1 text-xs rounded-l-md cursor-pointer ${exportFormat === 'json' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    onClick={() => setExportFormat('json')}
                  >
                    JSON
                  </div>
                  <div
                    className={`px-3 py-1 text-xs rounded-r-md cursor-pointer ${exportFormat === 'csv' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    onClick={() => setExportFormat('csv')}
                  >
                    CSV
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={() => handleExport(maskedData)} 
                  className="w-full"
                  disabled={maskedData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Masked Data
                </Button>
                <Button 
                  onClick={() => copyToClipboard(maskedData)} 
                  variant="outline" 
                  className="w-full"
                  disabled={maskedData.length === 0}
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Field Masking Configuration</CardTitle>
                {isMaskingData && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Applying AI masking...
                  </div>
                )}
              </div>
              <CardDescription>
                Configure masking techniques for each field
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Vertical stack of masking field controls */}
              <div className="space-y-2">
                {Object.entries(perFieldMaskingOptions).map(([field, config]) => (
                  <MaskingFieldControl 
                    key={field}
                    field={field}
                    enabled={config.enabled}
                    maskingTechnique={config.technique}
                    customPrompt={config.customPrompt}
                    onToggle={() => toggleFieldMasking(field)}
                    onTechniqueChange={(technique) => updateFieldMaskingTechnique(field, technique)}
                    onCustomPromptChange={(prompt) => updateFieldCustomPrompt(field, prompt)}
                    onRemoveField={() => handleRemoveField(field)}
                    canRemove={!['firstName', 'lastName', 'email', 'phoneNumber', 'ssn', 'address', 'creditCard', 'dob'].includes(field) || 
                              !Object.keys(originalData[0] || {}).includes(field)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>PII Data Viewer</CardTitle>
              <CardDescription>
                View original and masked PII data side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="original">
                <TabsList>
                  <TabsTrigger value="original">Original Data</TabsTrigger>
                  <TabsTrigger value="masked">Masked Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="original">
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          {originalData.length > 0 && 
                            Object.keys(originalData[0])
                              .filter(k => k !== 'id')
                              .map(field => (
                                <TableHead key={field}>{field}</TableHead>
                              ))
                          }
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {originalData.slice(0, 5).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            {Object.entries(item)
                              .filter(([key]) => key !== 'id')
                              .map(([key, value]) => (
                                <TableCell key={key} className="max-w-[200px] truncate">
                                  {value}
                                </TableCell>
                              ))
                            }
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {originalData.length > 5 && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Showing 5 of {originalData.length} records
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="masked">
                  {maskedData.length > 0 ? (
                    <div className="border rounded-md overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            {maskedData.length > 0 && 
                              Object.keys(maskedData[0])
                                .filter(k => k !== 'id')
                                .map(field => (
                                  <TableHead key={field}>{field}</TableHead>
                                ))
                            }
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {maskedData.slice(0, 5).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id}</TableCell>
                              {Object.entries(item)
                                .filter(([key]) => key !== 'id')
                                .map(([key, value]) => (
                                  <TableCell key={key} className="max-w-[200px] truncate">
                                    {value}
                                  </TableCell>
                                ))
                              }
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {maskedData.length > 5 && (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Showing 5 of {maskedData.length} records
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] border rounded-md bg-muted/10">
                      <p className="text-muted-foreground mb-2">No masked data available</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={applyMasking}
                        disabled={isMaskingData || originalData.length === 0}
                      >
                        Generate PII Masking
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PiiHandling;
