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
import { parseCSV, parseJSON, readFileContent, detectDataType, generateSchema, SchemaFieldType } from '@/utils/fileUploadUtils';

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
  excludeDefaultValue?: boolean;
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
  const [activeSubTab, setActiveSubTab] = useState<string>('manual'); // 'manual' or 'ai'
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [detectedSchema, setDetectedSchema] = useState<Record<string, SchemaFieldType> | null>(null);
  const [uploadedTimestampField, setUploadedTimestampField] = useState<string | null>(null);
  
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
      excludeDefaultValue: false
    }
  });
  
  const outputFormat = watch('outputFormat');
  const additionalFieldCount = watch('additionalFieldCount');
  const additionalFields = watch('additionalFields') || [];
  const useAi = watch('useAi');
  const excludeDefaultValue = watch('excludeDefaultValue');
  
  useEffect(() => {
    const currentCount = additionalFields?.length || 0;
    
    if (additionalFieldCount > currentCount) {
      const newFields = [...(additionalFields || [])];
      for (let i = currentCount; i < additionalFieldCount; i++) {
        newFields.push({ name: `field${i + 1}`, type: 'number' });
      }
      setValue('additionalFields', newFields);
    } else if (additionalFieldCount < currentCount) {
      setValue('additionalFields', additionalFields.slice(0, additionalFieldCount));
    }
  }, [additionalFieldCount, setValue, additionalFields]);
  
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
          existingData: timeSeriesData.length > 0 ? timeSeriesData : undefined,
          excludeDefaultValue: data.excludeDefaultValue,
          onProgressUpdate: setProgressPercentage
        });
      } else {
        // For manual generation, simulate progress
        setProgressPercentage(25);
        setTimeout(() => setProgressPercentage(50), 300);
        setTimeout(() => setProgressPercentage(75), 500);
        
        generatedData = generateTimeSeriesData({
          ...data,
          excludeDefaultValue: data.excludeDefaultValue
        });
        
        setTimeout(() => setProgressPercentage(100), 700);
      }
      
      setTimeSeriesData(generatedData);
      
      const formatted = data.outputFormat === 'csv'
        ? formatAsCSV(generatedData)
        : formatAsJSON(generatedData);
        
      setFormattedData(formatted);
      
      toast.success(`Generated ${generatedData.length} time series data points`);
    } catch (error) {
      console.error('Error generating time series data:', error);
      toast.error('Failed to generate time series data');
    } finally {
      setLoading(false);
      // Hide progress after a delay
      setTimeout(() => setShowProgress(false), 1000);
    }
  };
  
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
      // Hide progress after a delay
      setTimeout(() => setShowProgress(false), 1000);
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
      
      // Process the data and detect schema
      const timeSeriesData = processUploadedTimeSeriesData(parsedData);
      setTimeSeriesData(timeSeriesData);
      
      // Generate formatted data for display
      const formatted = outputFormat === 'csv'
        ? formatAsCSV(timeSeriesData)
        : formatAsJSON(timeSeriesData);
      
      setFormattedData(formatted);
      
      // Extract schema from the data
      const schema = generateSchema(timeSeriesData);
      setDetectedSchema(schema);
      
      // Set detected dataset properties to the form
      updateFormWithDetectedSchema(timeSeriesData, schema);
      
      // Automatically switch to generate tab
      setActiveTab('generate');
      
      toast.success(`Processed ${timeSeriesData.length} time series data points and detected schema`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error((error as Error).message || 'Failed to process file');
    } finally {
      setIsProcessingFile(false);
    }
  };
  
  // New function to update form with detected schema
  const updateFormWithDetectedSchema = (data: TimeSeriesDataPoint[], schema: Record<string, SchemaFieldType>) => {
    if (!data.length) return;
    
    try {
      // Detect date range from the data
      const timestamps = data.map(item => new Date(item.timestamp));
      const minDate = new Date(Math.min(...timestamps.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...timestamps.map(d => d.getTime())));
      
      // Set start and end dates based on the data
      setValue('startDate', minDate);
      setValue('endDate', maxDate);
      
      // Detect interval (daily, hourly, etc.)
      const detectedInterval = detectTimeInterval(timestamps);
      if (detectedInterval) {
        setValue('interval', detectedInterval);
      }
      
      // Update dataset name based on file
      if (uploadedFile) {
        const fileName = uploadedFile.name.split('.')[0];
        setValue('datasetName', fileName);
      }
      
      // Extract additional fields from the schema
      const additionalFields = Object.entries(schema)
        .filter(([key, type]) => {
          // Exclude timestamp and default value fields
          return key !== 'timestamp' && (excludeDefaultValue ? key !== 'value' : true);
        })
        .map(([key, type]) => {
          // Convert schema type to additionalField type
          let fieldType: 'number' | 'boolean' | 'category' = 'number';
          
          if (type === 'boolean') {
            fieldType = 'boolean';
          } else if (type === 'string' || type === 'address' || type === 'name') {
            fieldType = 'category';
          }
          
          return { name: key, type: fieldType };
        });
      
      // Update the additionalFields in the form
      setValue('additionalFields', additionalFields);
      setValue('additionalFieldCount', additionalFields.length);
      
      // Exclude default value if specified
      setValue('excludeDefaultValue', schema['value'] ? false : true);
      
      // Get data points count
      setValue('dataPoints', data.length);
    } catch (error) {
      console.error('Error updating form with detected schema:', error);
    }
  };
  
  // Helper function to detect time interval in the data
  const detectTimeInterval = (timestamps: Date[]): 'hourly' | 'daily' | 'weekly' | 'monthly' | undefined => {
    if (timestamps.length < 2) return undefined;
    
    // Sort dates chronologically
    timestamps.sort((a, b) => a.getTime() - b.getTime());
    
    // Calculate average difference between consecutive timestamps in milliseconds
    let totalDiff = 0;
    for (let i = 1; i < Math.min(10, timestamps.length); i++) {
      totalDiff += timestamps[i].getTime() - timestamps[i-1].getTime();
    }
    
    const avgDiffMs = totalDiff / Math.min(9, timestamps.length - 1);
    
    // Convert to appropriate interval
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs; // Approximate
    
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
        value: 0 // Initialize with a default value
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
    
    // Store the detected timestamp field for later use
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
  
  // Get field names for the chart
  const additionalFieldNames = useMemo(() => {
    if (!timeSeriesData.length) return [];
    
    return Object.keys(timeSeriesData[0])
      .filter(key => {
        // Include only numeric fields that are not the timestamp or default value (if excluded)
        return (
          key !== 'timestamp' && 
          typeof timeSeriesData[0][key] === 'number' && 
          (!excludeDefaultValue || key !== 'value')
        );
      });
  }, [timeSeriesData, excludeDefaultValue]);
  
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
                    {/* Schema detection notification */}
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
                    
                    {/* Conditional heading based on whether data is uploaded or being created */}
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

                    {/* Add option to exclude default value field */}
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="excludeDefaultValue" 
                        checked={excludeDefaultValue} 
                        onCheckedChange={(checked) => setValue('excludeDefaultValue', checked)} 
                      />
                      <Label htmlFor="excludeDefaultValue" className="font-medium">
                        Exclude default "value" field
                      </Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="additionalFieldCount">Additional Fields</Label>
                      <Input
                        id="additionalFieldCount"
                        type="number"
                        min={0}
                        max={5}
                        {...register('additionalFieldCount', { 
                          valueAsNumber: true,
                          min: 0,
                          max: 5
                        })}
                      />
                    </div>
                    
                    {additionalFields && additionalFields.length > 0 && (
                      <div className="space-y-3 border p-3 rounded-md">
                        <h4 className="font-medium">Configure Additional Fields</h4>
                        
                        {additionalFields.map((field, index) => (
                          <div key={index} className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`field-name-${index}`}>Field Name</Label>
                              <Input
                                id={`field-name-${index}`}
                                value={field.name}
                                onChange={(e) => {
                                  const updatedFields = [...additionalFields];
                                  updatedFields[index] = { ...field, name: e.target.value };
                                  setValue('additionalFields', updatedFields);
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`field-type-${index}`}>Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value: 'number' | 'boolean' | 'category') => {
                                  const updatedFields = [...additionalFields];
                                  updatedFields[index] = { ...field, type: value };
                                  setValue('additionalFields', updatedFields);
                                }}
                              >
                                <SelectTrigger id={`field-type-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="category">Category</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
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
                            <CardDescription>Enhance uploaded data with
