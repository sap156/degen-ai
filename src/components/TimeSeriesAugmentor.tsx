import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Wand2, BarChart3, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import { 
  generateTimeSeriesInRange, 
  addNoiseToTimeSeries, 
  isTimeSeriesData 
} from '@/utils/dataParsingUtils';
import { SchemaFieldType } from '@/utils/fileUploadUtils';

interface TimeSeriesAugmentorProps {
  data: any[];
  schema: Record<string, SchemaFieldType>;
  dateField?: string;
  onUpdateData?: (newData: any[]) => void;
}

interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
}

const TimeSeriesAugmentor: React.FC<TimeSeriesAugmentorProps> = ({ 
  data, 
  schema, 
  dateField: propDateField, 
  onUpdateData 
}) => {
  const [isTimeSeries, setIsTimeSeries] = useState<boolean>(false);
  const [dateField, setDateField] = useState<string | undefined>(propDateField);
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [numPoints, setNumPoints] = useState<number>(20);
  const [noiseLevel, setNoiseLevel] = useState<number>(0.2);
  const [appendData, setAppendData] = useState<boolean>(true);
  
  const [noiseStartDate, setNoiseStartDate] = useState<Date | undefined>(undefined);
  const [noiseEndDate, setNoiseEndDate] = useState<Date | undefined>(undefined);
  const [noiseLevelExisting, setNoiseLevelExisting] = useState<number>(0.1);
  
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [numericFields, setNumericFields] = useState<string[]>([]);
  const [selectedNumericField, setSelectedNumericField] = useState<string>('');
  
  const [chartData, setChartData] = useState<TimeSeriesDataPoint[]>([]);
  
  useEffect(() => {
    if (data.length > 0) {
      if (!dateField) {
        const result = isTimeSeriesData(data);
        setIsTimeSeries(result.isTimeSeries);
        setDateField(result.dateField);
      } else {
        setIsTimeSeries(true);
      }
      
      setPreviewData(data);
      
      const numFields = Object.entries(schema)
        .filter(([field, type]) => type === 'integer' || type === 'float' || type === 'number')
        .map(([field]) => field);
      
      setNumericFields(numFields);
      if (numFields.length > 0) {
        setSelectedNumericField(numFields[0]);
      }
      
      if (dateField) {
        try {
          const dates = data.map(item => new Date(item[dateField as string]));
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          
          setStartDate(maxDate);
          const oneMonthLater = new Date(maxDate);
          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
          setEndDate(oneMonthLater);
          
          setNoiseStartDate(minDate);
          setNoiseEndDate(maxDate);
        } catch (error) {
          console.error('Error setting date ranges:', error);
        }
      }
    }
  }, [data, schema, dateField]);
  
  useEffect(() => {
    prepareChartData();
  }, [previewData, dateField, selectedNumericField]);
  
  const prepareChartData = () => {
    if (!dateField || !selectedNumericField || previewData.length === 0) {
      setChartData([]);
      return;
    }
    
    try {
      const chartData = previewData.map(item => ({
        timestamp: new Date(item[dateField as string]),
        value: Number(item[selectedNumericField])
      })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setChartData(chartData);
    } catch (error) {
      console.error('Error preparing chart data:', error);
      setChartData([]);
    }
  };
  
  const handleGenerateData = () => {
    if (!dateField || !startDate || !endDate) {
      toast.error('Date field and date range are required');
      return;
    }
    
    try {
      const newData = generateTimeSeriesInRange(
        data,
        dateField,
        schema,
        startDate,
        endDate,
        numPoints,
        noiseLevel
      );
      
      const combinedData = appendData ? [...data, ...newData] : newData;
      
      setPreviewData(combinedData);
      
      if (onUpdateData) {
        onUpdateData(combinedData);
      }
      
      toast.success(`Generated ${newData.length} new data points`);
    } catch (error) {
      console.error('Error generating time series data:', error);
      toast.error('Failed to generate time series data');
    }
  };
  
  const handleAddNoise = () => {
    if (!dateField || !noiseStartDate || !noiseEndDate) {
      toast.error('Date field and date range are required');
      return;
    }
    
    try {
      const noisyData = addNoiseToTimeSeries(
        data,
        schema,
        noiseLevelExisting,
        dateField,
        noiseStartDate,
        noiseEndDate
      );
      
      setPreviewData(noisyData);
      
      if (onUpdateData) {
        onUpdateData(noisyData);
      }
      
      toast.success('Added noise to existing data');
    } catch (error) {
      console.error('Error adding noise to time series:', error);
      toast.error('Failed to add noise');
    }
  };
  
  const handleDownload = () => {
    if (previewData.length === 0) {
      toast.error('No data to download');
      return;
    }
    
    try {
      const jsonData = JSON.stringify(previewData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'time_series_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data downloaded successfully');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data');
    }
  };
  
  const handleResetPreview = () => {
    setPreviewData(data);
    toast.info('Preview reset to original data');
  };
  
  if (!isTimeSeries || !dateField) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Series Augmentation</CardTitle>
          <CardDescription>Enhance your time series data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <BarChart3 className="h-12 w-12 text-muted" />
            <h3 className="text-lg font-medium">No Time Series Data Detected</h3>
            <p className="text-muted-foreground max-w-md">
              This data doesn't appear to be time series data. Time series data should have a date/time field and at least one numeric field.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Time Series Visualization</span>
            <Select
              value={selectedNumericField}
              onValueChange={setSelectedNumericField}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {numericFields.map(field => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>
            Preview of your time series data - {chartData.length} data points
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <TimeSeriesChart data={chartData} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-2 text-muted" />
              <p>No data to display</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Time Series Augmentation</CardTitle>
          <CardDescription>
            Generate additional data points or add noise to existing time series data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="generate">Generate Data</TabsTrigger>
              <TabsTrigger value="noise">Add Noise</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex justify-between items-center"
                      >
                        {startDate ? format(startDate, 'PPP') : "Select date"}
                        <CalendarIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex justify-between items-center"
                      >
                        {endDate ? format(endDate, 'PPP') : "Select date"}
                        <CalendarIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numPoints">Number of Points</Label>
                  <Input
                    id="numPoints"
                    type="number"
                    value={numPoints}
                    onChange={(e) => setNumPoints(parseInt(e.target.value) || 10)}
                    min={1}
                    max={1000}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="noiseLevel">
                    Noise Level: {Math.round(noiseLevel * 100)}%
                  </Label>
                  <Slider
                    id="noiseLevel"
                    value={[noiseLevel]}
                    onValueChange={(value) => setNoiseLevel(value[0])}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="appendData" 
                  checked={appendData} 
                  onCheckedChange={setAppendData}
                />
                <Label htmlFor="appendData">Append to existing data</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="noise" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="noiseStartDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex justify-between items-center"
                      >
                        {noiseStartDate ? format(noiseStartDate, 'PPP') : "Select date"}
                        <CalendarIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={noiseStartDate}
                        onSelect={setNoiseStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="noiseEndDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex justify-between items-center"
                      >
                        {noiseEndDate ? format(noiseEndDate, 'PPP') : "Select date"}
                        <CalendarIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={noiseEndDate}
                        onSelect={setNoiseEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="noiseLevelExisting">
                  Noise Level: {Math.round(noiseLevelExisting * 100)}%
                </Label>
                <Slider
                  id="noiseLevelExisting"
                  value={[noiseLevelExisting]}
                  onValueChange={(value) => setNoiseLevelExisting(value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={handleResetPreview}
              disabled={previewData.length === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={previewData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          
          <Button
            onClick={activeTab === 'generate' ? handleGenerateData : handleAddNoise}
          >
            {activeTab === 'generate' ? (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Data
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Add Noise
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TimeSeriesAugmentor;
