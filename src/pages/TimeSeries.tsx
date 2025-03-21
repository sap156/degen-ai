import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/FileUploader';
import { formatData } from '@/utils/fileUploadUtils';
import { toast } from 'sonner';
import { LineChart, Calendar, Sparkles, Download } from 'lucide-react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import DateRangeInfo from '@/components/DateRangeInfo';
import { generateTimeSeriesData } from '@/services/timeSeriesService';
import UserGuideTimeSeriesGenerator from '@/components/ui/UserGuideTimeSeriesGenerator';

const TimeSeries = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date('2024-01-01'));
  const [endDate, setEndDate] = useState<Date | null>(new Date('2024-12-31'));
  const [patternType, setPatternType] = useState('linear');
  const [noiseLevel, setNoiseLevel] = useState(0.1);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleFileUpload = (data: any[]) => {
    setDataset(data);
    if (data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      setTargetColumn(cols[0]);
      toast.success(`Uploaded dataset with ${data.length} rows and ${cols.length} columns`);
    }
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setGenerating(true);
    try {
      const generated = await generateTimeSeriesData(startDate, endDate, patternType, noiseLevel);
      setGeneratedData(generated);
      toast.success(`Generated ${generated.length} data points`);
    } catch (error) {
      console.error('Error generating time series data:', error);
      toast.error('Failed to generate time series data');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    if (generatedData.length > 0) {
      setExporting(true);
      setTimeout(() => {
        const formattedData = formatData(generatedData, 'json');
        // Adjust the filename to include the date range
        const filename = `time_series_data_${startDate?.toISOString().split('T')[0]}_to_${endDate?.toISOString().split('T')[0]}.json`;
        const blob = new Blob([formattedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExporting(false);
        toast.success('Time series data exported successfully');
      }, 800);
    }
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Time Series Generator</h1>
          <p className="text-muted-foreground">
            Generate realistic time series data with customizable patterns and trends.
          </p>
        </div>

        <ApiKeyRequirement showUserGuide={<UserGuideTimeSeriesGenerator />}>
          <Tabs defaultValue="generator" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="generator" className="flex items-center gap-1">
                <LineChart className="h-4 w-4" />
                <span>Generator</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Date Range Info</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
                    Time Series Configuration
                  </CardTitle>
                  <CardDescription>
                    Customize the parameters for generating time series data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DateRangeInfo
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />

                  <div className="space-y-2">
                    <label htmlFor="pattern-type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                      Pattern Type
                    </label>
                    <select
                      id="pattern-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-muted-foreground file:h-10 file:w-4 file:flex-1 file:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={patternType}
                      onChange={(e) => setPatternType(e.target.value)}
                    >
                      <option value="linear">Linear</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="random">Random</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="noise-level" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                      Noise Level
                    </label>
                    <input
                      type="number"
                      id="noise-level"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:text-muted-foreground file:h-10 file:w-4 file:flex-1 file:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={noiseLevel}
                      onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                      min="0"
                      max="1"
                      step="0.05"
                    />
                  </div>

                  <Button onClick={handleGenerate} disabled={generating} className="w-full">
                    {generating ? 'Generating...' : 'Generate Time Series Data'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    Date Range Information
                  </CardTitle>
                  <CardDescription>
                    View and adjust the date range for time series generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DateRangeInfo
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {generatedData.length > 0 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LineChart className="mr-2 h-5 w-5 text-blue-500" />
                      Time Series Chart
                    </CardTitle>
                    <CardDescription>
                      Visualize the generated time series data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TimeSeriesChart data={generatedData} />
                  </CardContent>
                </Card>

                <Button variant="outline" onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </>
                  )}
                </Button>
              </div>
            )}
          </Tabs>
        </ApiKeyRequirement>
      </div>
    </div>
  );
};

export default TimeSeries;
