import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploader from '@/components/FileUploader';
import { formatData } from '@/utils/fileUploadUtils';
import { toast } from 'sonner';
import { PlusCircle, FileInput, Download, Clock, Wand2 } from 'lucide-react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import DataGenerationOptions from '@/components/DataGenerationOptions';
import SyntheticDataGenerator from '@/components/SyntheticDataGenerator';
import TimeSeriesAugmentor from '@/components/TimeSeriesAugmentor';
import UserGuideDataAugmentation from '@/components/ui/UserGuideDataAugmentation';
import { augmentDataWithAI, applyAugmentation } from '@/services/dataAugmentationService';

const DataAugmentation = () => {
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [augmentedData, setAugmentedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    noise: {
      intensity: 0.3,
      distribution: 'gaussian',
      fields: []
    },
    scaling: {
      factor: 1.5,
      fields: []
    },
    outliers: {
      percentage: 10,
      fields: []
    },
    missing: {
      percentage: 5,
      fields: []
    },
    categorical: {
      multiplier: 2,
      fields: []
    }
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [timeSeriesSettings, setTimeSeriesSettings] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    interval: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    pattern: 'seasonal',
    trendStrength: 0.5,
    seasonalityStrength: 0.7,
    noiseLevel: 0.2,
    outlierPercentage: 5
  });

  const handleFileUpload = (data: any[]) => {
    setUploadedData(data);
    if (data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      
      const numericFields = cols.filter(col => 
        typeof data[0][col] === 'number' || !isNaN(Number(data[0][col]))
      );
      
      const categoricalFields = cols.filter(col => 
        typeof data[0][col] === 'string' && isNaN(Number(data[0][col]))
      );
      
      setSettings(prev => ({
        ...prev,
        noise: { ...prev.noise, fields: numericFields },
        scaling: { ...prev.scaling, fields: numericFields },
        outliers: { ...prev.outliers, fields: numericFields },
        missing: { ...prev.missing, fields: cols },
        categorical: { ...prev.categorical, fields: categoricalFields }
      }));
      
      toast.success(`Uploaded ${data.length} records with ${cols.length} columns`);
    }
  };

  const handleAugment = async (method: string) => {
    if (uploadedData.length === 0) {
      toast.error("Please upload data first");
      return;
    }
    
    setLoading(true);
    try {
      const apiKey = localStorage.getItem('openai-api-key');
      
      let result: any[] = [];
      
      if (method === 'timeseries') {
        result = await applyAugmentation(
          apiKey,
          uploadedData,
          method,
          settings,
          aiPrompt,
          timeSeriesSettings.interval
        );
      } else {
        result = await applyAugmentation(
          apiKey,
          uploadedData,
          method,
          settings,
          aiPrompt
        );
      }
      
      setAugmentedData(result);
    } catch (error) {
      console.error("Error during augmentation:", error);
      toast.error("Failed to augment data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (augmentedData.length === 0) {
      toast.error("No augmented data to export");
      return;
    }
    
    setExporting(true);
    setTimeout(() => {
      const formattedData = formatData(augmentedData, 'json');
      const blob = new Blob([formattedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `augmented_data_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExporting(false);
      toast.success("Augmented data exported successfully");
    }, 500);
  };

  const handleSettingsChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleFieldSelectionChange = (category: string, selectedFields: string[]) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        fields: selectedFields
      }
    }));
  };

  const handleTimeSeriesSettingChange = (field: string, value: any) => {
    setTimeSeriesSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Data Augmentation</h1>
          <p className="text-muted-foreground">
            Enhance your datasets with AI-powered data augmentation techniques.
          </p>
        </div>

        <ApiKeyRequirement showUserGuide={<UserGuideDataAugmentation />}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="general" onClick={() => setActiveTab('general')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="noise" onClick={() => setActiveTab('noise')}>
                <Wand2 className="mr-2 h-4 w-4" />
                Noise
              </TabsTrigger>
              <TabsTrigger value="categorical" onClick={() => setActiveTab('categorical')}>
                <FileInput className="mr-2 h-4 w-4" />
                Categorical
              </TabsTrigger>
              <TabsTrigger value="timeseries" onClick={() => setActiveTab('timeseries')}>
                <Clock className="mr-2 h-4 w-4" />
                Time Series
              </TabsTrigger>
              <TabsTrigger value="results">
                <Download className="mr-2 h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Upload Data</CardTitle>
                    <CardDescription>
                      Upload your dataset to begin augmentation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUploader 
                      onFileUpload={handleFileUpload} 
                      accept=".csv,.json"
                    />
                    
                    {uploadedData.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          Uploaded {uploadedData.length} records with {columns.length} columns
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>AI-Powered Augmentation</CardTitle>
                    <CardDescription>
                      Use AI to intelligently augment your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">
                          AI Prompt (Optional)
                        </label>
                        <textarea 
                          className="w-full mt-1 p-2 border rounded-md h-24"
                          placeholder="Describe how you want the AI to augment your data..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleAugment('general')}
                        disabled={loading || uploadedData.length === 0}
                        className="w-full"
                      >
                        {loading ? 'Generating...' : 'Generate Augmented Data'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <DataGenerationOptions 
                isLoading={loading}
                handleAugment={(method: string) => handleAugment(method)}
              />
            </TabsContent>
            
            <TabsContent value="noise" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Noise Augmentation</CardTitle>
                  <CardDescription>
                    Add controlled noise to numeric fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Noise Intensity</label>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1" 
                          step="0.1"
                          value={settings.noise.intensity}
                          onChange={(e) => handleSettingsChange('noise', 'intensity', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Distribution</label>
                        <select 
                          className="w-full mt-1 p-2 border rounded-md"
                          value={settings.noise.distribution}
                          onChange={(e) => handleSettingsChange('noise', 'distribution', e.target.value)}
                        >
                          <option value="gaussian">Gaussian</option>
                          <option value="uniform">Uniform</option>
                          <option value="poisson">Poisson</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Fields to Apply Noise</label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {columns.filter(col => 
                          typeof uploadedData[0]?.[col] === 'number' || !isNaN(Number(uploadedData[0]?.[col]))
                        ).map(col => (
                          <label key={col} className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              checked={settings.noise.fields.includes(col)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleFieldSelectionChange('noise', [...settings.noise.fields, col]);
                                } else {
                                  handleFieldSelectionChange('noise', settings.noise.fields.filter(f => f !== col));
                                }
                              }}
                            />
                            <span className="text-sm">{col}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleAugment('noise')}
                      disabled={loading || uploadedData.length === 0 || settings.noise.fields.length === 0}
                      className="w-full"
                    >
                      {loading ? 'Applying Noise...' : 'Apply Noise Augmentation'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="categorical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Categorical Augmentation</CardTitle>
                  <CardDescription>
                    Generate variations of categorical data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Multiplier</label>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="0.5"
                        value={settings.categorical.multiplier}
                        onChange={(e) => handleSettingsChange('categorical', 'multiplier', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Few Variations</span>
                        <span>Many Variations</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Categorical Fields</label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {columns.filter(col => 
                          typeof uploadedData[0]?.[col] === 'string' && isNaN(Number(uploadedData[0]?.[col]))
                        ).map(col => (
                          <label key={col} className="flex items-center space-x-2">
                            <input 
                              type="checkbox"
                              checked={settings.categorical.fields.includes(col)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleFieldSelectionChange('categorical', [...settings.categorical.fields, col]);
                                } else {
                                  handleFieldSelectionChange('categorical', settings.categorical.fields.filter(f => f !== col));
                                }
                              }}
                            />
                            <span className="text-sm">{col}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleAugment('categorical')}
                      disabled={loading || uploadedData.length === 0 || settings.categorical.fields.length === 0}
                      className="w-full"
                    >
                      {loading ? 'Generating...' : 'Generate Categorical Variations'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="timeseries" className="space-y-6">
              <TimeSeriesAugmentor 
                isLoading={loading}
                handleAugment={() => handleAugment('timeseries')}
                timeSeriesSettings={timeSeriesSettings}
                handleSettingChange={handleTimeSeriesSettingChange}
              />
            </TabsContent>
            
            <TabsContent value="results" className="space-y-6">
              <SyntheticDataGenerator 
                generatedData={augmentedData}
                isLoading={loading}
                handleExport={handleExport}
                isExporting={exporting}
              />
            </TabsContent>
          </Tabs>
        </ApiKeyRequirement>
      </div>
    </div>
  );
};

export default DataAugmentation;
