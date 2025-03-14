
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FileUploader from '@/components/FileUploader';
import { 
  ArrowRight, 
  BarChart3, 
  Download, 
  Upload, 
  PlusCircle, 
  Trash2, 
  AlertCircle
} from 'lucide-react';

const augmentationMethods = [
  { id: 'noise', label: 'Add Noise', description: 'Add random noise to numeric fields' },
  { id: 'scaling', label: 'Scaling', description: 'Scale numeric values by a factor' },
  { id: 'outliers', label: 'Generate Outliers', description: 'Add outlier data points' },
  { id: 'missing', label: 'Simulate Missing Data', description: 'Randomly remove values' },
  { id: 'categorical', label: 'Categorical Oversampling', description: 'Oversample certain categories' },
  { id: 'text', label: 'Text Augmentation', description: 'Modify text fields with synonyms, paraphrasing' },
];

const DataAugmentationPage: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['noise']);
  const [augmentationSettings, setAugmentationSettings] = useState({
    noise: {
      intensity: 0.2,
      fields: ['temperature', 'humidity', 'pressure'],
      distribution: 'gaussian'
    },
    scaling: {
      factor: 1.5,
      fields: ['temperature', 'pressure']
    },
    outliers: {
      percentage: 5,
      fields: ['temperature', 'humidity']
    },
    missing: {
      percentage: 10,
      fields: ['humidity', 'pressure']
    },
    categorical: {
      categories: ['sunny', 'rainy'],
      multiplier: 2
    },
    text: {
      method: 'synonym',
      fields: ['description']
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [augmentedData, setAugmentedData] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState('original');
  
  const handleFileUpload = (file: File) => {
    setSourceFile(file);
    
    // Simulate reading the file
    setTimeout(() => {
      const mockData = `timestamp,temperature,humidity,pressure,weather,description
2023-01-01 00:00:00,22.5,65,1013.2,sunny,"Clear sky, light breeze"
2023-01-01 01:00:00,21.8,67,1013.0,sunny,"Clear conditions"
2023-01-01 02:00:00,21.2,70,1012.8,cloudy,"Partly cloudy"
2023-01-01 03:00:00,20.5,72,1012.5,cloudy,"Increasing clouds"
2023-01-01 04:00:00,20.1,75,1012.3,rainy,"Light rain starting"
...and 95 more rows`;
      
      setPreviewData(mockData);
      toast.success('File uploaded successfully');
    }, 1000);
  };
  
  const toggleMethod = (methodId: string) => {
    if (selectedMethods.includes(methodId)) {
      setSelectedMethods(selectedMethods.filter(id => id !== methodId));
    } else {
      setSelectedMethods([...selectedMethods, methodId]);
    }
  };
  
  const updateSetting = (method: string, setting: string, value: any) => {
    setAugmentationSettings(prev => ({
      ...prev,
      [method]: {
        ...prev[method as keyof typeof prev],
        [setting]: value
      }
    }));
  };
  
  const handleProcessData = () => {
    if (!sourceFile) {
      toast.error('Please upload a file first');
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsProcessing(false);
      
      const mockAugmentedData = `timestamp,temperature,humidity,pressure,weather,description
2023-01-01 00:00:00,23.1,66.3,1014.5,sunny,"Clear sky, gentle breeze"
2023-01-01 00:00:00,22.0,64.2,1012.9,sunny,"Clear sky, light breeze"
2023-01-01 00:00:00,22.9,67.1,1015.0,sunny,"Clear sky, calm conditions"
2023-01-01 01:00:00,20.9,68.2,1011.8,sunny,"Clear conditions"
2023-01-01 01:00:00,22.4,65.9,1014.1,sunny,"Clear conditions with good visibility"
2023-01-01 02:00:00,null,72.5,1013.6,cloudy,"Partly cloudy"
2023-01-01 02:00:00,20.8,69.4,1011.5,cloudy,"Some clouds forming"
2023-01-01 03:00:00,19.9,73.1,1010.2,cloudy,"Increasing clouds"
2023-01-01 03:00:00,21.2,70.8,1014.0,cloudy,"Clouds developing"
2023-01-01 04:00:00,20.5,77.2,1013.5,rainy,"Light rain beginning"
...and 195 more rows`;
      
      setAugmentedData(mockAugmentedData);
      setPreviewTab('augmented');
      toast.success('Data augmentation completed');
    }, 2500);
  };
  
  const handleDownload = () => {
    if (!augmentedData) return;
    
    const blob = new Blob([augmentedData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `augmented_data_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-2 mb-8">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Data Augmentation
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Enhance your datasets with intelligent augmentation techniques powered by AI.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Source Data</CardTitle>
                <CardDescription>
                  Upload the dataset you want to augment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onFileUpload={handleFileUpload}
                  accept=".csv,.json,.xlsx,.parquet"
                  title="Upload Dataset"
                  description="Upload the file you want to augment"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Augmentation Methods</CardTitle>
                <CardDescription>
                  Select and configure data augmentation techniques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {augmentationMethods.map((method) => (
                    <div 
                      key={method.id}
                      className={`
                        border rounded-lg p-4 transition-all cursor-pointer
                        ${selectedMethods.includes(method.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/50'}
                      `}
                      onClick={() => toggleMethod(method.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          checked={selectedMethods.includes(method.id)}
                          onCheckedChange={() => toggleMethod(method.id)}
                          className="mt-1"
                        />
                        <div>
                          <h3 className="font-medium">{method.label}</h3>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6 mt-6">
                  {selectedMethods.map((methodId) => {
                    const method = augmentationMethods.find(m => m.id === methodId);
                    if (!method) return null;
                    
                    return (
                      <Card key={methodId} className="border-primary/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{method.label} Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {methodId === 'noise' && (
                            <div className="space-y-4">
                              <div>
                                <Label>Noise Intensity: {augmentationSettings.noise.intensity}</Label>
                                <Slider
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={[augmentationSettings.noise.intensity]}
                                  onValueChange={(value) => updateSetting('noise', 'intensity', value[0])}
                                />
                              </div>
                              <div>
                                <Label>Distribution</Label>
                                <Select
                                  value={augmentationSettings.noise.distribution}
                                  onValueChange={(value) => updateSetting('noise', 'distribution', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gaussian">Gaussian</SelectItem>
                                    <SelectItem value="uniform">Uniform</SelectItem>
                                    <SelectItem value="laplace">Laplace</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          
                          {methodId === 'scaling' && (
                            <div className="space-y-4">
                              <div>
                                <Label>Scaling Factor: {augmentationSettings.scaling.factor}</Label>
                                <Slider
                                  min={0.1}
                                  max={5}
                                  step={0.1}
                                  value={[augmentationSettings.scaling.factor]}
                                  onValueChange={(value) => updateSetting('scaling', 'factor', value[0])}
                                />
                              </div>
                            </div>
                          )}
                          
                          {methodId === 'outliers' && (
                            <div className="space-y-4">
                              <div>
                                <Label>Percentage: {augmentationSettings.outliers.percentage}%</Label>
                                <Slider
                                  min={1}
                                  max={20}
                                  step={1}
                                  value={[augmentationSettings.outliers.percentage]}
                                  onValueChange={(value) => updateSetting('outliers', 'percentage', value[0])}
                                />
                              </div>
                            </div>
                          )}
                          
                          {methodId === 'missing' && (
                            <div className="space-y-4">
                              <div>
                                <Label>Missing Percentage: {augmentationSettings.missing.percentage}%</Label>
                                <Slider
                                  min={1}
                                  max={50}
                                  step={1}
                                  value={[augmentationSettings.missing.percentage]}
                                  onValueChange={(value) => updateSetting('missing', 'percentage', value[0])}
                                />
                              </div>
                            </div>
                          )}
                          
                          {methodId === 'categorical' && (
                            <div className="space-y-4">
                              <div>
                                <Label>Multiplier: {augmentationSettings.categorical.multiplier}x</Label>
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[augmentationSettings.categorical.multiplier]}
                                  onValueChange={(value) => updateSetting('categorical', 'multiplier', value[0])}
                                />
                              </div>
                            </div>
                          )}
                          
                          {methodId === 'text' && (
                            <div className="space-y-4">
                              <div>
                                <Label>Text Augmentation Method</Label>
                                <Select
                                  value={augmentationSettings.text.method}
                                  onValueChange={(value) => updateSetting('text', 'method', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="synonym">Synonym Replacement</SelectItem>
                                    <SelectItem value="paraphrase">Paraphrasing</SelectItem>
                                    <SelectItem value="translation">Back Translation</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleProcessData}
                  disabled={!sourceFile || isProcessing}
                  className="w-full gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Augment Data
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                {sourceFile ? `Showing data from ${sourceFile.name}` : 'Upload a file to preview data'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(previewData || augmentedData) ? (
                <Tabs value={previewTab} onValueChange={setPreviewTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="augmented" disabled={!augmentedData}>Augmented</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="original">
                    <pre className="bg-muted/30 p-4 rounded-md overflow-auto h-[400px] text-xs font-mono whitespace-pre">
                      {previewData}
                    </pre>
                  </TabsContent>
                  
                  <TabsContent value="augmented">
                    <pre className="bg-muted/30 p-4 rounded-md overflow-auto h-[400px] text-xs font-mono whitespace-pre">
                      {augmentedData}
                    </pre>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Upload className="h-12 w-12 mb-4 text-muted" />
                  <p>Upload a file to preview data</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {augmentedData && (
                <Button onClick={handleDownload} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download Augmented Data
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataAugmentationPage;
