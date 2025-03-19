import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/FileUploader';
import UserGuideDataParsing from '@/components/ui/UserGuideDataParsing';
import { 
  FileText, 
  FileJson, 
  FileX, 
  Code2, 
  FileSpreadsheet, 
  Copy, 
  Download, 
  Upload, 
  FileUp, 
  ListFilter, 
  Magic, 
  RefreshCw
} from 'lucide-react';

// Define the structure of the parsed data
interface ParsedData {
  [key: string]: any;
}

// Define the structure for handling errors
interface ParsingError {
  message: string;
  line?: number;
  column?: number;
}

// Define the type for the parsing format
type ParsingFormat = 'json' | 'csv' | 'xml' | 'yaml' | 'text';

const DataParsing = () => {
  const [rawData, setRawData] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [parsingFormat, setParsingFormat] = useState<ParsingFormat>('json');
  const [targetFormat, setTargetFormat] = useState<ParsingFormat>('json');
  const [parsingError, setParsingError] = useState<ParsingError | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to handle parsing data based on the selected format
  const parseData = (data: string, format: ParsingFormat) => {
    setIsProcessing(true);
    setParsingError(null);
    try {
      switch (format) {
        case 'json':
          return JSON.parse(data);
        case 'csv':
          // Basic CSV parsing (can be improved with a proper CSV parser)
          const lines = data.split('\n');
          const headers = lines[0].split(',');
          const result: any[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const obj: any = {};
            for (let j = 0; j < headers.length; j++) {
              obj[headers[j].trim()] = values[j] ? values[j].trim() : '';
            }
            result.push(obj);
          }
          return result;
        case 'xml':
          // Basic XML parsing (can be improved with a proper XML parser)
          return { message: "XML parsing is not fully supported. Please use JSON or CSV." };
        case 'yaml':
          // Basic YAML parsing (can be improved with a proper YAML parser)
          return { message: "YAML parsing is not fully supported. Please use JSON or CSV." };
        case 'text':
          return { content: data };
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error: any) {
      console.error("Parsing error:", error);
      setParsingError({ message: error.message });
      toast({
        title: "Parsing Error",
        description: `Failed to parse data: ${error.message}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle processing the data
  const handleProcessData = async () => {
    if (!rawData) {
      toast({
        title: "Error",
        description: "Please input raw data to process.",
        variant: "destructive",
      });
      return;
    }

    const result = parseData(rawData, parsingFormat);
    if (result) {
      setParsedData(result);
      toast({
        title: "Data Parsed",
        description: "Data has been successfully parsed.",
      });
    }
  };

  // Function to handle file upload
  const handleFileUpload = (fileContent: string) => {
    setRawData(fileContent);
    toast({
      title: "File Uploaded",
      description: "File content has been loaded.",
    });
  };

  // Function to handle pasted data
  const handlePastedData = () => {
    if (!rawData) {
      toast({
        title: "Error",
        description: "No data to parse. Please paste data into the textarea.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Data Pasted",
      description: "Data has been pasted and is ready for parsing.",
    });
  };

  // Function to handle downloading the parsed data
  const handleDownload = () => {
    if (!parsedData) {
      toast({
        title: "Error",
        description: "No parsed data available to download.",
        variant: "destructive",
      });
      return;
    }

    const dataStr = JSON.stringify(parsedData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'parsedData.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({
      title: "Download Started",
      description: "Parsed data is being downloaded.",
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Parsing Service</h1>
        <p className="text-muted-foreground">
          Transform data between formats, apply schema detection, and convert unstructured data into structured formats.
        </p>
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar with upload options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileUp className="mr-2 h-5 w-5" />
                Input Data
              </CardTitle>
              <CardDescription>Upload or paste your data for parsing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1">File Upload</TabsTrigger>
                  <TabsTrigger value="paste" className="flex-1">Paste Data</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4 pt-4">
                  <FileUploader 
                    onFileSelect={handleFileUpload}
                    acceptedFileTypes={{
                      'application/json': ['.json'],
                      'text/csv': ['.csv'],
                      'text/plain': ['.txt', '.xml', '.yaml', '.yml'],
                      'application/xml': ['.xml'],
                    }}
                    maxSizeMB={10}
                  />
                </TabsContent>
                <TabsContent value="paste" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="raw-data">Paste raw data</Label>
                    <Textarea
                      id="raw-data"
                      placeholder="Paste JSON, CSV, XML, or other data here..."
                      className="min-h-[200px]"
                      value={rawData}
                      onChange={(e) => setRawData(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handlePastedData}
                      disabled={!rawData}
                    >
                      Parse Pasted Data
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ListFilter className="mr-2 h-5 w-5" />
                Parsing Options
              </CardTitle>
              <CardDescription>Configure how to parse your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source Format Selection */}
              <div className="space-y-2">
                <Label>Source Format</Label>
                <RadioGroup defaultValue="json" className="grid grid-cols-2 gap-2" onValueChange={(value) => setParsingFormat(value as ParsingFormat)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json">JSON</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv">CSV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="xml" id="xml" />
                    <Label htmlFor="xml">XML</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yaml" id="yaml" />
                    <Label htmlFor="yaml">YAML</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text">Text</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Target Format Selection */}
              <div className="space-y-2">
                <Label>Target Format</Label>
                <Select onValueChange={(value) => setTargetFormat(value as ParsingFormat)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Processing Actions */}
              <div className="pt-2 space-y-4">
                <Button
                  className="w-full"
                  onClick={handleProcessData}
                  disabled={!rawData || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Magic className="mr-2 h-4 w-4" />
                      Process Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* User Guide */}
          <UserGuideDataParsing />
        </div>

        {/* Main content area - right side */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code2 className="mr-2 h-5 w-5" />
                Parsed Data Output
              </CardTitle>
              <CardDescription>View the parsed data in JSON format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsingError ? (
                <div className="text-red-500">
                  Error: {parsingError.message}
                </div>
              ) : parsedData ? (
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                  <code>{JSON.stringify(parsedData, null, 2)}</code>
                </pre>
              ) : (
                <div className="text-muted-foreground">
                  No data parsed yet. Upload a file or paste data to see the result.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="secondary"
                onClick={handleDownload}
                disabled={!parsedData}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataParsing;
