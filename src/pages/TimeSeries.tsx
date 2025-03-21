import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';
import UserGuideTimeSeriesGenerator from '@/components/ui/UserGuideTimeSeriesGenerator';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, BarChart3, Copy, Download, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { generateSyntheticTimeSeriesData } from '@/services/syntheticDataService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';

// The existing TimeSeries component with its functionality
const TimeSeriesContent = () => {
  const { apiKey, isKeySet } = useApiKey();
  const [seriesName, setSeriesName] = useState('SampleTimeSeries');
  const [seriesDescription, setSeriesDescription] = useState('A sample time series dataset.');
  const [seriesLength, setSeriesLength] = useState(100);
  const [timeIncrement, setTimeIncrement] = useState('day');
  const [startValue, setStartValue] = useState(100);
  const [endValue, setEndValue] = useState(200);
  const [trend, setTrend] = useState('increasing');
  const [seasonality, setSeasonality] = useState('none');
  const [noiseLevel, setNoiseLevel] = useState(10);
  const [anomalies, setAnomalies] = useState(false);
  const [missingValues, setMissingValues] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateData = async () => {
    if (!apiKey) {
      toast.error('OpenAI API key is required for data generation');
      return;
    }

    setLoading(true);
    try {
      const options = {
        seriesName,
        seriesDescription,
        seriesLength,
        timeIncrement,
        startValue,
        endValue,
        trend,
        seasonality,
        noiseLevel,
        anomalies,
        missingValues,
      };

      const data = await generateSyntheticTimeSeriesData(apiKey, options);
      setGeneratedData(data);
      toast.success('Time series data generated successfully!');
    } catch (error) {
      console.error('Error generating time series data:', error);
      toast.error('Failed to generate time series data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = () => {
    if (!generatedData.length) {
      toast.error('No data to download. Please generate data first.');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' +
      ['Timestamp,Value', ...generatedData.map(item => `${item.timestamp},${item.value}`)]
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${seriesName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data downloaded successfully!');
  };

  const handleCopyToClipboard = () => {
    if (!generatedData.length) {
      toast.error('No data to copy. Please generate data first.');
      return;
    }

    const textToCopy = ['Timestamp,Value', ...generatedData.map(item => `${item.timestamp},${item.value}`)]
      .join('\n');

    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success('Data copied to clipboard!'))
      .catch(err => toast.error('Failed to copy data to clipboard'));
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Time Series Configuration</CardTitle>
          <CardDescription>Configure the parameters for generating synthetic time series data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seriesName">Series Name</Label>
              <Input
                type="text"
                id="seriesName"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="seriesDescription">Series Description</Label>
              <Textarea
                id="seriesDescription"
                value={seriesDescription}
                onChange={(e) => setSeriesDescription(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="seriesLength">Series Length</Label>
              <Input
                type="number"
                id="seriesLength"
                value={seriesLength}
                onChange={(e) => setSeriesLength(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="timeIncrement">Time Increment</Label>
              <Select value={timeIncrement} onValueChange={setTimeIncrement}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Time Increment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trend">Trend</Label>
              <Select value={trend} onValueChange={setTrend}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increasing">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Increasing
                  </SelectItem>
                  <SelectItem value="decreasing">
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Decreasing
                  </SelectItem>
                  <SelectItem value="none">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    None
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startValue">Start Value</Label>
              <Input
                type="number"
                id="startValue"
                value={startValue}
                onChange={(e) => setStartValue(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="endValue">End Value</Label>
              <Input
                type="number"
                id="endValue"
                value={endValue}
                onChange={(e) => setEndValue(Number(e.target.value))}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="seasonality">Seasonality</Label>
              <Select value={seasonality} onValueChange={setSeasonality}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Seasonality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="noiseLevel">Noise Level (%)</Label>
              <Slider
                defaultValue={[noiseLevel]}
                max={100}
                step={1}
                onValueChange={(value) => setNoiseLevel(value[0])}
              />
              <p className="text-sm text-muted-foreground">
                Current Noise Level: {noiseLevel}%
              </p>
            </div>
            <div>
              <Label>Data Imperfections</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="anomalies" checked={anomalies} onCheckedChange={setAnomalies} />
                  <Label htmlFor="anomalies">Anomalies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="missingValues"
                    checked={missingValues}
                    onCheckedChange={setMissingValues}
                  />
                  <Label htmlFor="missingValues">Missing Values</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="flex justify-between p-4">
          <div>
            {!isKeySet && (
              <ApiKeyRequirement />
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCopyToClipboard} disabled={!generatedData.length}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Data
            </Button>
            <Button onClick={handleDownloadData} disabled={!generatedData.length}>
              <Download className="mr-2 h-4 w-4" />
              Download Data
            </Button>
            <Button onClick={handleGenerateData} disabled={loading || !isKeySet}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Data
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {generatedData.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Generated Data Preview</CardTitle>
            <CardDescription>Here is a preview of the generated time series data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generatedData.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{item.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {generatedData.length > 5 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  ...and {generatedData.length - 5} more records
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <UserGuideTimeSeriesGenerator />
    </div>
  );
};

// Wrapper component that adds authentication check
const TimeSeries = () => {
  const { user } = useAuth();

  // If user is not authenticated, only show auth requirement and user guide
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Time Series Generator</h1>
        <AuthRequirement showUserGuide={<UserGuideTimeSeriesGenerator />} />
      </div>
    );
  }

  // If user is authenticated, show the full component
  return <TimeSeriesContent />;
};

export default TimeSeries;
