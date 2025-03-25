import React from 'react';
import { useState } from 'react';
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
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
 import { toast } from 'sonner';
 import { motion } from 'framer-motion';
 import FileUploader from '@/components/FileUploader';
 import { useApiKey } from '@/contexts/ApiKeyContext';
 import { applyAugmentation } from '@/services/dataAugmentationService';
 import { formatData } from '@/utils/fileUploadUtils';
 import { 
   ArrowRight, 
   BarChart3, 
   Download, 
   Upload, 
   PlusCircle, 
   Trash2, 
   AlertCircle,
   Sparkles,
   FileJson,
   FileText
 } from 'lucide-react';
 import { useAuth } from '@/hooks/useAuth';
 import AuthRequirement from '@/components/AuthRequirement';
 import UserGuideDataAugmentation from '@/components/ui/UserGuideDataAugmentation';
 
 const augmentationMethods = [
   { id: 'noise', label: 'Add Noise', description: 'Add random noise to numeric fields' },
   { id: 'scaling', label: 'Scaling', description: 'Scale numeric values by a factor' },
   { id: 'outliers', label: 'Generate Outliers', description: 'Add outlier data points' },
   { id: 'missing', label: 'Simulate Missing Data', description: 'Randomly remove values' },
   { id: 'categorical', label: 'Categorical Oversampling', description: 'Oversample certain categories' },
   { id: 'text', label: 'Text Augmentation', description: 'Modify text fields with synonyms, paraphrasing' },
 ];
 
 const DataAugmentationContent = () => {
  const { apiKey } = useApiKey();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['noise']);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
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
      multiplier: 2,
      fields: ['weather']
    },
    text: {
      method: 'synonym',
      fields: ['description']
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [augmentedData, setAugmentedData] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState('original');
  const [parsedData, setParsedData] = useState<any[]>([]);

  const handleFileUpload = (file: File) => {
    setSourceFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setPreviewData(content);

        let parsedData;
        if (file.name.endsWith('.json')) {
          try {
            parsedData = JSON.parse(content);
            if (!Array.isArray(parsedData)) {
              parsedData = [parsedData];
            }
          } catch (jsonError) {
            console.error("Error parsing JSON:", jsonError);
            toast.error(`Failed to parse JSON: ${jsonError.message}`);
            return;
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          parsedData = [];

          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const values = lines[i].split(',');
            const item: Record<string, any> = {};

            headers.forEach((header, index) => {
              item[header.trim()] = values[index]?.trim() || '';
            });

            parsedData.push(item);
          }
        }
        setParsedData(parsedData || []);
 
         if (parsedData && parsedData.length > 0) {
           const sampleItem = parsedData[0];
           const numericFields: string[] = [];
           const textFields: string[] = [];
           const categoricalFields: string[] = [];
 
           Object.entries(sampleItem).forEach(([field, value]) => {
             if (typeof value === 'number' || !isNaN(Number(value))) {
               numericFields.push(field);
             } else if (typeof value === 'string' && value.length > 20) {
               textFields.push(field);
             } else {
               categoricalFields.push(field);
             }
           });
 
           setAugmentationSettings(prev => ({
             ...prev,
             noise: { ...prev.noise, fields: numericFields.slice(0, 3) },
             scaling: { ...prev.scaling, fields: numericFields.slice(0, 2) },
             outliers: { ...prev.outliers, fields: numericFields.slice(0, 2) },
             missing: { ...prev.missing, fields: [...numericFields.slice(0, 2), ...textFields.slice(0, 1)] },
             categorical: { ...prev.categorical, fields: categoricalFields.slice(0, 2) },
             text: { ...prev.text, fields: textFields.slice(0, 2) }
           }));
         }
 
         toast.success('File uploaded successfully');
       } catch (error) {
         console.error('Error parsing file:', error);
         toast.error('Failed to parse the file');
       }
     };
 
     reader.readAsText(file);
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
 
   const handleUpdateFields = (method: string, newFields: string[]) => {
     setAugmentationSettings(prev => ({
       ...prev,
       [method]: {
         ...prev[method as keyof typeof prev],
         fields: newFields
       }
     }));
   };
 
   const handleProcessData = async () => {
     if (!sourceFile || parsedData.length === 0) {
       toast.error('Please upload a file first');
       return;
     }

     if (!apiKey) {
       toast.error('OpenAI API key is required for data augmentation');
       return;
     }

     setIsProcessing(true);

     try {
       let allAugmentedData: any[] = [];

       for (const method of selectedMethods) {
         try {
           console.log(`Applying ${method} to all ${parsedData.length} records`);
           const augmentedData = await applyAugmentation(
             apiKey,
             parsedData,
             method,
             augmentationSettings,
             aiPrompt
           );

           allAugmentedData = [...allAugmentedData, ...augmentedData];
         } catch (error) {
           console.error(`Error applying ${method}:`, error);
           toast.error(`Failed to apply ${method}`);
         }
       }

       const formattedData = JSON.stringify(allAugmentedData, null, 2);
       setAugmentedData(formattedData);
       setPreviewTab('augmented');
       toast.success('Data augmentation completed');
     } catch (error) {
       console.error('Error processing data:', error);
       toast.error('Failed to process data augmentation');
     } finally {
       setIsProcessing(false);
     }
   };
 
   const handleDownload = () => {
     if (!augmentedData) return;
 
     try {
       const parsedAugmentedData = JSON.parse(augmentedData);
       let downloadData: string;
       let mimeType: string;
       let fileExtension: string;
 
       if (exportFormat === 'json') {
         downloadData = JSON.stringify(parsedAugmentedData, null, 2);
         mimeType = 'application/json';
         fileExtension = 'json';
       } else {
         downloadData = formatData(parsedAugmentedData, 'csv');
         mimeType = 'text/csv';
         fileExtension = 'csv';
       }
 
       const blob = new Blob([downloadData], { type: mimeType });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `augmented_data_${Date.now()}.${fileExtension}`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       toast.success(`Download started in ${exportFormat.toUpperCase()} format`);
     } catch (error) {
       console.error('Error downloading data:', error);
       toast.error('Failed to download data');
     }
   };
 
   return (
     <div className="container mx-auto py-6">
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
                 <CardTitle className="flex items-center">
                   <Sparkles className="h-5 w-5 mr-2 text-primary" />
                   AI Augmentation Prompt
                 </CardTitle>
                 <CardDescription>
                   Describe how you want to augment your data in natural language
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <Textarea
                   placeholder="Example: Generate realistic variations for a retail dataset, focusing on seasonal patterns and regional differences. For numeric fields, ensure they follow normal distributions typical for retail sales."
                   className="min-h-[100px]"
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                 />
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                 <CardTitle>Augmentation Methods</CardTitle>
                 <CardDescription>
                   Select and configure AI-powered data augmentation techniques
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
                           {parsedData.length > 0 && (
                             <div className="mb-4">
                               <Label className="mb-2 block">Fields to Augment</Label>
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                 {Object.keys(parsedData[0]).map(field => (
                                   <div key={field} className="flex items-center space-x-2">
                                     <Checkbox 
                                       id={`${methodId}-field-${field}`}
                                       checked={augmentationSettings[methodId as keyof typeof augmentationSettings]?.fields?.includes(field)}
                                       onCheckedChange={(checked) => {
                                         const currentFields = augmentationSettings[methodId as keyof typeof augmentationSettings]?.fields || [];
                                         if (checked) {
                                           handleUpdateFields(methodId, [...currentFields, field]);
                                         } else {
                                           handleUpdateFields(methodId, currentFields.filter(f => f !== field));
                                         }
                                       }}
                                     />
                                     <Label 
                                       htmlFor={`${methodId}-field-${field}`}
                                       className="text-sm cursor-pointer"
                                     >
                                       {field}
                                     </Label>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
 
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
                   disabled={!sourceFile || isProcessing || !apiKey}
                   className="w-full gap-2"
                 >
                   {isProcessing ? (
                     <>
                       <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                       Processing...
                     </>
                   ) : (
                     <>
                       <Sparkles className="h-4 w-4" />
                       Augment Data with AI
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
             <CardFooter className="flex flex-col space-y-3">
               {augmentedData && (
                 <>
                   <div className="w-full flex justify-between items-center mb-2">
                     <Label>Export Format</Label>
                     <div className="flex space-x-2">
                       <Button 
                         size="sm" 
                         variant={exportFormat === 'json' ? "default" : "outline"} 
                         onClick={() => setExportFormat('json')}
                         className="flex items-center gap-1"
                       >
                         <FileJson className="h-4 w-4" />
                         JSON
                       </Button>
                       <Button 
                         size="sm" 
                         variant={exportFormat === 'csv' ? "default" : "outline"} 
                         onClick={() => setExportFormat('csv')}
                         className="flex items-center gap-1"
                       >
                         <FileText className="h-4 w-4" />
                         CSV
                       </Button>
                     </div>
                   </div>
                   <Button onClick={handleDownload} className="w-full gap-2">
                     <Download className="h-4 w-4" />
                     Download Augmented Data
                   </Button>
                 </>
               )}
             </CardFooter>
           </Card>
         </div>
       </div>
 
       <UserGuideDataAugmentation />
     </div>
   );
 };

 const DataAugmentation = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Data Augmentation</h1>
        <AuthRequirement showUserGuide={<UserGuideDataAugmentation />} />
      </div>
    );
  }

  return <DataAugmentationContent />;
};

export default DataAugmentation;

