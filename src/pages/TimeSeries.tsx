
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarIcon, Download, LineChart, BarChart, PieChart } from 'lucide-react';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import UserGuideTimeSeriesGenerator from '@/components/ui/UserGuideTimeSeriesGenerator';
import { formatData, downloadData } from '@/utils/fileUploadUtils';
import FileUploaderWrapper from '@/components/FileUploaderWrapper';
import DateRangeInfoAdapter from '@/components/DateRangeInfoAdapter';
import { generateTimeSeriesWithDate } from '@/utils/timeSeriesUtils';

const TimeSeries = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [interval, setInterval] = useState<string>('daily');
  const [dataPattern, setDataPattern] = useState<string>('trend');
  const [datasetType, setDatasetType] = useState<string>('sales');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [exporting, setExporting] = useState<boolean>(false);
  
  const handleGenerateData = async () => {
    setLoading(true);
    try {
      // Use our adapter function instead of direct service call
      const data = await generateTimeSeriesWithDate(startDate, endDate, interval, 100);
      setGeneratedData(data);
      toast.success(`Generated ${data.length} time series data points`);
    } catch (error) {
      console.error('Error generating time series data:', error);
      toast.error('Failed to generate time series data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = () => {
    if (generatedData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    setExporting(true);
    try {
      const formattedData = formatData(generatedData, 'json');
      downloadData(formattedData, `time_series_${datasetType}_${interval}`, 'json');
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };
  
  const handleFileUpload = (data: any[]) => {
    if (data.length > 0) {
      setGeneratedData(data);
      toast.success(`Loaded ${data.length} time series data points`);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Time Series Generator</h1>
          <p className="text-muted-foreground">
            Generate synthetic time series data for testing and development.
          </p>
        </div>

        <ApiKeyRequirement showUserGuide={<UserGuideTimeSeriesGenerator />}>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="generate">
                <LineChart className="mr-2 h-4 w-4" />
                <span>Generate</span>
              </TabsTrigger>
              <TabsTrigger value="visualize">
                <BarChart className="mr-2 h-4 w-4" />
                <span>Visualize</span>
              </TabsTrigger>
              <TabsTrigger value="export">
                <Download className="mr-2 h-4 w-4" />
                <span>Export</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Time Series Configuration</CardTitle>
                    <CardDescription>
                      Configure parameters for generating time series data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDate(startDate)}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={(date) => date && setStartDate(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formatDate(endDate)}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(date) => date && setEndDate(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <DateRangeInfoAdapter startDate={startDate} endDate={endDate} dataPoints={100} />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Data Interval</Label>
                          <Select value={interval} onValueChange={setInterval}>
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
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Data Pattern</Label>
                          <Select value={dataPattern} onValueChange={setDataPattern}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trend">Trend</SelectItem>
                              <SelectItem value="seasonal">Seasonal</SelectItem>
                              <SelectItem value="cyclic">Cyclical</SelectItem>
                              <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Dataset Type</Label>
                          <Select value={datasetType} onValueChange={setDatasetType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales Data</SelectItem>
                              <SelectItem value="temperature">Temperature</SelectItem>
                              <SelectItem value="stock">Stock Price</SelectItem>
                              <SelectItem value="website">Website Traffic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateData}
                      disabled={loading}
                    >
                      {loading ? 'Generating...' : 'Generate Time Series Data'}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Data</CardTitle>
                    <CardDescription>
                      Or upload your own time series data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FileUploaderWrapper
                      onFileUpload={handleFileUpload}
                      accept=".csv,.json"
                    />
                    
                    <DateRangeInfoAdapter startDate={startDate} endDate={endDate} dataPoints={100} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="visualize" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Time Series Visualization</CardTitle>
                  <CardDescription>
                    Visual representation of generated time series data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedData.length > 0 ? (
                    <div className="h-80">
                      <TimeSeriesChart data={generatedData} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <LineChart className="h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No Data to Visualize</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        Generate time series data or upload your own data to visualize it here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Time Series Data</CardTitle>
                  <CardDescription>
                    Download generated time series data in different formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Data Preview</h3>
                      {generatedData.length > 0 ? (
                        <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(generatedData.slice(0, 10), null, 2)}
                            {generatedData.length > 10 && '\n\n... and ' + (generatedData.length - 10) + ' more records'}
                          </pre>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center border rounded-md">
                          <PieChart className="h-12 w-12 text-muted-foreground mb-3" />
                          <h3 className="text-lg font-medium">No Data Available</h3>
                          <p className="text-sm text-muted-foreground mt-2 max-w-md">
                            Generate time series data in the "Generate" tab first
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <Button 
                        onClick={handleExport} 
                        disabled={exporting || generatedData.length === 0}
                        className="w-full md:w-auto"
                      >
                        {exporting ? 'Exporting...' : 'Export Data (JSON)'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ApiKeyRequirement>
      </div>
    </div>
  );
};

export default TimeSeries;
