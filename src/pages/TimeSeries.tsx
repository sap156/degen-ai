
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, DownloadCloud, Copy, Save, BarChart, RefreshCw } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import TimeSeriesChart from '@/components/TimeSeriesChart';

import {
  generateTimeSeriesData,
  formatAsCSV,
  formatAsJSON,
  downloadData,
  saveToMockDatabase,
  TimeSeriesDataPoint,
  TimeSeriesOptions
} from '@/services/timeSeriesService';

type FormValues = TimeSeriesOptions & {
  outputFormat: 'json' | 'csv';
  datasetName: string;
  additionalFieldCount: number;
};

const TimeSeries = () => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [formattedData, setFormattedData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  const { handleSubmit, control, watch, setValue, register, formState: { errors } } = useForm<FormValues>({
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
      seed: Math.floor(Math.random() * 10000)
    }
  });
  
  const outputFormat = watch('outputFormat');
  const additionalFieldCount = watch('additionalFieldCount');
  const additionalFields = watch('additionalFields') || [];
  
  // Effect to update additional fields when count changes
  useEffect(() => {
    const currentCount = additionalFields?.length || 0;
    
    if (additionalFieldCount > currentCount) {
      // Add new fields
      const newFields = [...(additionalFields || [])];
      for (let i = currentCount; i < additionalFieldCount; i++) {
        newFields.push({ name: `field${i + 1}`, type: 'number' });
      }
      setValue('additionalFields', newFields);
    } else if (additionalFieldCount < currentCount) {
      // Remove excess fields
      setValue('additionalFields', additionalFields.slice(0, additionalFieldCount));
    }
  }, [additionalFieldCount, setValue, additionalFields]);
  
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const generatedData = generateTimeSeriesData(data);
      setTimeSeriesData(generatedData);
      
      // Format based on selected output
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
  
  // Get field names for the chart (excluding timestamp)
  const additionalFieldNames = additionalFields?.map(field => field.name) || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="container mx-auto py-6"
    >
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
              <form id="time-series-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="interval">Time Interval</Label>
                  <Controller
                    control={control}
                    name="interval"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Label htmlFor="dataPoints">Number of Data Points</Label>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="trend">Trend Pattern</Label>
                  <Controller
                    control={control}
                    name="trend"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trend" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Random</SelectItem>
                          <SelectItem value="upward">Upward</SelectItem>
                          <SelectItem value="downward">Downward</SelectItem>
                          <SelectItem value="seasonal">Seasonal</SelectItem>
                          <SelectItem value="cyclical">Cyclical</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                form="time-series-form" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <BarChart className="mr-2 h-4 w-4" />
                    Generate Time Series
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3">
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Chart Preview</TabsTrigger>
              <TabsTrigger value="data">Data Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Time Series Preview</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyToClipboard}
                    disabled={!timeSeriesData.length}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    disabled={!timeSeriesData.length}
                  >
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!timeSeriesData.length || saving}
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
              
              {timeSeriesData.length > 0 ? (
                <TimeSeriesChart 
                  data={timeSeriesData} 
                  additionalFields={additionalFieldNames}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No Data to Display</h3>
                      <p className="text-muted-foreground mt-2">
                        Configure the settings and click "Generate Time Series" to create data
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="data">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Data Preview</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyToClipboard}
                    disabled={!formattedData}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    disabled={!formattedData}
                  >
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  {formattedData ? (
                    <pre className="p-4 overflow-auto max-h-[600px] text-xs font-mono bg-muted rounded-md">
                      {formattedData}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="text-center">
                        <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No Data to Display</h3>
                        <p className="text-muted-foreground mt-2">
                          Generate data to preview it here
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
};

export default TimeSeries;
