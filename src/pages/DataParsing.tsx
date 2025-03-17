import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import FileUploader from '@/components/FileUploader';
import ProcessingTypesGuide from '@/components/ProcessingTypesGuide';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { parseCSV, parseJSON, readFileContent, SchemaFieldType, extractTextFromFile, getFileType, SupportedFileType } from '@/utils/fileUploadUtils';
import { processDataWithAI, AIProcessingOptions } from '@/utils/dataParsingUtils';
import { ProcessingType } from '@/services/textProcessingService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Download, FileUp, Filter, Sparkles, Layers, Tag, SmilePlus, FileSearch, FileText, Database, PenTool } from 'lucide-react';
const DataParsing: React.FC = () => {
  const {
    apiKey
  } = useApiKey();
  const [data, setData] = useState<any[]>([]);
  const [schema, setSchema] = useState<Record<string, SchemaFieldType>>({});
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<SupportedFileType | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [fileMetadata, setFileMetadata] = useState<Record<string, any>>({});
  const [extractedText, setExtractedText] = useState<string>('');

  // AI processing options
  const [selectedProcessingTypes, setSelectedProcessingTypes] = useState<ProcessingType[]>([]);
  const [processingDetailLevel, setProcessingDetailLevel] = useState<'brief' | 'standard' | 'detailed'>('standard');
  const [processingOutputFormat, setProcessingOutputFormat] = useState<'json' | 'text'>('json');
  const [userContext, setUserContext] = useState<string>('');
  const [aiProcessingResults, setAiProcessingResults] = useState<Record<string, any>>({});
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setFileName(file.name);
      setFileContent('');
      setExtractedText('');
      setFileMetadata({});
      setData([]);
      setSchema({});
      setAiProcessingResults({});
      const detectedFileType = getFileType(file);
      setFileType(detectedFileType);

      // Extract text based on file type
      const {
        text,
        metadata
      } = await extractTextFromFile(file, apiKey);
      setFileMetadata(metadata);
      setExtractedText(text);

      // For CSV and JSON, also parse the structured data
      if (detectedFileType === 'csv' || detectedFileType === 'json') {
        setFileContent(text);
        let parsedData;
        if (detectedFileType === 'csv') {
          parsedData = parseCSV(text);
        } else {
          parsedData = parseJSON(text);
        }

        // Handle different parsed data structures
        if (!Array.isArray(parsedData)) {
          if (typeof parsedData === 'object' && parsedData !== null) {
            if (Array.isArray(parsedData.data)) {
              parsedData = parsedData.data;
            } else {
              // Convert object to array if it's not already an array
              parsedData = [parsedData];
            }
          } else {
            toast.error('Unable to parse data from file. Expected array of objects.');
            setIsLoading(false);
            return;
          }
        }
        if (parsedData.length > 0) {
          const detectedSchema = detectSchema(parsedData);
          setSchema(detectedSchema);
        }

        // Limit the display data but keep all for processing
        setData(parsedData);

        // Update context with data size info
        const dataSize = parsedData.length;
        setUserContext(prev => `${prev ? prev + '\n' : ''}This dataset contains ${dataSize} records.`);
      }
      setActiveTab('analyze');
      toast.success(`Successfully processed ${file.name}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error processing file. Please check file format.');
    } finally {
      setIsLoading(false);
    }
  };
  const detectSchema = (data: any[]): Record<string, SchemaFieldType> => {
    if (!data.length) return {};
    const schema: Record<string, SchemaFieldType> = {};
    const sampleItem = data[0];
    Object.keys(sampleItem).forEach(key => {
      const value = sampleItem[key];
      let type = typeof value as SchemaFieldType;
      if (type === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(value) ||
        // ISO date format
        /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) ||
        // MM/DD/YYYY
        /^\d{1,2}-\d{1,2}-\d{4}/.test(value) ||
        // MM-DD-YYYY
        !isNaN(Date.parse(value))) {
          type = 'date';
        } else if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date') || key.toLowerCase() === 'timestamp') {
          type = 'date';
        }
      } else if (type === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'float';
      }
      schema[key] = type;
    });
    return schema;
  };
  const handleProcessingTypeToggle = (type: ProcessingType) => {
    setSelectedProcessingTypes(current => current.includes(type) ? current.filter(t => t !== type) : [...current, type]);
  };
  const handleProcessWithAI = async () => {
    if (!apiKey) {
      toast.error('API key is required for AI processing');
      return;
    }
    if (!extractedText) {
      toast.error('No text content available for processing');
      return;
    }
    if (selectedProcessingTypes.length === 0) {
      toast.error('Please select at least one processing type');
      return;
    }
    setIsLoading(true);
    try {
      // Add dataset information to context
      let contextInfo = userContext || '';
      if (data.length > 0) {
        contextInfo += `\nThis dataset contains ${data.length} records.`;
      }
      const options: AIProcessingOptions = {
        apiKey,
        processingTypes: selectedProcessingTypes,
        detailLevel: processingDetailLevel,
        outputFormat: processingOutputFormat,
        userContext: contextInfo
      };
      console.log(`Processing ${extractedText.length} characters of text`);
      const results = await processDataWithAI(extractedText, options);
      setAiProcessingResults(results);
      setActiveTab('aiResults');
      toast.success('AI processing completed successfully');
    } catch (error) {
      console.error('Error in AI processing:', error);
      toast.error('Failed to process with AI');
    } finally {
      setIsLoading(false);
    }
  };
  const downloadProcessedResults = () => {
    if (Object.keys(aiProcessingResults).length === 0) {
      toast.error('No AI processing results available');
      return;
    }
    try {
      // Format the JSON results properly
      const formattedResults: Record<string, any> = {};
      Object.entries(aiProcessingResults).forEach(([processingType, result]) => {
        if (result.format === 'json' && result.structured) {
          formattedResults[processingType] = result.structured;
        } else {
          formattedResults[processingType] = {
            raw: result.raw
          };
        }
      });

      // Create properly formatted JSON
      const content = JSON.stringify(formattedResults, null, 2);
      const filename = `ai_processed_${fileName.replace(/\.[^/.]+$/, "") || 'data'}`;
      const blob = new Blob([content], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded AI processing results');
    } catch (error) {
      console.error('Error downloading results:', error);
      toast.error('Error downloading results');
    }
  };
  const renderProcessingTypeIcon = (type: ProcessingType) => {
    switch (type) {
      case 'structuring':
        return <Layers className="h-4 w-4" />;
      case 'cleaning':
        return <PenTool className="h-4 w-4" />;
      case 'ner':
        return <FileSearch className="h-4 w-4" />;
      case 'topics':
        return <Database className="h-4 w-4" />;
      case 'summarization':
        return <FileText className="h-4 w-4" />;
      case 'sentiment':
        return <SmilePlus className="h-4 w-4" />;
      case 'tagging':
        return <Tag className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };
  const renderProcessingTypeLabel = (type: ProcessingType) => {
    switch (type) {
      case 'structuring':
        return 'Auto-Structuring';
      case 'cleaning':
        return 'Data Cleaning';
      case 'ner':
        return 'Named Entity Recognition';
      case 'topics':
        return 'Topic Extraction';
      case 'summarization':
        return 'Summarization';
      case 'sentiment':
        return 'Sentiment Analysis';
      case 'tagging':
        return 'Auto-Tagging';
      default:
        return type;
    }
  };
  return <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-2 mb-8">
        <motion.h1 className="text-3xl font-bold tracking-tight" initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }}>
          Data Parsing
        </motion.h1>
        <motion.p className="text-muted-foreground" initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }}>
          Upload data files, analyze structure and process with AI
        </motion.p>
      </div>

      <ApiKeyRequirement>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="">
              <CardTitle>Data Parsing & AI Processing</CardTitle>
              <CardDescription>Upload a file, pick a processing type, view and download results</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="upload">
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="analyze" disabled={!extractedText}>
                    <Filter className="h-4 w-4 mr-2" />
                    Analyze
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Upload Data File</Label>
                      <FileUploader onFileUpload={handleFileUpload} accept=".csv,.json,.txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" maxSize={10} title="Upload Data File" description="Drag and drop your data file here or click to browse" />
                    </div>
                    
                    {fileContent && <div>
                        <Label className="mb-2 block">File Preview</Label>
                        <Textarea value={fileContent.slice(0, 2000) + (fileContent.length > 2000 ? '...' : '')} readOnly className="min-h-[200px] font-mono text-xs" />
                        {fileContent.length > 2000 && <p className="text-xs text-muted-foreground mt-1">
                            Showing first 2,000 characters of {fileContent.length.toLocaleString()} total
                          </p>}
                      </div>}
                  </div>

                  <ProcessingTypesGuide />
                </TabsContent>
                
                <TabsContent value="analyze" className="space-y-6">
                  {extractedText && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-lg font-medium">File Information</Label>
                          <div className="bg-muted/30 p-4 rounded-md mt-2">
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(fileMetadata).map(([key, value]) => <div key={key} className="py-1">
                                  <span className="font-medium">{key}: </span>
                                  <span className="text-muted-foreground">{String(value)}</span>
                                </div>)}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-lg font-medium">AI Processing Options</Label>
                          <div className="bg-muted/30 p-4 rounded-md mt-2 space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Processing Types</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(['structuring', 'cleaning', 'ner', 'topics', 'summarization', 'sentiment', 'tagging'] as ProcessingType[]).map(type => <div className="flex items-center space-x-2" key={type}>
                                    <Checkbox id={`process-${type}`} checked={selectedProcessingTypes.includes(type)} onCheckedChange={() => handleProcessingTypeToggle(type)} />
                                    <label htmlFor={`process-${type}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center">
                                      {renderProcessingTypeIcon(type)}
                                      <span className="ml-1">{renderProcessingTypeLabel(type)}</span>
                                    </label>
                                  </div>)}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Detail Level</p>
                              <div className="flex space-x-2">
                                {(['brief', 'standard', 'detailed'] as const).map(level => <Button key={level} variant={processingDetailLevel === level ? "default" : "outline"} size="sm" onClick={() => setProcessingDetailLevel(level)} className="text-xs">
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                  </Button>)}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Output Format</p>
                              <div className="flex space-x-2">
                                {(['json', 'text'] as const).map(format => <Button key={format} variant={processingOutputFormat === format ? "default" : "outline"} size="sm" onClick={() => setProcessingOutputFormat(format)} className="text-xs">
                                    {format.toUpperCase()}
                                  </Button>)}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="userContext" className="text-sm font-medium">Additional Context (Optional)</Label>
                              <Textarea id="userContext" placeholder="Add any specific instructions or context for the AI to consider..." value={userContext} onChange={e => setUserContext(e.target.value)} className="h-20" />
                            </div>
                            
                            <Button onClick={handleProcessWithAI} className="w-full" disabled={isLoading || selectedProcessingTypes.length === 0}>
                              {isLoading ? <>
                                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                                  Processing...
                                </> : <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Process with AI
                                </>}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-lg font-medium">Extracted Content</Label>
                          <Textarea value={extractedText.slice(0, 5000) + (extractedText.length > 5000 ? '...' : '')} readOnly className="min-h-[300px] mt-2 font-mono text-xs" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {extractedText.length > 5000 && `Showing first 5,000 characters of ${extractedText.length.toLocaleString()} total`}
                          </p>
                        </div>
                        
                        {data.length > 0 && <>
                            <div>
                              <Label className="text-lg font-medium">Detected Schema</Label>
                              <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[200px] mt-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Field</TableHead>
                                      <TableHead>Type</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {Object.entries(schema).map(([field, type]) => <TableRow key={field}>
                                        <TableCell className="font-medium">{field}</TableCell>
                                        <TableCell>{type}</TableCell>
                                      </TableRow>)}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-lg font-medium">
                                Data Preview 
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                  ({data.length.toLocaleString()} records total)
                                </span>
                              </Label>
                              <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[300px] mt-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {data.length > 0 && Object.keys(data[0]).map(key => <TableHead key={key}>{key}</TableHead>)}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {data.slice(0, 5).map((row, rowIndex) => <TableRow key={rowIndex}>
                                        {Object.values(row).map((value: any, valueIndex) => <TableCell key={valueIndex}>
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </TableCell>)}
                                      </TableRow>)}
                                  </TableBody>
                                </Table>
                                {data.length > 5 && <p className="text-center text-sm text-muted-foreground mt-2">
                                    Showing 5 of {data.length.toLocaleString()} rows
                                  </p>}
                              </div>
                            </div>
                          </>}
                      </div>
                    </div>}
                </TabsContent>
                
                {Object.keys(aiProcessingResults).length > 0 && <Card className="mt-8 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span>AI Processing Results</span>
                        <Button variant="outline" size="sm" onClick={downloadProcessedResults}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Results
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6">
                        {Object.entries(aiProcessingResults).map(([processingType, result]) => <Card key={processingType} className="border-muted">
                            <CardHeader className="py-3">
                              <CardTitle className="text-md flex items-center">
                                {renderProcessingTypeIcon(processingType as ProcessingType)}
                                <span className="ml-2">{renderProcessingTypeLabel(processingType as ProcessingType)}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {result.format === 'json' ? <pre className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[400px] text-xs font-mono">
                                  {JSON.stringify(result.structured, null, 2)}
                                </pre> : <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[400px]">
                                  <p className="whitespace-pre-wrap font-mono text-xs">{result.raw}</p>
                                </div>}
                            </CardContent>
                          </Card>)}
                      </div>
                    </CardContent>
                  </Card>}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </ApiKeyRequirement>
    </div>;
};
export default DataParsing;