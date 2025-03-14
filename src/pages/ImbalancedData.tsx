
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, BarChart, Clipboard, PieChart, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  generateSampleDataset,
  balanceDataset,
  downloadData,
  exportAsJson,
  exportAsCsv,
  type DatasetInfo,
  type BalancingOptions
} from '@/services/imbalancedDataService';

const formSchema = z.object({
  classCount: z.number().min(2).max(10),
  totalSamples: z.number().min(100).max(10000),
  maxImbalanceRatio: z.number().min(1).max(50),
  balancingMethod: z.enum(['none', 'undersample', 'oversample', 'smote']),
  targetRatio: z.number().min(1).max(5).optional(),
});

const ImbalancedData = () => {
  const [originalDataset, setOriginalDataset] = useState<DatasetInfo | null>(null);
  const [balancedDataset, setBalancedDataset] = useState<DatasetInfo | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classCount: 4,
      totalSamples: 1000,
      maxImbalanceRatio: 10,
      balancingMethod: 'none',
      targetRatio: 1.5,
    },
  });
  
  const watchClassCount = form.watch('classCount');
  const watchTotalSamples = form.watch('totalSamples');
  const watchMaxImbalanceRatio = form.watch('maxImbalanceRatio');
  const watchBalancingMethod = form.watch('balancingMethod');
  const watchTargetRatio = form.watch('targetRatio');
  
  // Generate dataset on first load and when parameters change
  useEffect(() => {
    generateNewDataset();
  }, [watchClassCount, watchTotalSamples, watchMaxImbalanceRatio]);
  
  // Apply balancing when balancing parameters change
  useEffect(() => {
    if (originalDataset) {
      applyBalancing();
    }
  }, [watchBalancingMethod, watchTargetRatio, originalDataset]);
  
  const generateNewDataset = () => {
    const dataset = generateSampleDataset(
      watchClassCount,
      watchMaxImbalanceRatio,
      watchTotalSamples
    );
    setOriginalDataset(dataset);
    applyBalancing(dataset);
  };
  
  const applyBalancing = (dataset = originalDataset) => {
    if (!dataset) return;
    
    const options: BalancingOptions = {
      method: watchBalancingMethod as BalancingOptions['method'],
      targetRatio: watchTargetRatio,
    };
    
    const balanced = balanceDataset(dataset, options);
    setBalancedDataset(balanced);
  };
  
  const handleCopyToClipboard = (dataset: DatasetInfo) => {
    navigator.clipboard.writeText(JSON.stringify(dataset, null, 2))
      .then(() => toast.success('Dataset copied to clipboard'))
      .catch(() => toast.error('Failed to copy dataset to clipboard'));
  };
  
  const handleDownload = (dataset: DatasetInfo, format: 'json' | 'csv') => {
    const data = format === 'json' ? exportAsJson(dataset) : exportAsCsv(dataset);
    const fileName = `imbalanced-data-${format === 'json' ? 'report.json' : 'report.csv'}`;
    downloadData(data, fileName, format);
    toast.success(`Downloaded dataset as ${format.toUpperCase()}`);
  };
  
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Imbalanced Data</h1>
        <p className="text-muted-foreground">
          Generate, visualize, and balance datasets with imbalanced class distributions
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dataset Controls</CardTitle>
            <CardDescription>Configure your dataset and balancing options</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Dataset Parameters</h3>
                  
                  <FormField
                    control={form.control}
                    name="classCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Classes: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={2}
                            max={10}
                            step={1}
                            onValueChange={(val) => field.onChange(val[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Select between 2 and 10 classes
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalSamples"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Samples: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={100}
                            max={10000}
                            step={100}
                            onValueChange={(val) => field.onChange(val[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of samples in the dataset
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxImbalanceRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Imbalance Ratio: {field.value}:1</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={1}
                            max={50}
                            step={1}
                            onValueChange={(val) => field.onChange(val[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum ratio between majority and minority classes
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={generateNewDataset}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Regenerate Dataset
                  </Button>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium">Balancing Options</h3>
                  
                  <FormField
                    control={form.control}
                    name="balancingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balancing Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select balancing method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Original)</SelectItem>
                            <SelectItem value="undersample">Undersampling</SelectItem>
                            <SelectItem value="oversample">Oversampling</SelectItem>
                            <SelectItem value="smote">SMOTE (Synthetic)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a technique to handle class imbalance
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {watchBalancingMethod !== 'none' && (
                    <FormField
                      control={form.control}
                      name="targetRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Imbalance Ratio: {field.value}:1</FormLabel>
                          <FormControl>
                            <Slider
                              value={[field.value || 1.5]}
                              min={1}
                              max={5}
                              step={0.1}
                              onValueChange={(val) => field.onChange(val[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Desired ratio between majority and minority classes
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
        
        {/* Visualization section */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription>Visualize class distribution before and after balancing</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartType('pie')}
                className={chartType === 'pie' ? 'bg-muted' : ''}
              >
                <PieChart className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartType('bar')}
                className={chartType === 'bar' ? 'bg-muted' : ''}
              >
                <BarChart className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="original" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="original">Original Dataset</TabsTrigger>
                <TabsTrigger value="balanced">Balanced Dataset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="original" className="pt-4">
                {originalDataset && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">Class Distribution</h3>
                        <p className="text-sm text-muted-foreground">
                          Imbalance Ratio: {originalDataset.imbalanceRatio}:1
                          {originalDataset.isImbalanced && 
                            <span className="text-amber-500 ml-2 font-semibold">Imbalanced</span>
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyToClipboard(originalDataset)}
                        >
                          <Clipboard className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(originalDataset, 'json')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(originalDataset, 'csv')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </div>
                    
                    <div className="h-80">
                      {chartType === 'pie' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={originalDataset.classes}
                              dataKey="count"
                              nameKey="className"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                              {originalDataset.classes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} samples`, 'Count']} />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={originalDataset.classes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="className" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} samples`, 'Count']} />
                            <Legend />
                            <Bar dataKey="count" name="Samples" fill="#4f46e5">
                              {originalDataset.classes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="balanced" className="pt-4">
                {balancedDataset && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">Balanced Distribution</h3>
                        <p className="text-sm text-muted-foreground">
                          Imbalance Ratio: {balancedDataset.imbalanceRatio}:1
                          {balancedDataset.isImbalanced ? 
                            <span className="text-amber-500 ml-2 font-semibold">Still Imbalanced</span> :
                            <span className="text-green-500 ml-2 font-semibold">Balanced</span>
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyToClipboard(balancedDataset)}
                        >
                          <Clipboard className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(balancedDataset, 'json')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(balancedDataset, 'csv')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </div>
                    
                    <div className="h-80">
                      {chartType === 'pie' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={balancedDataset.classes}
                              dataKey="count"
                              nameKey="className"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                              {balancedDataset.classes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} samples`, 'Count']} />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={balancedDataset.classes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="className" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value} samples`, 'Count']} />
                            <Legend />
                            <Bar dataKey="count" name="Samples" fill="#4f46e5">
                              {balancedDataset.classes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Data Analysis section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Analysis</CardTitle>
          <CardDescription>Summary of class distribution before and after balancing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Class</th>
                  <th className="text-right p-2">Original Count</th>
                  <th className="text-right p-2">Original %</th>
                  <th className="text-right p-2">Balanced Count</th>
                  <th className="text-right p-2">Balanced %</th>
                  <th className="text-right p-2">Difference</th>
                </tr>
              </thead>
              <tbody>
                {originalDataset?.classes.map((cls, index) => {
                  const balancedClass = balancedDataset?.classes.find(
                    c => c.className === cls.className
                  );
                  const countDiff = balancedClass 
                    ? balancedClass.count - cls.count 
                    : 0;
                  return (
                    <tr key={cls.className} className="border-b hover:bg-muted/50">
                      <td className="p-2 flex items-center">
                        <span 
                          className="h-3 w-3 rounded-full mr-2" 
                          style={{ backgroundColor: cls.color }}
                        ></span>
                        {cls.className}
                      </td>
                      <td className="text-right p-2">{cls.count}</td>
                      <td className="text-right p-2">{cls.percentage}%</td>
                      <td className="text-right p-2">{balancedClass?.count || 0}</td>
                      <td className="text-right p-2">{balancedClass?.percentage || 0}%</td>
                      <td className={`text-right p-2 ${countDiff > 0 ? 'text-green-500' : countDiff < 0 ? 'text-red-500' : ''}`}>
                        {countDiff > 0 ? `+${countDiff}` : countDiff}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-medium">
                  <td className="p-2">Total</td>
                  <td className="text-right p-2">{originalDataset?.totalSamples}</td>
                  <td className="text-right p-2">100%</td>
                  <td className="text-right p-2">{balancedDataset?.totalSamples}</td>
                  <td className="text-right p-2">100%</td>
                  <td className="text-right p-2">
                    {balancedDataset && originalDataset 
                      ? (balancedDataset.totalSamples - originalDataset.totalSamples > 0 ? '+' : '') +
                        (balancedDataset.totalSamples - originalDataset.totalSamples)
                      : 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImbalancedData;
