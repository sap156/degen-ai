import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  DownloadCloud, 
  Copy, 
  Save, 
  BarChart, 
  RefreshCw,
  Sparkles,
  Upload
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useApiKey } from '@/contexts/ApiKeyContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import FileUploader from '@/components/FileUploader';
import SchemaEditor from '@/components/SchemaEditor';
import DataGenerationOptions from '@/components/DataGenerationOptions';
import DateRangeInfo from '@/components/DateRangeInfo';
import UserGuideTimeSeriesGenerator from '@/components/ui/UserGuideTimeSeriesGenerator';
import { parseCSV, parseJSON, readFileContent, detectDataType, generateSchema, SchemaFieldType } from '@/utils/fileUploadUtils';
import { detectTimeSeriesFields, analyzeDataset } from '@/utils/schemaDetectionUtils';

import {
  generateTimeSeriesData,
  generateTimeSeriesWithAI,
  addAINoiseToTimeSeries,
  formatAsCSV,
  formatAsJSON,
  downloadData,
  saveToMockDatabase,
  TimeSeriesDataPoint,
  TimeSeriesOptions,
  AINoiseOptions
} from '@/services/timeSeriesService';

type FormValues = TimeSeriesOptions & {
  outputFormat: 'json' | 'csv';
  datasetName: string;
  additionalFieldCount: number;
  aiPrompt?: string;
  useAi?: boolean;
  //excludeDefaultValue?: boolean;
  generationMode: 'new' | 'append';
};

const TimeSeries = () => {
  const { apiKey } = useApiKey();
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [formattedData, setFormattedData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [aiNoisePrompt, setAiNoisePrompt] = useState<string>('');
  const [isApplyingAiNoise, setIsApplyingAiNoise] = useState<boolean>(false);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [detectedSchema, setDetectedSchema] = useState<Record<string, SchemaFieldType> | null>(null);
  const [uploadedTimestampField, setUploadedTimestampField] = useState<string | null>(null);
  const [datasetAnalysis, setDatasetAnalysis] = useState<any>(null);
  
  const { handleSubmit, control, watch, setValue, register, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
      interval: 'daily',
      trend: 'random',
      noiseLevel: 0.3,
      dataPoints: 100,
      outputFormat: 'json',
      datasetName: 'time_series_' + format(new Date(), 'yyyyMMdd'),
      additionalFieldCount: 0,
      additionalFields: [],
      categories: ['category-A', 'category-B', 'category-C', 'category-D'],
      seed: Math.floor(Math.random() * 10000),
      aiPrompt: '',
      useAi: false,
      //excludeDefaultValue: false,
      generationMode: 'new'
    }
  });
  
  const outputFormat = watch('outputFormat');
  const additionalFields = watch('additionalFields') || [];
  const useAi = watch('useAi');
  //const excludeDefaultValue = watch('excludeDefaultValue');
  const generationMode = watch('generationMode');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const interval = watch('interval');
  const dataPoints = watch('dataPoints');
  
  const setAdditionalFields = (fields: any[]) => {
    setValue('additionalFields', fields);
    setValue('additionalFieldCount', fields.length);
  };
  
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setShowProgress(true);
    setProgressPercentage(0);
    
    try {
      let generatedData: TimeSeriesDataPoint[];
      
      if (data.useAi && data.aiPrompt) {
        generatedData = await generateTimeSeriesWithAI({
          apiKey,
          prompt: data.aiPrompt,
          startDate: data.startDate,
          endDate: data.endDate,
          interval: data.interval,
          dataPoints: data.dataPoints,
          additionalFields: data.additionalFields,
          existingData: data.generationMode === 'append' && timeSeriesData.length > 0 
            ? timeSeriesData 
            : undefined,
          //excludeDefaultValue: data.excludeDefaultValue,
          onProgressUpdate: setProgressPercentage
        });
      } else {
        generatedData = generateTimeSeriesData({
          ...data,
          //excludeDefaultValue: data.excludeDefaultValue,
          existingData: data.generationMode === 'append' && timeSeriesData.length > 0 
            ? timeSeriesData 
            : undefined
        });
        
        setTimeout(() => setProgressPercentage(100), 700);
      }
      
      if (data.generationMode === 'append' && timeSeriesData.length > 0) {
        const uniqueData = new Map<string, TimeSeriesDataPoint>();
        
        timeSeriesData.forEach(item => {
          uniqueData.set(item.timestamp, item);
        });
        
        generatedData.forEach(item => {
          uniqueData.set(item.timestamp, item);
        });
        
        generatedData = Array.from(uniqueData.values()).sort((a, b) => {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
      }
      
      setTimeSeriesData(generatedData);
      
      const formatted = data.outputFormat === 'csv'
        ? formatAsCSV(generatedData)
        : formatAsJSON(generatedData);
        
      setFormattedData(formatted);
      
      if (generatedData.length > 0) {
        updateDatasetAnalysis(generatedData);
      }
      
      toast.success(`Generated ${generatedData.length} time series data points`);
    } catch (error) {
      console.error('Error generating time series data:', error);
      toast.error('Failed to generate time series data');
    } finally {
      setLoading(false);
      setTimeout(() => setShowProgress(false), 1000);
    }
  };
  
  useEffect(() => {
    if (detectedSchema && Object.keys(detectedSchema).length > 0) {
      const schemaFields = Object.entries(detectedSchema)
        .filter(([key, type]) => key !== 'timestamp')
        .map(([key, type]) => {
          let fieldType: 'number' | 'boolean' | 'category' = 'number';
          
          if (type === 'boolean') {
            fieldType = 'boolean';
          } else if (type === 'string' || type === 'address' || type === 'name') {
            fieldType = 'category';
          }
          
          return { name: key, type: fieldType };
        });
      
      setAdditionalFields(schemaFields);
    }
  }, [detectedSchema]);
    
  
  const handleSave = async () => {
    if (!timeSeriesData.length) {
      toast.warning('No data to save. Please generate data first.');
      return;
    }
    
    setSaving(true);
    
    try {
      const datasetName = watch('datasetName');
      await saveToMockDatabase(timeSeriesData, datasetName);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDownload = () => {
    if (!formattedData) {
      toast.warning('No data to download. Please generate data first.');
      return;
    }
    
    const format = watch('outputFormat');
    const fileName = `${watch('datasetName')}.${format}`;
    downloadData(formattedData, fileName, format);
  };
  
  const handleCopyToClipboard = () => {
    if (!formattedData) {
      toast.warning('No data to copy. Please generate data first.');
      return;
    }
    
    navigator.clipboard.writeText(formattedData)
      .then(() => toast.success('Data copied to clipboard'))
      .catch(() => toast.error('Failed to copy data'));
  };
  
  const handleApplyAiNoise = async () => {
    if (!timeSeriesData.length) {
      toast.warning('No data to modify. Please generate or upload data first.');
      return;
    }
    
    if (!aiNoisePrompt) {
      toast.warning('Please provide instructions for AI noise generation.');
      return;
    }
    
    setIsApplyingAiNoise(true);
    setShowProgress(true);
    setProgressPercentage(0);
    
    try {
      const noiseLevel = watch('noiseLevel');
      const options: AINoiseOptions = {
        apiKey,
        data: timeSeriesData,
        prompt: aiNoisePrompt,
        noiseLevel,
        onProgressUpdate: setProgressPercentage
      };
      
      const modifiedData = await addAINoiseToTimeSeries(options);
      
      setTimeSeriesData(modifiedData);
      
      const formatted = outputFormat === 'csv'
        ? formatAsCSV(modifiedData)
        : formatAsJSON(modifiedData);
        
      setFormattedData(formatted);
      
      toast.success('Applied AI-generated noise to time series data');
    } catch (error) {
      console.error('Error applying AI noise:', error);
      toast.error('Failed to apply AI noise');
    } finally {
      setIsApplyingAiNoise(false);
      setTimeout(() => setShowProgress(false), 1000);
    }
  };
  
  const updateDatasetAnalysis = (data: TimeSeriesDataPoint[]) => {
    if (!data.length) return;
    
    try {
      const timestamps = data.map(item => new Date(item.timestamp));
      
      const minDate = new Date(Math.min(...timestamps.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...timestamps.map(d => d.getTime())));
      
      const timeInterval = detectTimeInterval(timestamps);
      
      const analysis = {
        dataPoints: data.length,
        dateRange: {
          start: minDate,
          end: maxDate,
          interval: timeInterval
        }
      };
      
      setDatasetAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing dataset:', error);
    }
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
      
      const timeSeriesData = processUploadedTimeSeriesData(parsedData);
      setTimeSeriesData(timeSeriesData);
      
      const formatted = outputFormat === 'csv'
        ? formatAsCSV(timeSeriesData)
        : formatAsJSON(timeSeriesData);
      
      setFormattedData(formatted);
      
      const schema = generateSchema(timeSeriesData);
      setDetectedSchema(schema);
      
      updateDatasetAnalysis(timeSeriesData);
      
      updateFormWithDetectedSchema(timeSeriesData, schema);
      
      setActiveTab('generate');
      
      toast.success(`Processed ${timeSeriesData.length} time series data points and detected schema`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error((error as Error).message || 'Failed to process file');
    } finally {
      setIsProcessingFile(false);
    }
  };
  
  const updateFormWithDetectedSchema = (data: TimeSeriesDataPoint[], schema: Record<string, SchemaFieldType>) => {
    if (!data.length) return;
    
    try {
      const timestamps = data.map(item => new Date(item.timestamp));
      const minDate = new Date(Math.min(...timestamps.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...timestamps.map(d => d.getTime())));
      
      setValue('startDate', minDate);
      setValue('endDate', maxDate);
      
      const detectedInterval = detectTimeInterval(timestamps);
      if (detectedInterval) {
        setValue('interval', detectedInterval);
      }
      
      if (uploadedFile) {
        const fileName = uploadedFile.name.split('.')[0];
        setValue('datasetName', fileName);
      }
      
      const schemaFields = Object.entries(schema)
        .filter(([key, type]) => key !== 'timestamp')
        .map(([key, type]) => {
          let fieldType: 'number' | 'boolean' | 'category' = 'number';
          
          if (type === 'boolean') {
            fieldType = 'boolean';
          } else if (type === 'string' || type === 'address' || type === 'name') {
            fieldType = 'category';
          }
          
          return { name: key, type: fieldType };
        });
      
      setAdditionalFields(schemaFields);
      
      setValue('dataPoints', data.length);
      
      setValue('generationMode', 'append');
    } catch (error) {
      console.error('Error updating form with detected schema:', error);
    }
  };
  
  const detectTimeInterval = (timestamps: Date[]): 'hourly' | 'daily' | 'weekly' | 'monthly' | undefined => {
    if (timestamps.length < 2) return undefined;
    
    timestamps.sort((a, b) => a.getTime() - b.getTime());
    
    let totalDiff = 0;
    for (let i = 1; i < Math.min(10, timestamps.length); i++) {
      totalDiff += timestamps[i].getTime() - timestamps[i-1].getTime();
    }
    
    const avgDiffMs = totalDiff / Math.min(9, timestamps.length - 1);
    
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    
    if (avgDiffMs < 2 * hourMs) return 'hourly';
    if (avgDiffMs < 2 * dayMs) return 'daily';
    if (avgDiffMs < 2 * weekMs) return 'weekly';
    return 'monthly';
  };
  
  const processUploadedTimeSeriesData = (data: any[]): TimeSeriesDataPoint[] => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data format. Expected an array of records.');
    }
    
    const timestampField = detectTimestampField(data);
    if (!timestampField) {
      throw new Error('Could not identify timestamp field in the data');
    }
    
    const valueFields = detectValueFields(data, timestampField);
    if (valueFields.length === 0) {
      throw new Error('Could not identify any numeric value fields in the data');
    }
    
    const processedData: TimeSeriesDataPoint[] = data.map(item => {
      const timestamp = parseTimestamp(item[timestampField]);
      const point: TimeSeriesDataPoint = { 
        timestamp,
        value: 0
      };
      
      if (valueFields.length > 0) {
        point.value = parseFloat(item[valueFields[0]]);
      }
      
      valueFields.forEach(field => {
        const value = parseFloat(item[field]);
        if (!isNaN(value)) {
          point[field] = value;
        }
      });
      
      Object.keys(item).forEach(field => {
        if (field !== timestampField && !valueFields.includes(field)) {
          const value = item[field];
          if (typeof value === 'string' || typeof value === 'boolean') {
            point[field] = value;
          }
        }
      });
      
      return point;
    });
    
    processedData.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
    
    if (timestampField) {
      setUploadedTimestampField(timestampField);
    }
    
    return processedData;
  };
  
  const detectTimestampField = (data: any[]): string | null => {
    const firstItem = data[0];
    
    const possibleTimestampFields = [
      'timestamp', 'time', 'date', 'datetime', 'dateTime', 
      'time_stamp', 'time-stamp', 'date_time', 'date-time'
    ];
    
    for (const field of possibleTimestampFields) {
      if (field in firstItem) {
        try {
          const parsed = new Date(firstItem[field]);
          if (!isNaN(parsed.getTime())) {
            return field;
          }
        } catch (e) { /* Not a valid date */ }
      }
    }
    
    for (const field of Object.keys(firstItem)) {
      try {
        const value = firstItem[field];
        if (typeof value === 'string' || value instanceof Date) {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            return field;
          }
        }
      } catch (e) { /* Not a valid date */ }
    }
    
    return null;
  };
  
  const detectValueFields = (data: any[], timestampField: string): string[] => {
    const firstItem = data[0];
    const valueFields: string[] = [];
    
    for (const field of Object.keys(firstItem)) {
      if (field !== timestampField) {
        const value = firstItem[field];
        if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
          valueFields.push(field);
        }
      }
    }
    
    return valueFields;
  };
  
  const parseTimestamp = (value: any): string => {
    if (!value) return new Date().toISOString();
    
    try {
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      if (typeof value === 'number') {
        const date = value > 10000000000 
          ? new Date(value) 
          : new Date(value * 1000);
          
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      return new Date().toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };
  
  const additionalFieldNames = useMemo(() => {
    if (!timeSeriesData.length) return [];
    
    return Object.keys(timeSeriesData[0])
      .filter(key => {
        return (
          key !== 'timestamp' && 
          typeof timeSeriesData[0][key] === 'number'
        );
      });
  }, [timeSeriesData]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Time Series Generator</CardTitle>
              <CardDescription>
                Configure and generate time series data with various patterns
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="generate">Generate</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="generate">
                  <form id="time-series-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {detectedSchema && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md mb-4">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Using schema from uploaded file
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {uploadedFile?.name} · {Object.keys(detectedSchema).length} fields detected
                        </p>
                      </div>
                    )}
                    
                    {datasetAnalysis && (
                      <DateRangeInfo 
                        startDate={datasetAnalysis.dateRange.start}
                        endDate={datasetAnalysis.dateRange.end}
                        interval={datasetAnalysis.dateRange.interval}
                        dataPoints={datasetAnalysis.dataPoints}
                      />
                    )}
                    
                    <DataGenerationOptions 
                      generationMode={generationMode}
                      onGenerationModeChange={(mode) => setValue('generationMode', mode)}
                      hasExistingData={timeSeriesData.length > 0}
                    />
                    
                    <div className="space-y-2">
                      <Label htmlFor="datasetName">Dataset Name</Label>
                      <Input
                        id="datasetName"
                        placeholder="Enter dataset name"
                        {...register('datasetName', { required: 'Dataset name is required' })}
                      />
                      {errors.datasetName && (
                        <p className="text-sm text-destructive">{errors.datasetName.message}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="useAi" 
                        checked={useAi} 
                        onCheckedChange={(checked) => setValue('useAi', checked)} 
                      />
                      <Label htmlFor="useAi" className="font-medium">
                        Use AI Generation
                      </Label>
                    </div>
                    
                    {useAi && (
                      <ApiKeyRequirement>
                        <div className="space-y-2">
                          <Label htmlFor="aiPrompt">AI Generation Prompt</Label>
                          <Textarea
                            id="aiPrompt"
                            placeholder={timeSeriesData.length > 0 
                              ? "Describe how to enhance this existing data (e.g., 'Add seasonal patterns and extend by 30 days')" 
                              : "Describe the time series data you want to generate (e.g., 'Generate realistic e-commerce daily sales data')"}
                            className="h-24"
                            {...register('aiPrompt')}
                          />
                          <p className="text-xs text-muted-foreground">
                            {timeSeriesData.length > 0 
                              ? "Describe how you want to enhance or extend the uploaded data" 
                              : "Describe domain, patterns, seasonality, trends, and any specific characteristics"}
                          </p>
                        </div>
                      </ApiKeyRequirement>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Controller
                          control={control}
                          name="startDate"
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Controller
                          control={control}
                          name="endDate"
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium mb-2">
                        {timeSeriesData.length > 0 ? "Modification Options" : "Generation Options"}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interval">Time Interval</Label>
                      <Controller
                        control={control}
                        name="interval"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dataPoints">
                        {timeSeriesData.length > 0 ? "Additional Data Points" : "Number of Data Points"}
                      </Label>
                      <Input
                        id="dataPoints"
                        type="number"
                        {...register('dataPoints', { 
                          required: 'Required',
                          min: { value: 2, message: 'Minimum 2 points' },
                          max: { value: 10000, message: 'Maximum 10000 points' }
                        })}
                      />
                      {errors.dataPoints && (
                        <p className="text-sm text-destructive">{errors.dataPoints.message}</p>
                      )}
                      {timeSeriesData.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Current dataset: {timeSeriesData.length} points
                        </p>
                      )}
                    </div>
                    
                    {!useAi && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="trend">
                            {timeSeriesData.length > 0 ? "Modification Pattern" : "Trend Pattern"}
                          </Label>
                          <Controller
                            control={control}
                            name="trend"
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select trend" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="random">Random</SelectItem>
                                  <SelectItem value="upward">Upward</SelectItem>
                                  <SelectItem value="downward">Downward</SelectItem>
                                  <SelectItem value="seasonal">Seasonal</SelectItem>
                                  <SelectItem value="cyclical">Cyclical</SelectItem>
                                  {timeSeriesData.length > 0 && (
                                    <SelectItem value="extend">Extend Similar Pattern</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="noiseLevel">Noise Level</Label>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(watch('noiseLevel') * 100)}%
                            </span>
                          </div>
                          <Controller
                            control={control}
                            name="noiseLevel"
                            render={({ field: { value, onChange } }) => (
                              <Slider
                                defaultValue={[value]}
                                min={0}
                                max={1}
                                step={0.01}
                                onValueChange={(vals) => onChange(vals[0])}
                              />
                            )}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="seed">Random Seed</Label>
                          <Input
                            id="seed"
                            type="number"
                            {...register('seed', { valueAsNumber: true })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Use the same seed to generate reproducible results
                          </p>
                        </div>
                      </>
                    )}
                    
                    {detectedSchema && (
                      <SchemaEditor
                        schema={detectedSchema}
                        additionalFields={additionalFields}
                        setAdditionalFields={setAdditionalFields}
                        excludeDefaultValue={false} // or true, depending on your requirement
                      />
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="outputFormat">Output Format</Label>
                      <Controller
                        control={control}
                        name="outputFormat"
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="upload">
                  <div className="space-y-4">
                    <FileUploader
                      onFileUpload={handleFileUpload}
                      accept=".csv, .json"
                      title="Upload Time Series Data"
                      description="Upload a CSV or JSON file with timestamp and values"
                    />
                    
                    {uploadedFile && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <p className="font-medium">File: {uploadedFile.name}</p>
                        <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    )}
                    
                    {timeSeriesData.length > 0 && (
                      <ApiKeyRequirement>
                        <Card className="mt-4">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">AI Enhancements</CardTitle>
                            <CardDescription>
                              Enhance uploaded data with AI-generated patterns
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="aiNoisePrompt">AI Enhancement Instructions</Label>
                                <Textarea
                                  id="aiNoisePrompt"
                                  placeholder="Describe how to modify the data (e.g., 'Add weekly seasonality pattern with 20% higher values on weekends')"
                                  className="h-24"
                                  value={aiNoisePrompt}
                                  onChange={(e) => setAiNoisePrompt(e.target.value)}
                                />
                              </div>
                              
                              <Button 
                                onClick={handleApplyAiNoise} 
                                disabled={isApplyingAiNoise || !apiKey}
                                className="w-full"
                              >
                                {isApplyingAiNoise ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Applying AI Enhancements...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Apply AI Enhancements
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </ApiKeyRequirement>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex-col space-y-2">
              {showProgress && (
                <div className="w-full space-y-1 mb-2">
                  <Progress value={progressPercentage} />
                  <p className="text-xs text-right text-muted-foreground">
                    {Math.round(progressPercentage)}%
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 w-full">
                <Button 
                  type="submit" 
                  form="time-series-form" 
                  className="flex-1" 
                  disabled={loading || activeTab !== 'generate'}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : timeSeriesData.length > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Update
                    </>
                  ) : (
                    <>
                      <BarChart className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!formattedData}
                >
                  <DownloadCloud className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCopyToClipboard}
                  disabled={!formattedData}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              {timeSeriesData.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Dataset
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3 space-y-4">
          {timeSeriesData.length > 0 ? (
            <TimeSeriesChart 
              data={timeSeriesData} 
              title="Time Series Data Preview" 
              additionalFields={additionalFieldNames}
              //defaultValue={excludeDefaultValue ? undefined : 'value'}
              className="h-[500px]"
            />
          ) : (
            <Card className="h-[500px]">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <div className="text-center space-y-3">
                  <BarChart className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="font-medium text-xl">No Time Series Data</h3>
                  <p className="text-muted-foreground max-w-md">
                    Generate a new time series data set using the form or upload an existing CSV/JSON file to visualize and manipulate time series data.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {formattedData && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Data</CardTitle>
                <CardDescription>Preview of the generated time series data</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary/20 p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {formattedData.length > 10000 
                    ? formattedData.substring(0, 10000) + "... (truncated)"
                    : formattedData
                  }
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <UserGuideTimeSeriesGenerator />
    </div>
  );
  
};

export default TimeSeries;