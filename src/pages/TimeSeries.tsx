import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Upload,
  Copy,
  LineChart,
  BarChart,
  AreaChart,
  PanelLeft,
  PanelRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseCSV, parseJSON, readFileContent, detectDataType, generateSchema } from '@/utils/fileUploadUtils';
import { SchemaFieldType } from '@/utils/fileTypes';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Colors
} from 'chart.js';
import { Line, Bar, Scatter as ScatterChart, Bubble, Pie, Doughnut, PolarArea, Radar } from 'react-chartjs-2';
import FileUploader from '@/components/FileUploader';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Colors
);

const TimeSeries = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [schema, setSchema] = useState<Record<string, SchemaFieldType>>({});
  const [timeColumn, setTimeColumn] = useState<string>('');
  const [valueColumn, setValueColumn] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter' | 'area'>('line');
  const [chartTitle, setChartTitle] = useState<string>('Time Series Data');
  const [xAxisLabel, setXAxisLabel] = useState<string>('Time');
  const [yAxisLabel, setYAxisLabel] = useState<string>('Value');
  const [loading, setLoading] = useState(false);
  const [chartOptions, setChartOptions] = useState<any>({});
  const [customOptions, setCustomOptions] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    updateChartData();
  }, [data, timeColumn, valueColumn, chartType, chartTitle, xAxisLabel, yAxisLabel, schema, isDarkTheme]);

  const updateChartData = () => {
    if (!data || data.length === 0 || !timeColumn || !valueColumn) {
      setChartData(null);
      return;
    }

    const labels = data.map(item => item[timeColumn]);
    const values = data.map(item => item[valueColumn]);

    const datasets = [
      {
        label: yAxisLabel,
        data: values,
        backgroundColor: chartType === 'bar' ? 'rgba(54, 162, 235, 0.8)' : 'rgba(54, 162, 235, 0.4)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        fill: chartType === 'area',
        tension: 0.4,
        pointRadius: chartType === 'scatter' ? 5 : 3,
        pointHoverRadius: chartType === 'scatter' ? 8 : 5,
      }
    ];

    setChartData({
      labels,
      datasets,
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      const content = await readFileContent(file);
      
      let parsedData;
      if (file.name.endsWith('.csv')) {
        parsedData = parseCSV(content);
      } else if (file.name.endsWith('.json')) {
        parsedData = parseJSON(content);
      } else {
        toast({
          title: "Error",
          description: "Unsupported file format. Please upload CSV or JSON.",
          variant: "destructive",
        });
        return;
      }
      
      setData(parsedData);
      
      const typeResult = detectDataType(parsedData);
      if (typeResult.type !== 'timeseries') {
        toast({
          title: "Warning",
          description: "The uploaded data doesn't appear to be time series data. Some features may not work correctly.",
          variant: "default",
        });
      }
      
      const detectedSchema = generateSchema(parsedData);
      
      setSchema(detectedSchema);
      
      const timeColumns = Object.entries(detectedSchema)
        .filter(([_, type]) => type === 'date')
        .map(([col]) => col);
      
      if (timeColumns.length > 0) {
        setTimeColumn(timeColumns[0]);
      }
      
      const numericColumns = Object.entries(detectedSchema)
        .filter(([_, type]) => type === 'integer' || type === 'float' || type === 'number')
        .map(([col]) => col);
      
      if (numericColumns.length > 0) {
        setValueColumn(numericColumns[0]);
      }
      
      toast({
        title: "Success",
        description: `Loaded ${parsedData.length} rows of data`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChartOptionsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomOptions(event.target.value);
    try {
      const parsedOptions = JSON.parse(event.target.value);
      setChartOptions(parsedOptions);
      toast({
        title: "Success",
        description: "Custom chart options applied.",
      });
    } catch (error) {
      console.error("Invalid JSON format:", error);
      toast({
        title: "Error",
        description: "Invalid JSON format in custom options.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!chartData) {
      toast({
        title: "Error",
        description: "No chart data available to download.",
        variant: "destructive",
      });
      return;
    }

    const chartCanvas = document.querySelector('canvas');
    if (!chartCanvas) {
      toast({
        title: "Error",
        description: "Chart canvas not found.",
        variant: "destructive",
      });
      return;
    }

    const chartImage = chartCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = chartImage;
    link.download = 'time_series_chart.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Chart downloaded successfully.",
    });
  };

  const chartJsOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: chartTitle,
        color: isDarkTheme ? '#fff' : '#000',
      },
      legend: {
        display: true,
        labels: {
          color: isDarkTheme ? '#fff' : '#000',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          color: isDarkTheme ? '#fff' : '#000',
        },
        ticks: {
          color: isDarkTheme ? '#fff' : '#000',
        },
        grid: {
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          color: isDarkTheme ? '#fff' : '#000',
        },
        ticks: {
          color: isDarkTheme ? '#fff' : '#000',
        },
        grid: {
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      },
    },
    backgroundColor: isDarkTheme ? '#333' : '#fff',
    color: isDarkTheme ? '#fff' : '#000',
    ...chartOptions,
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Time Series Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Visualize time series data with interactive charts and customizable options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Input</CardTitle>
              <CardDescription>Upload your time series data in CSV or JSON format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploader
                onFileUpload={handleFileUpload}
                accept=".csv,.json"
                maxSize={5}
                title="Upload Time Series Data"
                description="Upload a CSV or JSON file with time series data"
              />
              {loading && (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span className="text-sm">Processing file...</span>
                </div>
              )}
              {data.length > 0 && !loading && (
                <div className="text-sm text-muted-foreground mt-2">
                  <p>Rows: {data.length}</p>
                  <p>Columns: {Object.keys(schema).length}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chart Configuration</CardTitle>
              <CardDescription>Customize your chart settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="time-column">Time Column</Label>
                <Select value={timeColumn} onValueChange={setTimeColumn}>
                  <SelectTrigger id="time-column">
                    <SelectValue placeholder="Select time column" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(schema).filter(key => schema[key] === 'date').map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value-column">Value Column</Label>
                <Select value={valueColumn} onValueChange={setValueColumn}>
                  <SelectTrigger id="value-column">
                    <SelectValue placeholder="Select value column" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(schema).filter(key => 
                      schema[key] === 'integer' || schema[key] === 'float' || schema[key] === 'number'
                    ).map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chart-type">Chart Type</Label>
                <Select 
                  value={chartType} 
                  onValueChange={(value) => setChartType(value as 'line' | 'bar' | 'scatter' | 'area')}
                >
                  <SelectTrigger id="chart-type">
                    <SelectValue placeholder="Select chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="scatter">Scatter</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chart-title">Chart Title</Label>
                <Input
                  type="text"
                  id="chart-title"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="x-axis-label">X-Axis Label</Label>
                <Input
                  type="text"
                  id="x-axis-label"
                  value={xAxisLabel}
                  onChange={(e) => setXAxisLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="y-axis-label">Y-Axis Label</Label>
                <Input
                  type="text"
                  id="y-axis-label"
                  value={yAxisLabel}
                  onChange={(e) => setYAxisLabel(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
              <CardDescription>Customize chart.js options (JSON format)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-advanced-options">Show Advanced Options</Label>
                <Switch
                  id="show-advanced-options"
                  checked={showAdvancedOptions}
                  onCheckedChange={setShowAdvancedOptions}
                />
              </div>
              {showAdvancedOptions && (
                <div className="space-y-2">
                  <Label htmlFor="custom-options">Custom Options (JSON)</Label>
                  <Textarea
                    id="custom-options"
                    placeholder='e.g., {"scales": {"y": {"beginAtZero": true}}}'
                    value={customOptions}
                    onChange={handleChartOptionsChange}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Toggle between light and dark themes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-toggle">Dark Theme</Label>
                <Switch
                  id="theme-toggle"
                  checked={isDarkTheme}
                  onCheckedChange={setIsDarkTheme}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Chart</CardTitle>
              <CardDescription>Download the chart as a PNG image</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleDownload} disabled={!chartData}>
                <Download className="h-4 w-4 mr-2" />
                Download Chart
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Time Series Chart</CardTitle>
              <CardDescription>Interactive visualization of your time series data</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData ? (
                <div className="h-[500px] w-full">
                  {chartType === 'line' && <Line data={chartData} options={chartJsOptions} />}
                  {chartType === 'bar' && <Bar data={chartData} options={chartJsOptions} />}
                  {chartType === 'scatter' && <ScatterChart data={chartData} options={chartJsOptions} />}
                  {chartType === 'area' && <Line data={chartData} options={chartJsOptions} />}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  {loading ? 'Loading chart...' : 'Upload data and configure settings to generate a chart'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimeSeries;
