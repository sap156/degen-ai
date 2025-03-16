
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  DataField, 
  generateSyntheticData, 
  downloadSyntheticData, 
  saveSyntheticDataToDatabase, 
  SyntheticDataOptions,
  detectSchemaFromData
} from "@/services/syntheticDataService";
import { Code, Database, Download, FileJson, FilePlus2, Sparkles, Upload } from "lucide-react";
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import { useApiKey } from '@/contexts/ApiKeyContext';
import FileUploader from '@/components/FileUploader';
import { readFileContent, parseCSV, parseJSON } from '@/utils/fileUploadUtils';

const dataTypes = [
  { value: 'personal', label: 'Personal Information' },
  { value: 'financial', label: 'Financial Data' },
  { value: 'healthcare', label: 'Healthcare Records' },
  { value: 'ecommerce', label: 'E-commerce Transactions' },
  { value: 'custom', label: 'Custom Schema' },
];

function SyntheticData() {
  const { apiKey, isKeySet } = useApiKey();
  const [generatedData, setGeneratedData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataFields, setDataFields] = useState<DataField[]>([
    { name: "id", type: "id", included: true },
    { name: "full_name", type: "name", included: true },
    { name: "email", type: "email", included: true },
    { name: "age", type: "number", included: true },
    { name: "created_at", type: "date", included: true },
  ]);
  const [activeTab, setActiveTab] = useState("generator");
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm({
    defaultValues: {
      dataType: "user",
      rowCount: 100,
      distributionType: "random",
      includeNulls: false,
      nullPercentage: 10,
      outputFormat: "json",
      customSchema: "",
      aiPrompt: "Generate a dataset of fictional users with realistic names, emails, addresses, and numerical attributes"
    },
  });

  const onSubmit = async (values: any) => {
    if (!isKeySet) {
      toast.error("Please set your OpenAI API key first");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const options: SyntheticDataOptions = {
        ...values,
        fields: dataFields,
        uploadedData: uploadedData.length > 0 ? uploadedData.slice(0, 5) : undefined
      };
      
      const data = await generateSyntheticData(options, apiKey);
      setGeneratedData(data);
      toast.success("Data generated successfully!");
    } catch (error) {
      console.error("Error generating data:", error);
      toast.error("Error generating data. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      const content = await readFileContent(file);
      
      let parsedData: any[] = [];
      if (file.name.endsWith('.csv')) {
        parsedData = parseCSV(content);
      } else if (file.name.endsWith('.json')) {
        parsedData = parseJSON(content);
        if (!Array.isArray(parsedData)) {
          if (parsedData && typeof parsedData === 'object') {
            parsedData = [parsedData];
          } else {
            throw new Error("Invalid JSON format");
          }
        }
      } else {
        toast.error("Unsupported file format. Please upload CSV or JSON.");
        return;
      }
      
      if (parsedData.length === 0) {
        toast.error("No data found in file");
        return;
      }
      
      // Detect schema from uploaded data
      const detectedFields = detectSchemaFromData(parsedData);
      setDataFields(detectedFields);
      setUploadedData(parsedData);
      
      // Update form values
      form.setValue("dataType", "custom");
      form.setValue("aiPrompt", `Generate synthetic data that follows the same pattern as the uploaded ${file.name.split('.').pop()} file`);
      
      toast.success(`Schema detected with ${detectedFields.length} fields`);
      setActiveTab("generator");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error processing file. Please check the format.");
    }
  };

  const handleDownload = () => {
    if (!generatedData) {
      toast.error("No data to download. Generate data first.");
      return;
    }
    
    downloadSyntheticData(generatedData, form.getValues("outputFormat"));
  };

  const handleSaveToDatabase = async () => {
    if (!generatedData) {
      toast.error("No data to save. Generate data first.");
      return;
    }
    
    try {
      await saveSyntheticDataToDatabase(generatedData);
    } catch (error) {
      console.error("Error saving to database:", error);
      toast.error("Error saving to database. Please try again.");
    }
  };

  const toggleFieldInclusion = (index: number) => {
    const updatedFields = [...dataFields];
    updatedFields[index].included = !updatedFields[index].included;
    setDataFields(updatedFields);
  };

  const updateFieldType = (index: number, type: string) => {
    const updatedFields = [...dataFields];
    updatedFields[index].type = type;
    setDataFields(updatedFields);
  };

  return (
    <div className="container px-4 py-6 max-w-7xl">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Synthetic Data Generator</h1>
        <p className="text-muted-foreground">
          Generate realistic synthetic data for testing and development.
        </p>
      </div>
      
      <ApiKeyRequirement
        title="OpenAI API Key Required"
        description="Set up your OpenAI API key to generate synthetic data."
      />
      
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <FilePlus2 className="h-4 w-4" />
              Data Generator
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Schema
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="schema">
            <Card>
              <CardHeader>
                <CardTitle>Upload Custom Schema</CardTitle>
                <CardDescription>
                  Upload a CSV or JSON file to generate synthetic data matching your schema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onFileUpload={handleFileUpload}
                  accept=".csv,.json"
                  maxSize={5}
                  title="Upload Schema File"
                  description="Drag and drop a CSV or JSON file with sample data to detect schema"
                />
                
                {uploadedFile && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/20">
                    <p className="font-medium">Uploaded file: {uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {uploadedData.length} records detected
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="secondary" 
                  onClick={() => setActiveTab("generator")}
                  disabled={dataFields.length === 0}
                >
                  Continue to Generator
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="generator">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Configuration</CardTitle>
                        <CardDescription>
                          Configure the type and structure of synthetic data you want to generate.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="dataType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a data type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">User Data</SelectItem>
                                  <SelectItem value="transaction">Transaction Data</SelectItem>
                                  <SelectItem value="product">Product Data</SelectItem>
                                  <SelectItem value="custom">Custom Schema</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select the type of data you want to generate.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {dataFields.length > 0 && (
                          <div className="space-y-2">
                            <FormLabel>Schema Fields</FormLabel>
                            <div className="border rounded-md overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="text-left p-2 text-xs font-medium">Field</th>
                                    <th className="text-left p-2 text-xs font-medium">Type</th>
                                    <th className="text-left p-2 text-xs font-medium">Include</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dataFields.map((field, index) => (
                                    <tr key={index} className="border-t">
                                      <td className="p-2 text-sm">{field.name}</td>
                                      <td className="p-2">
                                        <Select 
                                          value={field.type} 
                                          onValueChange={(value) => updateFieldType(index, value)}
                                        >
                                          <SelectTrigger className="h-8 w-[120px]">
                                            <SelectValue placeholder="Type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="name">Name</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="phone">Phone</SelectItem>
                                            <SelectItem value="address">Address</SelectItem>
                                            <SelectItem value="id">ID</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </td>
                                      <td className="p-2">
                                        <Switch 
                                          checked={field.included} 
                                          onCheckedChange={() => toggleFieldInclusion(index)} 
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        <FormField
                          control={form.control}
                          name="rowCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Row Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={e => field.onChange(parseInt(e.target.value) || 10)}
                                  min={1} 
                                  max={10000}
                                />
                              </FormControl>
                              <FormDescription>
                                Number of data rows to generate (1-10,000).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="outputFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Output Format</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an output format" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="json">JSON</SelectItem>
                                  <SelectItem value="csv">CSV</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose the format for the generated data.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="includeNulls"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Include Null Values</FormLabel>
                                <FormDescription>
                                  Randomly include null values in the generated data.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("includeNulls") && (
                          <FormField
                            control={form.control}
                            name="nullPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Null Percentage ({field.value}%)</FormLabel>
                                <FormControl>
                                  <Slider
                                    value={[field.value]}
                                    min={0}
                                    max={50}
                                    step={1}
                                    onValueChange={(value) => field.onChange(value[0])}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Percentage of fields that will contain null values.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="aiPrompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI Generation Prompt</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the kind of data you want to generate..."
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Describe the data you want AI to generate in detail.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          type="submit" 
                          disabled={isGenerating || !isKeySet}
                          className="gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <FilePlus2 className="h-4 w-4" />
                              Generate Data
                            </>
                          )}
                        </Button>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          AI-powered generation
                        </div>
                      </CardFooter>
                    </Card>
                  </form>
                </Form>
              </div>
              
              <div className="space-y-6">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>Generated Data</CardTitle>
                    <CardDescription>
                      Preview of the generated synthetic data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="relative h-[500px] w-full overflow-auto rounded-md bg-black/90 p-4">
                      <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">
                        {generatedData || 'No data generated yet. Configure options and click "Generate Data".'}
                      </pre>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handleDownload}
                      disabled={!generatedData}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      onClick={handleSaveToDatabase}
                      disabled={!generatedData}
                      variant="secondary"
                      className="gap-2"
                    >
                      <Database className="h-4 w-4" />
                      Save to Database
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SyntheticData;
