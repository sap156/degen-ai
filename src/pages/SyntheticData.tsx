import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  DataField, 
  SyntheticDataOptions, 
  defaultSchemas, 
  generateSyntheticData, 
  downloadSyntheticData, 
  saveSyntheticDataToDatabase,
  detectSchemaFromData
} from '@/services/syntheticDataService';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { FileInput } from '@/components/ui/file-input';
import { Download, Save, Loader2, Upload } from 'lucide-react';

const SyntheticData: React.FC = () => {
  const { apiKey } = useApiKey();
  const [options, setOptions] = useState<SyntheticDataOptions>({
    dataType: 'user',
    fields: defaultSchemas.user,
    rowCount: 10,
    distributionType: 'realistic',
    includeNulls: false,
    nullPercentage: 5,
    outputFormat: 'json',
    customSchema: '',
    aiPrompt: '',
    uploadedData: [],
    onProgress: () => {}
  });
  const [generatedData, setGeneratedData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Load schema from local storage on component mount
  useEffect(() => {
    const storedSchema = localStorage.getItem('customSchema');
    if (storedSchema) {
      setOptions(prevOptions => ({
        ...prevOptions,
        dataType: 'custom',
        customSchema: storedSchema,
        fields: defaultSchemas.custom
      }));
    }
  }, []);

  // Function to handle file upload and schema detection
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        const detectedFields = detectSchemaFromData(data);
        setOptions(prevOptions => ({
          ...prevOptions,
          dataType: 'custom',
          fields: detectedFields,
          uploadedData: data
        }));
        toast.success('Schema detected from uploaded data');
      } else {
        toast.error('Invalid JSON file format. Please upload a JSON array.');
      }
    } catch (error) {
      console.error('Error reading or parsing file:', error);
      toast.error('Error reading or parsing file. Please upload a valid JSON file.');
    }
  }, []);

  // Function to handle data generation
  const handleGenerateData = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedData(null);

    // Validate that at least one field is included
    if (options.fields.filter(field => field.included).length === 0) {
      toast.error('Please select at least one field to include in your data.');
      setIsGenerating(false);
      return;
    }

    try {
      const result = await generateSyntheticData(
        {
          ...options,
          onProgress: (p: number) => setProgress(p)
        },
        apiKey
      );
      setGeneratedData(result);
      toast.success('Data generated successfully');
    } catch (error) {
      console.error('Error generating data:', error);
      toast.error(`Failed to generate data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // Function to handle schema selection
  const handleSchemaSelect = (value: string) => {
    const newFields = defaultSchemas[value] || [];
    setOptions(prevOptions => ({
      ...prevOptions,
      dataType: value,
      fields: newFields
    }));
  };

  // Function to handle custom schema input
  const handleCustomSchemaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setOptions(prevOptions => ({
      ...prevOptions,
      customSchema: value
    }));
    localStorage.setItem('customSchema', value);
  };

  // Function to handle field inclusion changes
  const handleFieldIncludedChange = (index: number, checked: boolean) => {
    const updatedFields = [...options.fields];
    updatedFields[index].included = checked;
    setOptions(prevOptions => ({
      ...prevOptions,
      fields: updatedFields
    }));
  };

  // Function to handle field name changes
  const handleFieldNameChange = (index: number, value: string) => {
    const updatedFields = [...options.fields];
    updatedFields[index].name = value;
    setOptions(prevOptions => ({
      ...prevOptions,
      fields: updatedFields
    }));
  };

  // Function to handle field type changes
  const handleFieldTypeChange = (index: number, value: string) => {
    const updatedFields = [...options.fields];
    updatedFields[index].type = value;
    setOptions(prevOptions => ({
      ...prevOptions,
      fields: updatedFields
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Synthetic Data Generation</h1>
        <p className="text-muted-foreground mt-2">
          Generate realistic synthetic data using AI
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Data Options</CardTitle>
          <CardDescription>
            Configure the type and structure of the data you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="dataType">Data Type</Label>
            <Select value={options.dataType} onValueChange={handleSchemaSelect}>
              <SelectTrigger id="dataType">
                <SelectValue placeholder="Select a data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="transaction">Transaction</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {options.dataType === 'custom' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="uploadData">Upload Data (JSON)</Label>
                <FileInput onFileChange={handleFileUpload} />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Uploaded file: {uploadedFile.name}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customSchema">Custom Schema (JSON)</Label>
                <Textarea
                  id="customSchema"
                  placeholder="Enter your custom schema here"
                  value={options.customSchema}
                  onChange={handleCustomSchemaChange}
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label>Fields</Label>
            <div className="grid gap-4">
              {options.fields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Switch
                    checked={field.included}
                    onCheckedChange={(checked) => {
                      const updatedFields = [...options.fields];
                      updatedFields[index].included = checked;
                      setOptions({
                        ...options,
                        fields: updatedFields
                      } as typeof options);
                    }}
                  />
                  <Input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => {
                      const updatedFields = [...options.fields];
                      updatedFields[index].name = e.target.value;
                      setOptions({
                        ...options,
                        fields: updatedFields
                      } as typeof options);
                    }}
                  />
                  <Select
                    value={field.type}
                    onValueChange={(value) => {
                      const updatedFields = [...options.fields];
                      updatedFields[index].type = value;
                      setOptions({
                        ...options,
                        fields: updatedFields
                      } as typeof options);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="integer">Integer</SelectItem>
                      <SelectItem value="float">Float</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rowCount">Row Count</Label>
            <Input
              id="rowCount"
              type="number"
              value={String(options.rowCount)}
              onChange={(e) => setOptions({ ...options, rowCount: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="distributionType">Distribution Type</Label>
            <Select
              value={options.distributionType}
              onValueChange={(value) => setOptions({ ...options, distributionType: value })}
            >
              <SelectTrigger id="distributionType">
                <SelectValue placeholder="Select distribution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="uniform">Uniform</SelectItem>
                <SelectItem value="random">Random</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="includeNulls">Include Nulls</Label>
            <Switch
              id="includeNulls"
              checked={options.includeNulls}
              onCheckedChange={(checked) => setOptions({ ...options, includeNulls: checked })}
            />
          </div>

          {options.includeNulls && (
            <div className="grid gap-2">
              <Label htmlFor="nullPercentage">Null Percentage</Label>
              <Slider
                id="nullPercentage"
                defaultValue={[options.nullPercentage]}
                max={100}
                step={1}
                onValueChange={(value) => setOptions({ ...options, nullPercentage: value[0] })}
              />
              <p className="text-sm text-muted-foreground">
                {options.nullPercentage}%
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="outputFormat">Output Format</Label>
            <Select
              value={options.outputFormat}
              onValueChange={(value) => setOptions({ ...options, outputFormat: value })}
            >
              <SelectTrigger id="outputFormat">
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aiPrompt">Custom AI Prompt</Label>
            <Textarea
              id="aiPrompt"
              placeholder="Enter a custom AI prompt to guide data generation"
              value={options.aiPrompt}
              onChange={(e) => setOptions({ ...options, aiPrompt: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generate Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerateData}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating... ({progress}%)
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Generate Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedData && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Generated Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generatedData}
              readOnly
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => downloadSyntheticData(generatedData, options.outputFormat)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => saveSyntheticDataToDatabase(generatedData)}
              >
                <Save className="mr-2 h-4 w-4" />
                Save to Database
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SyntheticData;
