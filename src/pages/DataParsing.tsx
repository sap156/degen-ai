import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { FileJson, FileText, FileX, Download, FileType2, Wand2 } from 'lucide-react';
import UserGuideDataParsing from '@/components/ui/UserGuideDataParsing';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON, formatData } from '@/utils/dataParsing';

interface ParsingOptions {
  csv: {
    delimiter: string;
    hasHeader: boolean;
    quoteChar: string;
  };
  json: {
    path: string;
  };
  text: {
    pattern: string;
  };
}

const DataParsing = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'json' | 'text' | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [outputFormat, setOutputFormat] = useState<'csv' | 'json' | 'text'>('json');
  const [parsingOptions, setParsingOptions] = useState<ParsingOptions>({
    csv: { delimiter: ',', hasHeader: true, quoteChar: '"' },
    json: { path: '' },
    text: { pattern: '' },
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (file: File) => {
    setFile(file);
    setFileType(file.name.split('.').pop()?.toLowerCase() as 'csv' | 'json' | 'text');
    setParsedData([]);
  };

  const handleParse = async () => {
    if (!file || !fileType) {
      toast({
        title: 'Error',
        description: 'Please upload a file and select its type.',
        variant: 'destructive',
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { parseCSV, parseJSON, readFileContent, SchemaFieldType } from '@/utils/fileUploadUtils';
import { generateAdditionalData } from '@/utils/dataParsingUtils';
import { 
  Download,
  FileUp,
  Clock,
  Share2,
  Filter,
  Plus,
  Database,
  BarChart2
} from 'lucide-react';

const DataParsing: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [schema, setSchema] = useState<Record<string, SchemaFieldType>>({});
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'json' | ''>('');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [dateFieldName, setDateFieldName] = useState<string>('');
  const [noiseLevel, setNoiseLevel] = useState<number>(0.1);
  const [additionalDataPoints, setAdditionalDataPoints] = useState<number>(100);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('upload');

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setFileName(file.name);
      
      if (file.name.endsWith('.csv')) {
        setFileType('csv');
      } else if (file.name.endsWith('.json')) {
        setFileType('json');
      } else {
        toast.error('Unsupported file type. Please upload CSV or JSON files');
        setIsLoading(false);
        return;
      }

      const content = await readFileContent(file);
      setFileContent(content);
      
      let parsedData;
      if (fileType === 'csv' || file.name.endsWith('.csv')) {
        parsedData = parseCSV(content);
      } else {
        parsedData = parseJSON(content);
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
        
        const possibleDateFields = Object.keys(detectedSchema).filter(
          key => detectedSchema[key] === 'date' || key.toLowerCase().includes('date') || key.toLowerCase().includes('time')
        );
        
        if (possibleDateFields.length > 0) {
          setDateFieldName(possibleDateFields[0]);
        }
      }
      
      setData(parsedData);
      setActiveTab('analyze');
      toast.success(`Successfully parsed ${parsedData.length} data points from ${file.name}`);
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
        if (/^\d{4}-\d{2}-\d{2}/.test(value) || // ISO date format
            /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || // MM/DD/YYYY
            /^\d{1,2}-\d{1,2}-\d{4}/.test(value) || // MM-DD-YYYY
            !isNaN(Date.parse(value))) {
          type = 'date';
        }
        else if (key.toLowerCase().includes('time') || 
                key.toLowerCase().includes('date') ||
                key.toLowerCase() === 'timestamp') {
          type = 'date';
        }
      } else if (type === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'float';
      }
      
      schema[key] = type;
    });
    
    return schema;
  };

  const isTimeSeries = (): boolean => {
    return !!dateFieldName && data.length > 0 && 
           (schema[dateFieldName] === 'date' || 
            dateFieldName.toLowerCase().includes('time') || 
            dateFieldName.toLowerCase().includes('date'));
  };
  
  const handleGenerateData = () => {
    try {
      setIsLoading(true);
      
      if (!data.length) {
        toast.error('No data available to generate from');
        setIsLoading(false);
        return;
      }
      
      const additionalData = generateAdditionalData({
        sourceData: data,
        schema,
        count: additionalDataPoints,
        noiseLevel,
        dateField: dateFieldName,
        startDate: dateRangeStart ? new Date(dateRangeStart) : undefined,
        endDate: dateRangeEnd ? new Date(dateRangeEnd) : undefined,
        isTimeSeries: isTimeSeries()
>>>>>>> a951b28 (Fix: Resolve TypeScript type errors)
      });
      return;
    }

    setIsParsing(true);

    try {
<<<<<<< HEAD
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;

        let data;
        switch (fileType) {
          case 'csv':
            data = parseCSV(content, parsingOptions.csv.hasHeader);
            break;
          case 'json':
            data = parseJSON(content);
            break;
          case 'text':
            // Implement text parsing logic here based on pattern
            data = [{ text: content }];
            break;
          default:
            throw new Error('Unsupported file type');
        }

        setParsedData(data);
        toast({
          title: 'Success',
          description: 'File parsed successfully!',
        });
      };
      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read the file.',
          variant: 'destructive',
        });
        setIsParsing(false);
      };

      reader.onloadend = () => setIsParsing(false);
      reader.readAsText(file);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to parse the file.',
        variant: 'destructive',
      });
      setIsParsing(false);
=======
      let content = '';
      const filename = `generated_${fileName || 'data'}`;
      
      if (fileType === 'csv') {
        const headers = Object.keys(generatedData[0]).join(',');
        const rows = generatedData.map(item => 
          Object.values(item).map(value => 
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          ).join(',')
        );
        content = [headers, ...rows].join('\n');
        
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        content = JSON.stringify(generatedData, null, 2);
        
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      toast.success('Downloaded generated data');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Error downloading data');
>>>>>>> a951b28 (Fix: Resolve TypeScript type errors)
    }
  };

  const handleConvert = () => {
    if (!parsedData.length) {
      toast({
        title: 'Error',
        description: 'No data to convert. Please parse a file first.',
        variant: 'destructive',
      });
      return;
    }

    setIsConverting(true);

    try {
      const formattedData = formatData(parsedData, outputFormat);
      const blob = new Blob([formattedData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted.${outputFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `File converted to ${outputFormat.toUpperCase()} and downloaded!`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert the data.',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="container mx-auto py-6 space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Parsing</h1>
        <p className="text-muted-foreground mt-2">
          Convert and transform data between different formats
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Select a file to parse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploader
            onFileUpload={handleFileChange}
            accept=".csv, .json, .txt"
            title="Upload File"
            description="Upload a CSV, JSON, or Text file to parse"
          />
          {file && (
            <div className="text-sm text-muted-foreground mt-2">
              <p className="font-medium">File: {file.name}</p>
              <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </CardContent>
      </Card>

      {file && (
        <Card>
          <CardHeader>
            <CardTitle>Parsing Options</CardTitle>
            <CardDescription>Configure parsing settings for your file type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileType">File Type</Label>
              <Select value={fileType || ''} onValueChange={(value) => setFileType(value as 'csv' | 'json' | 'text')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fileType === 'csv' && (
              <div className="space-y-4 border rounded-md p-4">
                <h4 className="text-sm font-medium">CSV Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delimiter">Delimiter</Label>
                    <Input
                      id="delimiter"
                      type="text"
                      value={parsingOptions.csv.delimiter}
                      onChange={(e) =>
                        setParsingOptions({
                          ...parsingOptions,
                          csv: { ...parsingOptions.csv, delimiter: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quoteChar">Quote Character</Label>
                    <Input
                      id="quoteChar"
                      type="text"
                      value={parsingOptions.csv.quoteChar}
                      onChange={(e) =>
                        setParsingOptions({
                          ...parsingOptions,
                          csv: { ...parsingOptions.csv, quoteChar: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasHeader"
                    checked={parsingOptions.csv.hasHeader}
                    onCheckedChange={(checked) =>
                      setParsingOptions({
                        ...parsingOptions,
                        csv: { ...parsingOptions.csv, hasHeader: checked },
                      })
                    }
                  />
                  <Label htmlFor="hasHeader">Has Header Row</Label>
                </div>
              </div>
            )}

            {fileType === 'json' && (
              <div className="space-y-4 border rounded-md p-4">
                <h4 className="text-sm font-medium">JSON Options</h4>
                <div className="space-y-2">
                  <Label htmlFor="jsonPath">JSON Path (optional)</Label>
                  <Input
                    id="jsonPath"
                    type="text"
                    placeholder="e.g., $.items[0].name"
                    value={parsingOptions.json.path}
                    onChange={(e) =>
                      setParsingOptions({
                        ...parsingOptions,
                        json: { path: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {fileType === 'text' && (
              <div className="space-y-4 border rounded-md p-4">
                <h4 className="text-sm font-medium">Text Options</h4>
                <div className="space-y-2">
                  <Label htmlFor="textPattern">Pattern (Regex or Delimiter)</Label>
                  <Input
                    id="textPattern"
                    type="text"
                    placeholder="Enter regex or delimiter"
                    value={parsingOptions.text.pattern}
                    onChange={(e) =>
                      setParsingOptions({
                        ...parsingOptions,
                        text: { pattern: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleParse} disabled={isParsing || !fileType}>
              {isParsing ? (
                <>
                  <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Parse File
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Data</CardTitle>
            <CardDescription>Preview and convert your parsed data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <pre className="text-xs">
                {JSON.stringify(parsedData.slice(0, 5), null, 2)}
                {parsedData.length > 5 && `\n...and ${parsedData.length - 5} more records`}
              </pre>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputFormat">Output Format</Label>
              <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as 'csv' | 'json' | 'text')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select output format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleConvert} disabled={isConverting}>
              {isConverting ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Convert & Download
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Add the user guide at the bottom */}
      <UserGuideDataParsing />
    </motion.div>
  );
};

export default DataParsing;
