import React from 'react';
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
                </

