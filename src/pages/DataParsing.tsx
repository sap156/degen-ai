import React from 'react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { parseCSV, parseJSON, SchemaFieldType, getFileType, extractTextFromFile } from '@/utils/fileUploadUtils';
import { processDataWithAI, AIProcessingOptions } from '@/utils/dataParsingUtils';
import { ProcessingType, stripMarkdownCodeBlocks } from '@/services/textProcessingService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { Download, FileUp, Filter, Sparkles, Layers, Tag, SmilePlus, FileSearch, FileText, Database, PenTool, List } from 'lucide-react';

const DataParsing = () => {
  const {
    apiKey
  } = useApiKey();
  const [data, setData] = useState<any[]>([]);
  const [schema, setSchema] = useState<Record<string, SchemaFieldType>>({});
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [fileMetadata, setFileMetadata] = useState<Record<string, any>>({});
  const [extractedText, setExtractedText] = useState<string>('');

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

      const {
        text,
        metadata
      } = await extractTextFromFile(file, apiKey);
      setFileMetadata(metadata);
      setExtractedText(text);

      if (detectedFileType === 'csv' || detectedFileType === 'json') {
        setFileContent(text);
        let parsedData;
        if (detectedFileType === 'csv') {
          parsedData = parseCSV(text);
        } else {
          parsedData = parseJSON(text);
        }

        if (!Array.isArray(parsedData)) {
          if (typeof parsedData === 'object' && parsedData !== null) {
            if (Array.isArray(parsedData.data)) {
              parsedData = parsedData.data;
            } else {
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

        setData(parsedData);

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
        /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) ||
        /^\d{1,2}-\d{1,2}-\d{4}/.test(value) ||
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
      
      setActiveTab('results');
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
      const formattedResults: Record<string, any> = {};
      Object.entries(aiProcessingResults).forEach(([processingType, result]) => {
        if (result.format === 'json' && result.structured) {
          formattedResults[processingType] = result.structured;
        } else {
          formattedResults[processingType] = {
            content: result.raw
          };
        }
      });

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

  return (
    <ApiKeyRequirement>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
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

        <Card>
          <CardHeader className="">
            <CardTitle>Data Parsing & AI Processing</CardTitle>
            <CardDescription>Upload a file, pick a processing type, view and download results</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="upload">
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <

