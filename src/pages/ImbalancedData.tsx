
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PieChart, BarChart, Save, RefreshCw, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON, readFileContent } from '@/utils/fileUploadUtils';

import {
  ClassDistribution,
  DatasetInfo,
  BalancingOptions,
  generateSampleDataset,
  balanceDataset,
  exportAsJson,
  exportAsCsv,
  downloadData,
} from '@/services/imbalancedDataService';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

type FormValues = {
  classes: number;
  imbalanceRatio: number;
  totalSamples: number;
  balancingMethod: 'undersample' | 'oversample' | 'smote' | 'none';
  targetRatio: number;
};

const ImbalancedData = () => {
  const [originalDataset, setOriginalDataset] = useState<DatasetInfo | null>(null);
  const [balancedDataset, setBalancedDataset] = useState<DatasetInfo | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      classes: 4,
      imbalanceRatio: 5,
      totalSamples: 1000,
      balancingMethod: 'none',
      targetRatio: 1.2,
    },
  });

  // Generate sample dataset on mount
  useEffect(() => {
    generateDataset();
  }, []);

  const generateDataset = (customParams?: Partial<FormValues>) => {
    const params = {
      classes: customParams?.classes || watch('classes'),
      imbalanceRatio: customParams?.imbalanceRatio || watch('imbalanceRatio'),
      totalSamples: customParams?.totalSamples || watch('totalSamples'),
    };

    const dataset = generateSampleDataset(
      params.classes,
      params.imbalanceRatio,
      params.totalSamples
    );
    
    setOriginalDataset(dataset);
    setBalancedDataset(null);
  };

  const handleBalanceDataset = (data: FormValues) => {
    if (!originalDataset) return;

    const options: BalancingOptions = {
      method: data.balancingMethod,
      targetRatio: data.targetRatio,
    };

    const balanced = balanceDataset(originalDataset, options);
    setBalancedDataset(balanced);

    toast.success(`Applied ${data.balancingMethod} balancing technique`);
  };

  const handleExport = (dataset: DatasetInfo, format: 'json' | 'csv') => {
    const filename = `imbalanced-data-${format === 'json' ? 'json' : 'csv'}`;
    const data = format === 'json' ? exportAsJson(dataset) : exportAsCsv(dataset);
    
    downloadData(data, filename, format);
    toast.success(`Exported data as ${format.toUpperCase()}`);
  };

  // Function to handle file upload
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
      
      // Process data into the format expected by the app
      const processedData = processUploadedData(parsedData);
      setOriginalDataset(processedData);
      setBalancedDataset(null);
      
      toast.success('File processed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error((error as Error).message || 'Failed to process file');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Process uploaded data into the expected format
  const processUploadedData = (data: any): DatasetInfo => {
    // Handle array format (most common case)
    if (Array.isArray(data)) {
      // Try to detect class distribution from data
      // Assuming there's a "class" or "label" field in the data
      const classField = detectClassField(data);
      
      if (!classField) {
        throw new Error('Could not identify class field in the data');
      }
      
      // Count occurrences of each class
      const classCounts: Record<string, number> = {};
      data.forEach(item => {
        const className = String(item[classField]);
        classCounts[className] = (classCounts[className] || 0) + 1;
      });
      
      // Calculate total samples
      const totalSamples = Object.values(classCounts).reduce((sum, count) => sum + count, 0);
      
      // Create class distribution array
      const classColors = [
        '#4f46e5', '#0891b2', '#16a34a', '#ca8a04', 
        '#dc2626', '#9333ea', '#2563eb', '#059669', 
        '#d97706', '#db2777'
      ];
      
      const classes: ClassDistribution[] = Object.entries(classCounts).map(([className, count], index) => ({
        className,
        count,
        percentage: parseFloat(((count / totalSamples) * 100).toFixed(1)),
        color: classColors[index % classColors.length]
      }));
      
      // Sort by count (descending)
      classes.sort((a, b) => b.count - a.count);
      
      // Calculate imbalance ratio
      const maxClassSize = classes[0].count;
      const minClassSize = classes[classes.length - 1].count;
      const imbalanceRatio = parseFloat((maxClassSize / minClassSize).toFixed(2));
      
      return {
        totalSamples,
        classes,
        isImbalanced: imbalanceRatio > 1.5,
        imbalanceRatio
      };
    } else if (data && typeof data === 'object' && 'classes' in data && 'totalSamples' in data) {
      // The uploaded data is already in the expected format
      return data as DatasetInfo;
    } else {
      throw new Error('Unsupported data format. Please check the file structure.');
    }
  };

  // Helper to detect which field represents the class label
  const detectClassField = (data: any[]): string | null => {
    if (data.length === 0) return null;
    
    // Common class field names
    const possibleClassFields = ['class', 'label', 'category', 'target', 'y', 'Class', 'Label', 'Category', 'Target'];
    
    // Check if any of these fields exist in the data
    const firstItem = data[0];
    for (const field of possibleClassFields) {
      if (field in firstItem) {
        return field;
      }
    }
    
    // If no common class field is found, look for fields with categorical values
    // that have a small number of unique values compared to the dataset size
    const fields = Object.keys(firstItem);
    
    for (const field of fields) {
      const uniqueValues = new Set(data.map(item => item[field])).size;
      
      // If the field has a reasonable number of unique values compared to dataset size
      // it might be a class field (heuristic)
      if (uniqueValues > 1 && uniqueValues <= Math.min(10, data.length / 5)) {
        return field;
      }
    }
    
    return null;
  };

  // Prepare chart data for visualization
  const prepareChartData = (dataset: DatasetInfo) => {
    return {
      labels: dataset.classes.map(c => c.className),
      datasets: [
        {
          label: 'Class Distribution',
          data: dataset.classes.map(c => c.count),
          backgroundColor: dataset.classes.map(c => c.color),
          borderColor: dataset.classes.map(c => c.color.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="container mx-auto py-6 space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Imbalanced Data Handling</h1>
        <p className="text-muted-foreground mt-2">
          Balance your datasets using various techniques to improve model performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dataset Controls</CardTitle>
            <CardDescription>Configure your imbalanced dataset parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="generate">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate">Generate</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="space-y-4">
                <form id="dataset-form" onSubmit={handleSubmit(generateDataset)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="classes">Number of Classes</Label>
                    <Input
                      id="classes"
                      type="number"
                      min={2}
                      max={10}
                      {...register('classes', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="imbalanceRatio">Imbalance Ratio</Label>
                      <span className="text-sm text-muted-foreground">{watch('imbalanceRatio')}:1</span>
                    </div>
                    <Slider
                      id="imbalanceRatio"
                      min={1}
                      max={20}
                      step={0.5}
                      defaultValue={[watch('imbalanceRatio')]}
                      onValueChange={(values) => setValue('imbalanceRatio', values[0])}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ratio between the majority and minority class
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalSamples">Total Samples</Label>
                    <Input
                      id="totalSamples"
                      type="number"
                      min={100}
                      max={10000}
                      step={100}
                      {...register('totalSamples', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Dataset
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <FileUploader
                  onFileUpload={handleFileUpload}
                  accept=".csv, .json"
                  title="Upload Dataset"
                  description="Upload a CSV or JSON file with your imbalanced dataset"
                />
                
                {uploadedFile && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <p className="font-medium">File: {uploadedFile.name}</p>
                    <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 border-t">
              <form id="balance-form" onSubmit={handleSubmit(handleBalanceDataset)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Balancing Method</Label>
                  <RadioGroup
                    defaultValue={watch('balancingMethod')}
                    onValueChange={(value) => 
                      setValue('balancingMethod', value as 'undersample' | 'oversample' | 'smote' | 'none')
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">None</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="undersample" id="undersample" />
                      <Label htmlFor="undersample">Undersampling</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="oversample" id="oversample" />
                      <Label htmlFor="oversample">Oversampling</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="smote" id="smote" />
                      <Label htmlFor="smote">SMOTE</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="targetRatio">Target Ratio</Label>
                    <span className="text-sm text-muted-foreground">{watch('targetRatio')}:1</span>
                  </div>
                  <Slider
                    id="targetRatio"
                    min={1}
                    max={3}
                    step={0.1}
                    defaultValue={[watch('targetRatio')]}
                    onValueChange={(values) => setValue('targetRatio', values[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Target imbalance ratio after balancing
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!originalDataset}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Apply Balancing
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Right column - Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Class Distribution</CardTitle>
              <CardDescription>Visualize the balance between different classes</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
              >
                <PieChart className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <BarChart className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="original">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="original">Original Dataset</TabsTrigger>
                <TabsTrigger value="balanced" disabled={!balancedDataset}>Balanced Dataset</TabsTrigger>
              </TabsList>
              
              <TabsContent value="original" className="pt-4">
                {originalDataset ? (
                  <div className="space-y-6">
                    <div className="h-[300px] flex items-center justify-center">
                      {chartType === 'pie' ? (
                        <Pie data={prepareChartData(originalDataset)} />
                      ) : (
                        <Bar
                          data={prepareChartData(originalDataset)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Dataset Summary</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="space-y-1">
                          <p><span className="font-medium">Total Samples:</span> {originalDataset.totalSamples}</p>
                          <p><span className="font-medium">Number of Classes:</span> {originalDataset.classes.length}</p>
                        </div>
                        <div className="space-y-1">
                          <p><span className="font-medium">Imbalance Ratio:</span> {originalDataset.imbalanceRatio}:1</p>
                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            <span className={originalDataset.isImbalanced ? 'text-orange-500' : 'text-green-500'}>
                              {originalDataset.isImbalanced ? 'Imbalanced' : 'Balanced'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-medium mb-2">Class Distribution</h3>
                      <div className="grid grid-cols-4 gap-2 text-sm font-medium mb-2">
                        <div>Class</div>
                        <div>Count</div>
                        <div>Percentage</div>
                        <div></div>
                      </div>
                      <div className="space-y-2">
                        {originalDataset.classes.map((cls) => (
                          <div key={cls.className} className="grid grid-cols-4 gap-2 text-sm items-center">
                            <div>{cls.className}</div>
                            <div>{cls.count}</div>
                            <div>{cls.percentage}%</div>
                            <div className="flex items-center">
                              <div 
                                className="h-3 rounded" 
                                style={{
                                  backgroundColor: cls.color,
                                  width: `${Math.max(cls.percentage, 5)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleExport(originalDataset, 'csv')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport(originalDataset, 'json')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <BarChart className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Dataset Generated</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Configure the parameters and generate a dataset to visualize the class distribution.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="balanced" className="pt-4">
                {balancedDataset ? (
                  <div className="space-y-6">
                    <div className="h-[300px] flex items-center justify-center">
                      {chartType === 'pie' ? (
                        <Pie data={prepareChartData(balancedDataset)} />
                      ) : (
                        <Bar
                          data={prepareChartData(balancedDataset)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg mb-2">Balanced Dataset Summary</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="space-y-1">
                          <p><span className="font-medium">Total Samples:</span> {balancedDataset.totalSamples}</p>
                          <p><span className="font-medium">Number of Classes:</span> {balancedDataset.classes.length}</p>
                        </div>
                        <div className="space-y-1">
                          <p><span className="font-medium">New Imbalance Ratio:</span> {balancedDataset.imbalanceRatio}:1</p>
                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            <span className={balancedDataset.isImbalanced ? 'text-orange-500' : 'text-green-500'}>
                              {balancedDataset.isImbalanced ? 'Still Imbalanced' : 'Balanced'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <h3 className="font-medium mb-2">Balanced Class Distribution</h3>
                      <div className="grid grid-cols-4 gap-2 text-sm font-medium mb-2">
                        <div>Class</div>
                        <div>Count</div>
                        <div>Percentage</div>
                        <div></div>
                      </div>
                      <div className="space-y-2">
                        {balancedDataset.classes.map((cls) => (
                          <div key={cls.className} className="grid grid-cols-4 gap-2 text-sm items-center">
                            <div>{cls.className}</div>
                            <div>{cls.count}</div>
                            <div>{cls.percentage}%</div>
                            <div className="flex items-center">
                              <div 
                                className="h-3 rounded" 
                                style={{
                                  backgroundColor: cls.color,
                                  width: `${Math.max(cls.percentage, 5)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleExport(balancedDataset, 'csv')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport(balancedDataset, 'json')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">Apply balancing to see results</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ImbalancedData;
