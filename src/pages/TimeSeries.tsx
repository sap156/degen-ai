import React from 'react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
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
import { FileUploader } from '@/components/FileUploader';
import { SchemaEditor } from '@/components/SchemaEditor';
import { DataGenerationOptions } from '@/components/DataGenerationOptions';
import { DateRangeInfo } from '@/components/DateRangeInfo';
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
  excludeDefaultValue?: boolean;
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
      excludeDefaultValue: false,
      generationMode: 'new'
    }
  });
  
  const outputFormat = watch('outputFormat');
  const additionalFields = watch('additionalFields') || [];
  const useAi = watch('useAi');
  const excludeDefaultValue = watch('excludeDefaultValue');
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
          excludeDefaultValue: data.excludeDefaultValue,
          onProgressUpdate: setProgressPercentage
        });
      } else {
        generatedData = generateTimeSeriesData({
          ...data,
          excludeDefaultValue: data.excludeDefaultValue,
          existingData: data.generationMode === 'append' && timeSeriesData.length > 0 
            ? timeSeriesData 
            : undefined
        });
        
        setProgressPercentage(25);
        setTimeout(() => setProgressPercentage(50), 300);
        setTimeout(() => setProgressPercentage(75), 500);
        
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
        .filter(([key, type]) => {
          return key !== 'timestamp' && (excludeDefaultValue ? key !== 'value' : true);
        })
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
  }, [detectedSchema, excludeDefaultValue]);
  
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
        .filter(([key, type]) => {
          return key !== 'timestamp' && (excludeDefaultValue ? key !== 'value' : true);
        })
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
      
      setValue('excludeDefaultValue', schema['value'] ? false : true);
      
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
          typeof timeSeriesData[0][key] === 'number' && 
          (!excludeDefaultValue || key !== 'value')
        );
      });
  }, [timeSeriesData, excludeDefaultValue]);
  
  return (
    <ApiKeyRequirement>
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
                 
