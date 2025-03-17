import React, { useState, useEffect } from 'react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  DataField, 
  generateSyntheticData, 
  downloadSyntheticData, 
  saveSyntheticDataToDatabase, 
  SyntheticDataOptions,
  detectSchemaFromData,
  defaultSchemas
} from "@/services/syntheticDataService";
import { Code, Database, Download, FileJson, FilePlus2, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useApiKey } from '@/contexts/ApiKeyContext';
import FileUploader from '@/components/FileUploader';
import { readFileContent, parseCSV, parseJSON } from '@/utils/fileUploadUtils';
import { Checkbox } from "@/components/ui/checkbox";

const dataTypes = [
  { value: 'user', label: 'User Data' },
  { value: 'transaction', label: 'Transaction Data' },
  { value: 'product', label: 'Product Data' },
  { value: 'health', label: 'Health Data' },
  { value: 'custom', label: 'Custom Schema' },
];

const SyntheticData = () => {
  const { apiKey, isKeySet } = useApiKey();
  const [generatedData, setGeneratedData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [dataFields, setDataFields] = useState<DataField[]>(defaultSchemas.user);
  const [activeTab, setActiveTab] = useState("generator");
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  
  useEffect(() => {
    const dataType = form.watch("dataType");
    if (dataType in defaultSchemas) {
      setDataFields(defaultSchemas[dataType]);
    }
  }, [form.watch("dataType")]);

  const onSubmit = async (values: any) => {
    if (!isKeySet) {
      toast.error("Please set your OpenAI API key first");
      return;
    }
    
    const hasIncludedFields = dataFields.some(field => field.included);
    if (!hasIncludedFields) {
      toast.error("Please select at least one field to include in your data");
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setErrorMessage(null);
    setGeneratedData("");
    
    try {
      const options: SyntheticDataOptions = {
        ...values,
        fields: dataFields,
        uploadedData: uploadedData.length > 0 ? uploadedData.slice(0, 5) : undefined,
        onProgress: (progress) => {
          setGenerationProgress(progress);
        }
      };
      
      const data = await generateSyntheticData(options, apiKey);
      setGeneratedData(data);
      toast.success("Data generated successfully!");
    } catch (error) {
      console.error("Error generating data:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setErrorMessage(errorMsg);
      toast.error(`Error generating data: ${errorMsg}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
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
      
      const detectedFields = detectSchemaFromData(parsedData);
      setDataFields(detectedFields);
      setUploadedData(parsedData);
      
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
  
  const addNewField = () => {
    setDataFields([...dataFields, { name: "", type: "string", included: false }]);
  };
  
  const updateFieldName = (index: number, name: string) => {
    const updatedFields = [...dataFields];
    updatedFields[index].name = name;
    setDataFields(updatedFields);
  };
  
  const removeField = (index: number) => {
    setDataFields(dataFields.filter((_, i) => i !== index));
  };

  const selectAllFields = (select: boolean) => {
    const updatedFields = dataFields.map(field => ({
      ...field,
      included: select
    }));
    setDataFields(updatedFields);
  };

  return (
    <ApiKeyRequirement>
      <div className="container px-4 py-6 max-w-7xl">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Synthetic Data Generator</h1>
          <p className="text-muted-foreground">
            Generate realistic synthetic data for testing and development.
          </p>
        </div>
        
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
                <FileUploader onFileUpload={handleFileUpload} />
                {uploadedFile && (
                  <div className="mt-4">
                    <p>Uploaded File: {uploadedFile.name}</p>
                    <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="generator">
            <Card>
              <CardHeader>
                <CardTitle>Configure Dataset</CardTitle>
                <CardDescription>
                  Set up the parameters for your synthetic data generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="dataType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a data type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="rowCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Row Count</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                          </FormControl>
                          <FormDescription>Number of rows to generate.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="aiPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Generate a dataset of fictional users..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Instructions for the AI to generate data.
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select output format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel>Data Fields</FormLabel>
                      <FormDescription>Select which fields to include in the generated data.</FormDescription>
                      <div className="flex items-center space-x-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => selectAllFields(true)}>Select All</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => selectAllFields(false)}>Deselect All</Button>
                        <Button type="button" variant="outline" size="sm" onClick={addNewField}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </div>
                      
                      <div className="grid gap-4">
                        {dataFields.map((field, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <FormField
                              control={form.control}
                              name={`fields[${index}].included`}
                              render={() => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.included}
                                      onCheckedChange={() => toggleFieldInclusion(index)}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">Include</FormLabel>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`fields[${index}].name`}
                              render={() => (
                                <FormItem className="w-1/3">
                                  <FormControl>
                                    <Input 
                                      type="text" 
                                      placeholder="Field Name" 
                                      value={field.name}
                                      onChange={(e) => updateFieldName(index, e.target.value)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`fields[${index}].type`}
                              render={() => (
                                <FormItem className="w-1/3">
                                  <Select onValueChange={(value) => updateFieldType(index, value)} defaultValue={field.type}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="string">String</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="boolean">Boolean</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeField(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="includeNulls"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Include Nulls</FormLabel>
                            <FormDescription>
                              Include null values in the generated data.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {form.getValues("includeNulls") && (
                      <FormField
                        control={form.control}
                        name="nullPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Null Percentage</FormLabel>
                            <FormControl>
                              <Slider
                                defaultValue={[field.value]}
                                max={100}
                                step={1}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                            </FormControl>
                            <FormDescription>Percentage of null values to include in the data.</FormDescription>
                            <FormMessage>{field.value}%</FormMessage>
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <Button disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          Generating <Progress value={generationProgress} className="w-24 ml-2" />
                        </>
                      ) : (
                        <>
                          Generate Data <Sparkles className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    {errorMessage && (
                      <div className="text-red-500">Error: {errorMessage}</div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {generatedData && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Generated Data</h2>
            <Textarea value={generatedData} className="min-h-[300px]" readOnly />
            <div className="flex space-x-4">
              <Button onClick={handleDownload}>
                Download <Download className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={handleSaveToDatabase}>
                Save to Database <Database className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </ApiKeyRequirement>
  );
};

export default SyntheticData;
