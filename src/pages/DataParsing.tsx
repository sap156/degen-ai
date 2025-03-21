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
import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';

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
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Parsing</h1>
          <p className="text-muted-foreground mt-2">
            Convert and transform data between different formats
          </p>
        </div>
        
        <AuthRequirement showUserGuide={<UserGuideDataParsing />} />
      </div>
    );
  }

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
      });
      return;
    }

    setIsParsing(true);

    try {
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
      
      <UserGuideDataParsing />
    </motion.div>
  );
};

export default DataParsing;
