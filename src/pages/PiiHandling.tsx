
import React from 'react';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle,
  Clipboard, 
  Download, 
  UploadCloud,
  RefreshCw, 
  Sparkles,
  Play,
  Info,
  Eye,
  Check,
  X,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiKey } from '@/contexts/ApiKeyContext';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON } from '@/utils/dataParsing';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import MaskingFieldControl from '@/components/MaskingFieldControl';
import { DetectedPiiField, PerFieldMaskingOptions } from '@/types/piiHandling';
import { Textarea } from '@/components/ui/textarea';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateDataPointsCount } from '@/utils/fileUploadUtils';

import { 
  PiiData, 
  PiiDataMasked, 
  generateSamplePiiData, 
  maskPiiData, 
  exportAsJson, 
  exportAsCsv, 
  downloadData,
  detectPiiInData,
  generateMaskingSuggestions
} from '@/services/piiHandlingService';

import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';
import UserGuidePiiHandling from '@/components/ui/UserGuidePiiHandling';

const PiiHandling = () => {
  const { apiKey } = useApiKey();
  const [originalData, setOriginalData] = useState<PiiData[]>([]);
  const [maskedData, setMaskedData] = useState<PiiDataMasked[]>([]);
  const [dataCount] = useState<number>(10);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDetectingPii, setIsDetectingPii] = useState(false);
  const [isMaskingData, setIsMaskingData] = useState(false);
  const [piiDetectionResult, setPiiDetectionResult] = useState<{
    detectedFields: DetectedPiiField[];
    suggestedPrompt: string;
    undetectedFields: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [dataReady, setDataReady] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'tabbed'>('tabbed');
  const [perFieldMaskingOptions, setPerFieldMaskingOptions] = useState<PerFieldMaskingOptions>({});
  const [globalMaskingPreferences, setGlobalMaskingPreferences] = useState({
    preserveFormat: true
  });
  const [maskingSuggestions, setMaskingSuggestions] = useState<Record<string, string>>({});

  const examplePrompts = [
    "Mask emails by keeping the domain but replacing the username with asterisks. Replace all digits in credit cards with X except the last 4. For names, keep first initial only.",
    "Use encryption for SSN (format xxx-xx-xxxx), truncate addresses to only show city, replace all credit card digits with '*' but keep the dashes.",
    "Replace all names with random synthetic names. Tokenize email addresses. Mask phone numbers as (XXX) XXX-1234 format, keeping last 4 digits only."
  ];

  useEffect(() => {
    // Don't auto-generate data on component mount
    // generateData();
  }, []);

  const generateData = () => {
    const data = generateSamplePiiData(dataCount);
    setOriginalData(data);
    
    const newMaskingOptions: PerFieldMaskingOptions = {};
    if (data.length > 0) {
      Object.keys(data[0])
        .filter(key => key !== 'id')
        .forEach(field => {
          newMaskingOptions[field] = { enabled: true };
        });
    }
    
    setPerFieldMaskingOptions(newMaskingOptions);
    setDataReady(true);
  };

  const applyMasking = async () => {
    if (!originalData.length) {
      toast({
        title: "No data available",
        description: "Please upload data first",
        variant: "destructive"
      });
      return;
    }
    
    if (!apiKey) {
      toast({
        title: "API key required",
        description: "Please set up your OpenAI API key to use AI-powered masking",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsMaskingData(true);
      setProcessingProgress(0);
      
      // Process data in batches for large datasets
      const batchSize = 100;
      const totalBatches = Math.ceil(originalData.length / batchSize);
      let allMaskedData: PiiDataMasked[] = [];
      
      for (let i = 0; i < totalBatches; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min((i + 1) * batchSize, originalData.length);
        const batch = originalData.slice(batchStart, batchEnd);
        
        const maskedBatch = await maskPiiData(
          batch, 
          perFieldMaskingOptions,
          {
            aiPrompt,
            preserveFormat: globalMaskingPreferences.preserveFormat
          },
          apiKey
        );
        
        allMaskedData = [...allMaskedData, ...maskedBatch];
        setProcessingProgress(Math.round(((i + 1) / totalBatches) * 100));
      }
      
      setMaskedData(allMaskedData);
      toast({
        title: "Masking complete",
        description: `All ${allMaskedData.length} records have been masked successfully`,
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
      setProcessingProgress(100);
    }
  };

  const toggleFieldMasking = (field: string) => {
    setPerFieldMaskingOptions(prev => {
      const config = prev[field] || { enabled: false };
      return {
        ...prev,
        [field]: {
          ...config,
          enabled: !config.enabled
        }
      };
    });
  };

  const handleExport = (dataToExport: PiiData[] | PiiDataMasked[]) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "Please generate or mask data first",
        variant: "destructive"
      });
      return;
    }

    const filename = `pii-masked-data-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    const exportedData = exportFormat === 'json' 
      ? exportAsJson(dataToExport) 
      : exportAsCsv(dataToExport);
    
    downloadData(exportedData, filename, exportFormat);
    
    toast({
      title: "Data exported",
      description: `${dataToExport.length} records exported as ${exportFormat.toUpperCase()}`,
    });
  };

  const copyToClipboard = (dataToExport: PiiData[] | PiiDataMasked[]) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No data to copy",
        description: "Please generate or mask data first",
        variant: "destructive"
      });
      return;
    }

    const exportedData = exportFormat === 'json' 
      ? exportAsJson(dataToExport) 
      : exportAsCsv(dataToExport);
    
    navigator.clipboard.writeText(exportedData)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: `${dataToExport.length} records copied to clipboard`,
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
      setMaskedData([]);
      setPiiDetectionResult(null);
      
      // Read file content
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          
          let parsedData;
          
          if (fileExt === 'csv') {
            parsedData = parseCSV(content);
          } else if (fileExt === 'json') {
            parsedData = JSON.parse(content);
            if (!Array.isArray(parsedData)) {
              parsedData = [parsedData]; // Convert to array if it's a single object
            }
          } else {
            throw new Error('Unsupported file format. Please upload CSV or JSON.');
          }
          
          const processedData = detectDataFields(parsedData);
          setOriginalData(processedData);
          
          // Initialize all fields to be masked by default
          if (processedData && processedData.length > 0) {
            const newPerFieldOptions: PerFieldMaskingOptions = {};
            
            const fields = Object.keys(processedData[0]).filter(k => k !== 'id');
            
            fields.forEach(field => {
              newPerFieldOptions[field] = {
                enabled: true
              };
            });
            
            setPerFieldMaskingOptions(newPerFieldOptions);
          }
          
          setDataReady(true);
          toast({
            title: "File processed",
            description: `${processedData.length} records detected. Identifying PII fields...`,
          });
          
          // Auto-detect PII fields if API key is available
          if (apiKey) {
            await detectPiiFields(processedData);
          }
        } catch (error) {
          console.error('Error processing file content:', error);
          toast({
            title: "Error processing file",
            description: (error as Error).message || 'Failed to process file content',
            variant: "destructive"
          });
        } finally {
          setIsProcessingFile(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Failed to read the file",
          variant: "destructive"
        });
        setIsProcessingFile(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: (error as Error).message || 'Failed to process file',
        variant: "destructive"
      });
      setIsProcessingFile(false);
    }
  };

  const detectPiiFields = async (data: PiiData[]) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Set your OpenAI API key to use AI-powered PII detection",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDetectingPii(true);
      const result = await detectPiiInData(data, apiKey);
      setPiiDetectionResult(result);
      
      // Auto-set the suggested prompt
      if (result.suggestedPrompt) {
        setAiPrompt(result.suggestedPrompt);
      }
      
      // Auto-select detected fields
      if (result.detectedFields && result.detectedFields.length > 0) {
        const newOptions = { ...perFieldMaskingOptions };
        
        // First, disable all fields
        Object.keys(newOptions).forEach(field => {
          newOptions[field] = { ...newOptions[field], enabled: false };
        });
        
        // Then enable only detected PII fields
        result.detectedFields.forEach(field => {
          if (newOptions[field.fieldName]) {
            newOptions[field.fieldName] = { ...newOptions[field.fieldName], enabled: true };
          }
        });
        
        setPerFieldMaskingOptions(newOptions);
      }
      
      toast({
        title: "PII Detection Complete",
        description: `Identified ${result.detectedFields.length} potential PII fields`,
      });
    } catch (error) {
      console.error("Error detecting PII:", error);
      toast({
        title: "Detection Failed",
        description: "Failed to detect PII fields",
        variant: "destructive"
      });
    } finally {
      setIsDetectingPii(false);
    }
  };

  const detectDataFields = (data: any[]): PiiData[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format. Expected an array of records.');
    }
    
    return data.map((item, index) => {
      const record: Record<string, string> = {
        id: item.id || String(index + 1)
      };
      
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id') {
          record[key] = String(value || '');
        }
      });
      
      return record as unknown as PiiData;
    });
  };

  const handlePreserveFormatToggle = (value: boolean) => {
    setGlobalMaskingPreferences(prev => ({
      ...prev,
      preserveFormat: value
    }));
  };

  const handleAiPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiPrompt(e.target.value);
  };

  const handleApplyExamplePrompt = (prompt: string) => {
    setAiPrompt(prompt);
  };

  const getFieldMaskingSuggestion = (fieldName: string): string => {
    // Get sample values for this field
    const sampleValues = originalData.slice(0, 3).map(item => item[fieldName]);
    return generateMaskingSuggestions(fieldName, sampleValues);
  };

  const toggleAllFields = (enabled: boolean) => {
    const updatedOptions = { ...perFieldMaskingOptions };
    
    Object.keys(updatedOptions).forEach(field => {
      updatedOptions[field] = { ...updatedOptions[field], enabled };
    });
    
    setPerFieldMaskingOptions(updatedOptions);
  };

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!apiKey || !originalData.length) return;
      let fields: string[] = [];
      if (piiDetectionResult && piiDetectionResult.detectedFields.length > 0) {
        fields = piiDetectionResult.detectedFields.map(f => f.fieldName);
      } else {
        fields = Object.keys(originalData[0] || {}).filter(k => k !== 'id');
      }
      if (!fields.length) return;

      const sampleRecords = originalData.slice(0, 5);
      const fieldToSuggestion: Record<string, string> = {};

      await Promise.all(fields.map(async (field) => {
        // Take up to 5 examples, always as context for OpenAI
        const examples = sampleRecords.map(rec => rec[field]).filter(Boolean).slice(0, 5);
        if (examples.length === 0) {
          fieldToSuggestion[field] = "No data available to generate suggestion.";
          return;
        }

        try {
          // The suggestion prompt is handled inside generateMaskingSuggestions, which will call OpenAI
          fieldToSuggestion[field] = await generateMaskingSuggestions(field, examples);
        } catch (err) {
          fieldToSuggestion[field] = "AI could not generate a suggestion for this field.";
        }
      }));

      setMaskingSuggestions(fieldToSuggestion);
    };

    const timer = setTimeout(fetchSuggestions, 350);
    return () => clearTimeout(timer);
// eslint-disable-next-line
  }, [originalData, piiDetectionResult, apiKey]);

const PiiHandlingContent = () => {
  return (
    <div className="container mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PII Data Handling</h1>
        <p className="text-muted-foreground mt-2">
          Securely handle Personally Identifiable Information (PII) with AI-powered detection and masking techniques.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Import</CardTitle>
              <CardDescription>Upload your data for PII handling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Upload JSON or CSV file</Label>
                <FileUploader
                  onFileUpload={handleFileUpload}
                  accept=".json,.csv"
                  maxSize={50}
                  title="Upload Data"
                  description="Upload a JSON or CSV file with data to mask"
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
                  <p>Records: {originalData.length}</p>
                </div>
              )}

              {dataReady && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => detectPiiFields(originalData)}
                  disabled={!apiKey || isDetectingPii || originalData.length === 0}
                  className="w-full"
                >
                  {isDetectingPii ? (
                    <>
                      <div className="animate-spin h-3 w-3 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Detecting PII...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Detect PII Fields
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Masking Instructions</CardTitle>
              <CardDescription>
                Describe how you want each field to be masked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {piiDetectionResult && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm space-y-2 mb-2">
                  <p className="font-medium text-blue-700 dark:text-blue-300">PII Detection Results:</p>
                  <p className="text-sm">
                    Identified {piiDetectionResult.detectedFields.length} potential PII fields
                  </p>
                  {piiDetectionResult.detectedFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {piiDetectionResult.detectedFields.map((field, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {field.fieldName}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      No PII fields automatically detected. Please select fields manually.
                    </div>
                  )}
                </div>
              )}

              <div className="border rounded-md p-3 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-masking-prompt" className="text-sm font-medium">
                      Masking Instructions
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]" align="end">
                          <p className="text-xs">
                            Provide specific instructions for how you want each field masked.
                            For example: "Mask emails by keeping the domain but replace username with asterisks.
                            Replace all digits in credit cards except the last 4."
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea 
                    id="ai-masking-prompt"
                    placeholder="Describe exactly how you want each field masked. Be specific about techniques and formats."
                    value={aiPrompt}
                    onChange={handleAiPromptChange}
                    className="min-h-[120px]"
                  />

                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground mb-2 block">Example instructions:</Label>
                    <div className="space-y-2">
                      {examplePrompts.map((prompt, index) => (
                        <div 
                          key={index}
                          className="text-xs p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => handleApplyExamplePrompt(prompt)}
                        >
                          {prompt.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  </div>
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
              </div>

              {dataReady && (
                <Button 
                  className="w-full mt-4" 
                  onClick={applyMasking}
                  disabled={isMaskingData || originalData.length === 0 || !apiKey}
                >
                  {isMaskingData ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                      Processing... {processingProgress > 0 && `${processingProgress}%`}
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Generate PII Masking
                    </>
                  )}
                </Button>
              )}

              {isMaskingData && processingProgress > 0 && (
                <Progress value={processingProgress} className="h-2" />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Fields to Mask</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleAllFields(true)}
                    className="text-xs h-8"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toggleAllFields(false)}
                    className="text-xs h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
              <CardDescription>
                Select which fields should be masked by the AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(perFieldMaskingOptions).length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <UploadCloud className="mx-auto h-12 w-12 text-muted" />
                    <p className="mt-2">Upload a file to view available fields</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(perFieldMaskingOptions).map(([field, config]) => (
                      <div key={field} className="border rounded-md p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <MaskingFieldControl 
                              field={field}
                              enabled={config.enabled}
                              onToggle={() => toggleFieldMasking(field)}
                            />
                            {piiDetectionResult?.detectedFields.some(f => f.fieldName === field) && (
                              <Badge className="ml-2 text-xs" variant="secondary">
                                Detected PII
                              </Badge>
                            )}
                          </div>
                        </div>
                        {config.enabled && (
                          <div className="mt-2 text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                            <p>
                              Suggestion: {maskingSuggestions[field] ? maskingSuggestions[field] : "Analyzing..."}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>PII Data Viewer</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewMode(viewMode === 'tabbed' ? 'side-by-side' : 'tabbed')}
                    className="h-8"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {viewMode === 'tabbed' ? 'Side by Side' : 'Tabbed View'}
                  </Button>
                </div>
              </div>
              <CardDescription>
                View original and masked PII data {viewMode === 'tabbed' ? 'in tabs' : 'side by side'} (showing first 5 records)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Export Format:</Label>
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
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleExport(maskedData)} 
                    className="w-fit"
                    disabled={maskedData.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Masked Data
                  </Button>
                  <Button 
                    onClick={() => copyToClipboard(maskedData)} 
                    variant="outline" 
                    className="w-fit"
                    disabled={maskedData.length === 0}
                  >
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
              {viewMode === 'tabbed' ? (
                <Tabs defaultValue="original">
                  <TabsList>
                    <TabsTrigger value="original">Original Data</TabsTrigger>
                    <TabsTrigger value="masked">Masked Data</TabsTrigger>
                  </TabsList>
                  <TabsContent value="original">
                    {originalData.length > 0 ? (
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
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] border rounded-md bg-muted/10">
                        <p className="text-muted-foreground mb-2">No data uploaded</p>
                        <p className="text-xs text-muted-foreground">Upload a CSV or JSON file to get started</p>
                      </div>
                    )}
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
                        <p className="text-xs text-muted-foreground">Use the masking controls to generate masked data</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Original Data</h3>
                    {originalData.length > 0 ? (
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
                                    <TableCell key={key} className="max-w-[100px] truncate">
                                      {value}
                                    </TableCell>
                                  ))
                                }
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] border rounded-md bg-muted/10">
                        <p className="text-muted-foreground">No data uploaded</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Masked Data</h3>
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
                                    <TableCell key={key} className="max-w-[100px] truncate">
                                      {value}
                                    </TableCell>
                                  ))
                                }
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] border rounded-md bg-muted/10">
                        <p className="text-muted-foreground">No masked data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="bg-background min-h-screen pb-12">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <ApiKeyRequirement>
            <PiiHandlingContent />
          </ApiKeyRequirement>
        </div>
      </div>
    </div>
  );
};

export default PiiHandling;
