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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FileUploader from '@/components/FileUploader';
import {
  Play,
  Download,
  Plus,
  Minus,
  Database,
  Copy,
  BarChart3
} from 'lucide-react';
import { 
  generateSyntheticData, 
  downloadSyntheticData, 
  saveSyntheticDataToDatabase,
  type DataField,
  type SyntheticDataOptions 
} from '@/services/syntheticDataService';

const dataTypes = [
  { value: 'personal', label: 'Personal Information' },
  { value: 'financial', label: 'Financial Data' },
  { value: 'healthcare', label: 'Healthcare Records' },
  { value: 'ecommerce', label: 'E-commerce Transactions' },
  { value: 'custom', label: 'Custom Schema' },
];

const distributionTypes = [
  { value: 'normal', label: 'Normal Distribution' },
  { value: 'uniform', label: 'Uniform Distribution' },
  { value: 'poisson', label: 'Poisson Distribution' },
  { value: 'gamma', label: 'Gamma Distribution' },
  { value: 'custom', label: 'Custom Distribution' },
];

const SyntheticData: React.FC = () => {
  const [selectedDataType, setSelectedDataType] = useState('personal');
  const [selectedDistribution, setSelectedDistribution] = useState('normal');
  const [rowCount, setRowCount] = useState(1000);
  const [includeNulls, setIncludeNulls] = useState(false);
  const [nullPercentage, setNullPercentage] = useState(5);
  const [customSchema, setCustomSchema] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSample, setGeneratedSample] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState('csv');
  
  // Using a simple form state example - would expand in a real implementation
  const [fields, setFields] = useState<DataField[]>([
    { name: 'id', type: 'id', included: true },
    { name: 'full_name', type: 'name', included: true },
    { name: 'email', type: 'email', included: true },
    { name: 'age', type: 'number', included: true },
    { name: 'address', type: 'address', included: true },
    { name: 'phone_number', type: 'phone', included: true },
  ]);

  const handleFileUpload = (file: File) => {
    toast.success(`File uploaded: ${file.name}`);
    // In a real app, would process the schema from the file
    setCustomSchema(`Detected schema from ${file.name}\n- id (integer)\n- name (string)\n- email (string)\n- timestamp (datetime)\n- value (float)`);
  };

  const toggleFieldSelection = (index: number) => {
    const updatedFields = [...fields];
    updatedFields[index].included = !updatedFields[index].included;
    setFields(updatedFields);
  };

  const handleAddField = () => {
    setFields([...fields, { name: `field_${fields.length + 1}`, type: 'string', included: true }]);
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  const handleGenerateData = async () => {
    setIsGenerating(true);
    
    try {
      // Build options object for data generation
      const options: SyntheticDataOptions = {
        dataType: selectedDataType,
        fields,
        rowCount,
        distributionType: selectedDistribution,
        includeNulls,
        nullPercentage,
        outputFormat,
        customSchema: selectedDataType === 'custom' ? customSchema : undefined
      };
      
      // Call service to generate data
      const generatedData = await generateSyntheticData(options);
      setGeneratedSample(generatedData);
      
      toast.success(`Successfully generated ${rowCount} rows of synthetic data`);
    } catch (error) {
      console.error('Error generating data:', error);
      toast.error('Failed to generate data');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedSample) {
      navigator.clipboard.writeText(generatedSample);
      toast.success('Copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (!generatedSample) return;
    downloadSyntheticData(generatedSample, outputFormat);
  };

  const handleSaveToDatabase = async () => {
    if (!generatedSample) return;
    
    try {
      await saveSyntheticDataToDatabase(generatedSample);
    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Failed to save data to database');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-2 mb-8">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Synthetic Data Generation
        </motion.h1>
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Generate high-quality synthetic data that preserves statistical properties and relationships.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Define the structure and properties of your synthetic data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="template" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="template">Use Template</TabsTrigger>
                  <TabsTrigger value="custom">Custom Schema</TabsTrigger>
                </TabsList>
                
                <TabsContent value="template" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dataType">Data Type</Label>
                      <Select
                        value={selectedDataType}
                        onValueChange={setSelectedDataType}
                      >
                        <SelectTrigger id="dataType" className="w-full">
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Fields</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddField}
                          className="h-8 gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Field
                        </Button>
                      </div>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {fields.map((field, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                            <Checkbox 
                              id={`field-${index}`}
                              checked={field.included}
                              onCheckedChange={() => toggleFieldSelection(index)}
                            />
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <Input 
                                  value={field.name} 
                                  onChange={(e) => {
                                    const updated = [...fields];
                                    updated[index].name = e.target.value;
                                    setFields(updated);
                                  }}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Select 
                                  value={field.type}
                                  onValueChange={(value) => {
                                    const updated = [...fields];
                                    updated[index].type = value;
                                    setFields(updated);
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="id">ID</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="address">Address</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                    <SelectItem value="string">String</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveField(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Upload Schema File</Label>
                      <div className="mt-2">
                        <FileUploader 
                          onFileUpload={handleFileUpload}
                          accept=".csv,.json,.yaml,.sql"
                          maxSize={5}
                          title="Upload Schema"
                          description="Upload a schema file to define your data structure"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="customSchema">Define Custom Schema</Label>
                      <Textarea
                        id="customSchema"
                        value={customSchema}
                        onChange={(e) => setCustomSchema(e.target.value)}
                        placeholder="Define your schema here or upload a file..."
                        className="min-h-[150px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Distribution</CardTitle>
              <CardDescription>
                Configure statistical properties and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="distribution">Distribution Type</Label>
                    <Select
                      value={selectedDistribution}
                      onValueChange={setSelectedDistribution}
                    >
                      <SelectTrigger id="distribution">
                        <SelectValue placeholder="Select distribution" />
                      </SelectTrigger>
                      <SelectContent>
                        {distributionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rowCount">Row Count</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="rowCount"
                        type="number"
                        value={rowCount}
                        onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
                        min={1}
                        max={1000000}
                      />
                      <Select
                        value={outputFormat}
                        onValueChange={setOutputFormat}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="parquet">Parquet</SelectItem>
                          <SelectItem value="sql">SQL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeNulls" 
                      checked={includeNulls}
                      onCheckedChange={(checked) => setIncludeNulls(checked as boolean)}
                    />
                    <Label 
                      htmlFor="includeNulls" 
                      className="cursor-pointer"
                    >
                      Include NULL values
                    </Label>
                  </div>
                  
                  {includeNulls && (
                    <div className="pl-6">
                      <Label htmlFor="nullPercentage" className="mb-2 block">
                        NULL Percentage: {nullPercentage}%
                      </Label>
                      <Slider
                        id="nullPercentage"
                        min={0}
                        max={50}
                        step={1}
                        value={[nullPercentage]}
                        onValueChange={(value) => setNullPercentage(value[0])}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateData}
                disabled={isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Generate Synthetic Data
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Preview</span>
                {generatedSample && (
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleCopyToClipboard}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleDownload}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Sample of generated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedSample ? (
                <pre className="bg-muted/30 p-4 rounded-md overflow-auto max-h-[600px] text-xs font-mono whitespace-pre text-left">
                  {generatedSample}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-4 text-muted" />
                  <p>Generate data to see a preview</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleSaveToDatabase}
                disabled={!generatedSample}
              >
                <Database className="h-4 w-4" />
                Save to Database
              </Button>
              {generatedSample && (
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SyntheticData;

