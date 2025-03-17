import React, { useState, useEffect } from 'react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
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
  Play,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApiKey } from '@/contexts/ApiKeyContext';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON, readFileContent } from '@/utils/fileUploadUtils';
import MaskingFieldControl from '@/components/MaskingFieldControl';
import { PerFieldMaskingOptions } from '@/types/piiHandling';
import { Textarea } from '@/components/ui/textarea';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { 
  PiiData, 
  PiiDataMasked, 
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
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isMaskingData, setIsMaskingData] = useState(false);
  const [isAnalyzingData, setIsAnalyzingData] = useState(false);
  const [piiAnalysisResult, setPiiAnalysisResult] = useState<{identifiedPii: string[], suggestions: string} | null>(null);
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [dataReady, setDataReady] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  
  const [perFieldMaskingOptions, setPerFieldMaskingOptions] = useState<PerFieldMaskingOptions>({});
  
  const [globalMaskingPreferences, setGlobalMaskingPreferences] = useState({
    preserveFormat: true
  });

  const examplePrompts = [
    "Mask emails by keeping the domain but replacing the username with asterisks. Replace all digits in credit cards with X except the last 4. For names, keep first initial only.",
    "Use encryption for SSN (format xxx-xx-xxxx), truncate addresses to only show city, replace all credit card digits with '*' but keep the dashes.",
    "Replace all names with random synthetic names. Tokenize email addresses. Mask phone numbers as (XXX) XXX-1234 format, keeping last 4 digits only."
  ];

  useEffect(() => {
    generateData();
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
        description: "Please generate or upload data first",
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
      const masked = await maskPiiData(
        originalData, 
        perFieldMaskingOptions,
        {
          aiPrompt,
          preserveFormat: globalMaskingPreferences.preserveFormat
        },
        apiKey
      );
      setMaskedData(masked);
      toast({
        title: "Masking complete",
        description: `All ${masked.length} records have been masked successfully`,
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
    const filename = `pii-data-${exportFormat === 'json' ? 'json' : 'csv'}`;
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
      
      setMaskedData([]);
      
      const processedData = detectDataFields(parsedData);
      setOriginalData(processedData);
      
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
      
      setActiveTab('manual');
      setDataReady(true);
      
      if (apiKey) {
        analyzeDataWithAi(processedData);
      }
      
      toast({
        title: "File processed",
        description: `${processedData.length} records detected. Configure masking options and click Generate PII Masking`,
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

  return (
    <ApiKeyRequirement>
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
                        <p>Records: {originalData.length}</p>
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
                  Select fields to mask in the output
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </ApiKeyRequirement>
  );
};

export default PiiHandling;
