import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import FileUploader from '@/components/FileUploader';
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
      });
      
      setGeneratedData(additionalData);
      setActiveTab('results');
      toast.success(`Generated ${additionalData.length} additional data points`);
    } catch (error) {
      console.error('Error generating data:', error);
      toast.error('Error generating additional data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadGeneratedData = () => {
    if (!generatedData.length) {
      toast.error('No generated data to download');
      return;
    }
    
    try {
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
    }
  };
  
  const appendToOriginal = () => {
    if (!generatedData.length) {
      toast.error('No generated data to append');
      return;
    }
    
    const combined = [...data, ...generatedData];
    setData(combined);
    toast.success(`Appended ${generatedData.length} records to original data`);
    setGeneratedData([]);
    setActiveTab('analyze');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-2 mb-8">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Data Parsing
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Upload data files, analyze structure and generate additional data points
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Parsing & Generation</CardTitle>
            <CardDescription>
              Upload, analyze, and generate data from various file formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="upload">
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="analyze" disabled={!data.length}>
                  <Filter className="h-4 w-4 mr-2" />
                  Analyze
                </TabsTrigger>
                <TabsTrigger value="results" disabled={!generatedData.length}>
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Results
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Upload Data File</Label>
                    <FileUploader 
                      onFileUpload={handleFileUpload}
                      accept=".csv,.json"
                      maxSize={10}
                      title="Upload CSV or JSON Data"
                      description="Drag and drop your data file here or click to browse"
                    />
                  </div>
                  
                  {fileContent && (
                    <div>
                      <Label className="mb-2 block">File Preview</Label>
                      <Textarea
                        value={fileContent.slice(0, 2000) + (fileContent.length > 2000 ? '...' : '')}
                        readOnly
                        className="min-h-[200px] font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="analyze" className="space-y-6">
                {data.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="dateField">Date/Time Field</Label>
                          <select
                            id="dateField"
                            value={dateFieldName}
                            onChange={(e) => setDateFieldName(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">-- Select Date Field --</option>
                            {Object.keys(schema).map(field => (
                              <option key={field} value={field}>
                                {field} ({schema[field]})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {dateFieldName && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="startDate">Date Range Start</Label>
                              <Input
                                id="startDate"
                                type="date"
                                value={dateRangeStart}
                                onChange={(e) => setDateRangeStart(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="endDate">Date Range End</Label>
                              <Input
                                id="endDate"
                                type="date"
                                value={dateRangeEnd}
                                onChange={(e) => setDateRangeEnd(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <Label htmlFor="noiseLevel" className="mb-2 block">
                            Noise Level: {noiseLevel}
                          </Label>
                          <Slider
                            id="noiseLevel"
                            min={0}
                            max={1}
                            step={0.01}
                            value={[noiseLevel]}
                            onValueChange={(value) => setNoiseLevel(value[0])}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="dataPoints">Additional Data Points</Label>
                          <Input
                            id="dataPoints"
                            type="number"
                            min={1}
                            max={10000}
                            value={additionalDataPoints}
                            onChange={(e) => setAdditionalDataPoints(Number(e.target.value))}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleGenerateData} 
                          className="w-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Generate Additional Data
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="mb-2 block">Detected Schema</Label>
                        <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[300px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Field</TableHead>
                                <TableHead>Type</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(schema).map(([field, type]) => (
                                <TableRow key={field}>
                                  <TableCell className="font-medium">{field}</TableCell>
                                  <TableCell>{type}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Data Preview</Label>
                          <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[300px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {data.length > 0 && Object.keys(data[0]).map(key => (
                                    <TableHead key={key}>{key}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.slice(0, 5).map((row, rowIndex) => (
                                  <TableRow key={rowIndex}>
                                    {Object.values(row).map((value: any, valueIndex) => (
                                      <TableCell key={valueIndex}>
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {data.length > 5 && (
                              <p className="text-center text-sm text-muted-foreground mt-2">
                                Showing 5 of {data.length} rows
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="results" className="space-y-6">
                {generatedData.length > 0 && (
                  <>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-medium">Generated Data ({generatedData.length} records)</Label>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={downloadGeneratedData}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" onClick={appendToOriginal}>
                            <Database className="mr-2 h-4 w-4" />
                            Append to Original
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {generatedData.length > 0 && Object.keys(generatedData[0]).map(key => (
                                <TableHead key={key}>{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {generatedData.slice(0, 10).map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {Object.values(row).map((value: any, valueIndex) => (
                                  <TableCell key={valueIndex}>
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {generatedData.length > 10 && (
                          <p className="text-center text-sm text-muted-foreground mt-2">
                            Showing 10 of {generatedData.length} rows
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataParsing;

