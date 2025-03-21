import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, BarChart, Save, RefreshCw, Download, FileText, Brain } from 'lucide-react';
import { toast } from 'sonner';
import FileUploader from '@/components/FileUploader';
import { parseCSV, parseJSON, readFileContent } from '@/utils/fileUploadUtils';
import AIDatasetConfiguration from '@/components/AIDatasetConfiguration';
import AIDatasetAnalysis from '@/components/AIDatasetAnalysis';
import DataBalancingControls from '@/components/DataBalancingControls';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthRequirement from '@/components/AuthRequirement';
import UserGuideImbalancedData from '@/components/ui/UserGuideImbalancedData';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { 
   DatasetAnalysis, 
   DatasetPreferences, 
   analyzeDataset, 
   getFeatureEngineeringSuggestions 
 } from '@/services/aiDatasetAnalysisService';
import { getCompletion, OpenAiMessage } from '@/services/openAiService';
import { 
   ClassDistribution, 
   DatasetInfo, 
   BalancingOptions, 
   balanceDataset, 
   exportAsJson, 
   exportAsCsv, 
   downloadData,
   generateSyntheticRecords
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
 
 ChartJS.register(
   ArcElement,
   Tooltip,
   Legend,
   CategoryScale,
   LinearScale,
   BarElement
 );
 
const ImbalancedData = () => {
  const [originalDataset, setOriginalDataset] = useState<DatasetInfo | null>(null);
  const [balancedDataset, setBalancedDataset] = useState<DatasetInfo | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
   
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [balancedParsedData, setBalancedParsedData] = useState<any[]>([]);
  const [datasetAnalysis, setDatasetAnalysis] = useState<DatasetAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [datasetPreferences, setDatasetPreferences] = useState<DatasetPreferences | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [featureEngineering, setFeatureEngineering] = useState<any | null>(null);
  const [modelOptions, setModelOptions] = useState({
     syntheticDataPreferences: {
       enabled: true,
       volume: 100,
       diversity: 'medium' as 'low' | 'medium' | 'high'
     },
     enableFeatureEngineering: false
   });

  const { apiKey } = useApiKey();
 
 const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      setIsProcessingFile(true);
      setParsedData([]);
      setBalancedParsedData([]);
      setDatasetAnalysis(null);
      setDatasetPreferences(null);
      setAiRecommendations(null);
      setBalancedDataset(null);
       
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
       
      const processedData = processUploadedData(parsedData);
      setOriginalDataset(processedData);
       
      setParsedData(Array.isArray(parsedData) ? parsedData : []);
       
      if (apiKey) {
         analyzeUploadedData(Array.isArray(parsedData) ? parsedData : []);
      }
       
      toast.success('File processed successfully');
     } catch (error) {
       console.error('Error processing file:', error);
       toast.error((error as Error).message || 'Failed to process file');
     } finally {
       setIsProcessingFile(false);
     }
   };
 
  const analyzeUploadedData = async (data: any[]) => {
    if (!data.length || !apiKey) return;
     
    setIsAnalyzing(true);
     
    try {
      const analysis = await analyzeDataset(data, apiKey);
      if (analysis) {
         setDatasetAnalysis(analysis);
       }
     } catch (error) {
       console.error('Error analyzing dataset:', error);
       toast.error('Failed to analyze dataset with AI');
     } finally {
       setIsAnalyzing(false);
     }
  };
 
  const handleDatasetConfigurationComplete = (preferences: DatasetPreferences) => {
     setDatasetPreferences(preferences);
     
     if (originalDataset && parsedData.length > 0 && preferences.targetColumn) {
       const updatedDataset = processDataWithTargetColumn(parsedData, preferences.targetColumn);
       setOriginalDataset(updatedDataset);
     }
     
     toast.success('Dataset configuration saved');
  };
 
  const processDataWithTargetColumn = (data: any[], targetColumn: string): DatasetInfo => {
     const classCounts: Record<string, number> = {};
     
     data.forEach(item => {
       if (targetColumn in item) {
         const className = String(item[targetColumn]);
         if (className !== undefined && className !== null && className !== '') {
           classCounts[className] = (classCounts[className] || 0) + 1;
         }
       }
     });
     
    const totalSamples = Object.values(classCounts).reduce((sum, count) => sum + count, 0);
     
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
     
     classes.sort((a, b) => b.count - a.count);
     
    const maxClassSize = classes.length > 0 ? classes[0].count : 0;
    const minClassSize = classes.length > 0 ? classes[classes.length - 1].count : 0;
    const imbalanceRatio = minClassSize > 0 ? parseFloat((maxClassSize / minClassSize).toFixed(2)) : 0;
     
     return {
       totalSamples,
       classes,
       isImbalanced: imbalanceRatio > 1.5,
       imbalanceRatio
     };
   };
 
   const getAIRecommendations = async (options?: { desiredOutcome: string; modelPreference: string }) => {
     if (!datasetPreferences || !parsedData.length || !apiKey) return;
     
     setIsLoadingRecommendations(true);
     
    try {
      const optimizationGoal = options?.desiredOutcome || 'balanced precision and recall';
      const modelType = options?.modelPreference || 'Auto (AI-recommended)';
       
      const messages: OpenAiMessage[] = [
         {
           role: "system",
           content: "You are a data science expert specializing in imbalanced datasets. Provide recommendations for handling class imbalance."
         },
         {
           role: "user",
           content: `I have a dataset with the following characteristics:
           
           Target column: ${datasetPreferences.targetColumn}
           Class labels: ${datasetPreferences.classLabels.join(', ')}
           Majority class: ${datasetPreferences.majorityClass}
           Minority class: ${datasetPreferences.minorityClass}
           Dataset context: ${datasetPreferences.datasetContext || 'Not provided'}
           
           The dataset has imbalanced classes. Please provide specific recommendations for:
           1. Resampling techniques (when to use undersampling, oversampling, SMOTE)
           2. Algorithmic approaches (cost-sensitive learning, ensemble methods)
           3. Evaluation metrics appropriate for imbalanced data
           4. Any other relevant strategies
           
           My optimization goal is: ${optimizationGoal}
           My preferred model type is: ${modelType}
           
           Make the recommendations specific to this dataset and context, optimizing for my stated goal.`
         }
       ];
       
      const recommendations = await getCompletion(apiKey, messages, {
         temperature: 0.3,
         max_tokens: 16384,
         model: localStorage.getItem('openai-model') || 'gpt-4o'

       });
       
       setAiRecommendations(recommendations);
       
       try {
         const featureSuggestions = await getFeatureEngineeringSuggestions(
           parsedData,
           datasetPreferences,
           apiKey
         );
         
         if (featureSuggestions) {
           setFeatureEngineering(featureSuggestions);
         }
       } catch (error) {
         console.error('Error parsing feature suggestions:', error);
       }
       
     } catch (error) {
       console.error('Error getting AI recommendations:', error);
       toast.error('Failed to get AI recommendations');
     } finally {
       setIsLoadingRecommendations(false);
     }
   };
 
   const handleBalanceDataset = (options: BalancingOptions, data?: any[]) => {
     if (!originalDataset) return;
     
     const dataToUse = data && data.length > 0 ? data : null;
     
     try {
       const balanced = balanceDataset(originalDataset, options);
       setBalancedDataset(balanced);
       
       if (dataToUse && datasetPreferences?.targetColumn) {
         const balancedData = balanceActualRecords(
           dataToUse, 
           datasetPreferences.targetColumn,
           originalDataset, 
           balanced, 
           options
         );
         setBalancedParsedData(balancedData);
       }
       
       toast.success(`Applied ${options.method} balancing technique`);
     } catch (error) {
       console.error('Error in balancing dataset:', error);
       toast.error('Failed to balance dataset');
     }
   };
 
   const balanceActualRecords = (
     data: any[],
     targetColumn: string,
     originalDataset: DatasetInfo,
     balancedDataset: DatasetInfo,
     options: BalancingOptions
   ): any[] => {
     const recordsByClass: Record<string, any[]> = {};
     
     data.forEach(record => {
       const className = String(record[targetColumn]);
       if (!recordsByClass[className]) {
         recordsByClass[className] = [];
       }
       recordsByClass[className].push({...record});
     });
     
     const originalClassCounts = originalDataset.classes.reduce((acc, cls) => {
       acc[cls.className] = cls.count;
       return acc;
     }, {} as Record<string, number>);
     
     const targetClassCounts = balancedDataset.classes.reduce((acc, cls) => {
       acc[cls.className] = cls.count;
       return acc;
     }, {} as Record<string, number>);
     
     const balancedRecords: any[] = [];
     
     Object.entries(recordsByClass).forEach(([className, records]) => {
       const originalCount = records.length;
       const targetCount = targetClassCounts[className] || originalCount;
       
       if (targetCount <= originalCount) {
         const shuffled = [...records].sort(() => 0.5 - Math.random());
         balancedRecords.push(...shuffled.slice(0, targetCount));
       } else {
         balancedRecords.push(...records);
         
         const recordsToAdd = targetCount - originalCount;
         
         if (options.method === 'smote' && records.length >= 2) {
           const syntheticRecords = generateSyntheticRecords(
             records,
             targetColumn,
             recordsToAdd,
             'high'
           );
           
           balancedRecords.push(...syntheticRecords);
         } else if (options.method === 'oversample') {
           const existingFingerprints = new Set<string>();
           
           records.forEach(record => {
             const fingerprint = JSON.stringify(
               Object.entries(record)
                 .filter(([k, v]) => k !== targetColumn && typeof v === 'number')
                 .map(([k, v]) => [k, v])
             );
             existingFingerprints.add(fingerprint);
           });
           
           for (let i = 0; i < recordsToAdd; i++) {
             const baseRecord = records[i % records.length];
             const syntheticRecord = { ...baseRecord };
             
             Object.keys(syntheticRecord).forEach(key => {
               if (key !== targetColumn && typeof syntheticRecord[key] === 'number') {
                 const value = syntheticRecord[key];
                 const noise = value * 0.01 * (Math.random() * 2 - 1) * (i + 1);
                 
                 if (Number.isInteger(value)) {
                   syntheticRecord[key] = Math.round(value + noise);
                 } else {
                   syntheticRecord[key] = parseFloat((value + noise).toFixed(4));
                 }
               }
             });
             
             syntheticRecord.synthetic_id = `syn_oversample_${i + 1}`;
             balancedRecords.push(syntheticRecord);
           }
         }
       }
     });
     
     return balancedRecords;
   };
 
   const handleDownloadBalanced = (format: 'json' | 'csv') => {
     if (!balancedDataset) return;
     
     try {
       const filename = `balanced-dataset.${format}`;
       
       if (balancedParsedData.length > 0) {
         const data = format === 'json' 
           ? JSON.stringify(balancedParsedData, null, 2)
           : convertRecordsToCSV(balancedParsedData);
         
         downloadData(data, filename, format);
       } else {
         const data = format === 'json' ? exportAsJson(balancedDataset) : exportAsCsv(balancedDataset);
         downloadData(data, filename, format);
       }
       
       toast.success(`Downloaded balanced dataset as ${format.toUpperCase()}`);
     } catch (error) {
       console.error('Error downloading balanced dataset:', error);
       toast.error('Failed to download balanced dataset');
     }
   };
 
   const convertRecordsToCSV = (records: any[]): string => {
     if (!records.length) return '';
     
     const headers = Object.keys(records[0]);
     const headerRow = headers.join(',');
     
     const rows = records.map(record => {
       return headers.map(header => {
         const value = record[header];
         if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
           return `"${value.replace(/"/g, '""')}"`;
         }
         return value;
       }).join(',');
     });
     
     return [headerRow, ...rows].join('\n');
   };
 
   const processUploadedData = (data: any): DatasetInfo => {
     if (Array.isArray(data)) {
       if (datasetPreferences?.targetColumn) {
         return processDataWithTargetColumn(data, datasetPreferences.targetColumn);
       }
       
       const classField = detectClassField(data);
       
       if (!classField) {
         throw new Error('Could not identify class field in the data');
       }
       
       const classCounts: Record<string, number> = {};
       data.forEach(item => {
         if (classField in item) {
           const className = String(item[classField]);
           if (className !== undefined && className !== null && className !== '') {
             classCounts[className] = (classCounts[className] || 0) + 1;
           }
         }
       });
       
       const totalSamples = Object.values(classCounts).reduce((sum, count) => sum + count, 0);
       
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
       
       classes.sort((a, b) => b.count - a.count);
       
       const maxClassSize = classes.length > 0 ? classes[0].count : 0;
       const minClassSize = classes.length > 0 ? classes[classes.length - 1].count : 0;
       const imbalanceRatio = minClassSize > 0 ? parseFloat((maxClassSize / minClassSize).toFixed(2)) : 0;
       
       return {
         totalSamples,
         classes,
         isImbalanced: imbalanceRatio > 1.5,
         imbalanceRatio
       };
     } else if (data && typeof data === 'object' && 'classes' in data && 'totalSamples' in data) {
       return data as DatasetInfo;
     } else {
       throw new Error('Unsupported data format. Please check the file structure.');
     }
   };
 
   const detectClassField = (data: any[]): string | null => {
     if (data.length === 0) return null;
     
     const possibleClassFields = [
       'class', 'label', 'category', 'target', 'y', 'Class', 'Label', 'Category', 'Target',
       'diagnosis', 'Diagnosis', 'disease', 'Disease', 'condition', 'Condition', 'type', 'Type'
     ];
     
     const firstItem = data[0];
     for (const field of possibleClassFields) {
       if (field in firstItem) {
         return field;
       }
     }
     
     for (const field of Object.keys(firstItem)) {
       for (const classField of possibleClassFields) {
         if (field.toLowerCase().includes(classField.toLowerCase())) {
           return field;
         }
       }
     }
     
     const fields = Object.keys(firstItem);
     
     for (const field of fields) {
       const uniqueValues = new Set();
       let validField = true;
       
       for (const item of data) {
         if (field in item) {
           const value = String(item[field]);
           if (value !== undefined && value !== null && value !== '') {
             uniqueValues.add(value);
           }
         } else {
           validField = false;
           break;
         }
       }
       
       const uniqueCount = uniqueValues.size;
       if (validField && uniqueCount > 1 && uniqueCount <= Math.min(10, data.length / 5)) {
         return field;
       }
     }
     
     return null;
   };
 
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
 
   useEffect(() => {
     if (datasetPreferences?.targetColumn && parsedData.length > 0) {
       const updatedDataset = processDataWithTargetColumn(parsedData, datasetPreferences.targetColumn);
       setOriginalDataset(updatedDataset);
     }
   }, [datasetPreferences?.targetColumn, parsedData]);
 
 const ImbalancedDataContent = () => {
   // Existing code from ImbalancedData.tsx
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
         <div className="lg:col-span-1 space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Dataset Controls</CardTitle>
               <CardDescription>Upload your dataset to begin</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <FileUploader
                 onFileUpload={handleFileUpload}
                 accept=".csv, .json, .parquet"
                 title="Upload Dataset"
                 description="Upload a CSV, JSON or Parquet file with your imbalanced dataset"
               />
 
               {uploadedFile && (
                 <div className="text-sm text-muted-foreground mt-2">
                   <p className="font-medium">File: {uploadedFile.name}</p>
                   <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                 </div>
               )}
             </CardContent>
           </Card>
 
           <AIDatasetConfiguration
             datasetAnalysis={datasetAnalysis}
             isLoading={isAnalyzing}
             onConfigurationComplete={handleDatasetConfigurationComplete}
             apiKeyAvailable={!!apiKey}
           />
 
           {originalDataset && (
             <DataBalancingControls
               originalDataset={originalDataset}
               parsedData={parsedData}
               onBalanceDataset={handleBalanceDataset}
               onDownloadBalanced={handleDownloadBalanced}
               hasBalancedData={!!balancedDataset}
               aiRecommendationsAvailable={!!aiRecommendations}
             />
           )}
         </div>
 
         <div className="lg:col-span-2 space-y-6">
           <Card>
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
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center py-12">
                       <div className="rounded-full bg-muted p-3 mb-4">
                         <BarChart className="h-6 w-6 text-muted-foreground" />
                       </div>
                       <h3 className="text-lg font-medium mb-1">No Dataset Available</h3>
                       <p className="text-muted-foreground text-center max-w-md">
                         Upload a dataset to visualize the class distribution.
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
 
                       {balancedParsedData.length > 0 && (
                         <div>
                           <h3 className="font-medium text-lg mb-2">Balanced Records Preview</h3>
                           <div className="text-sm text-muted-foreground mb-2">
                             Generated {balancedParsedData.length} records using {balancedDataset.classes.length} classes
                           </div>
                           <div className="border rounded-md p-3 max-h-60 overflow-auto">
                             <pre className="text-xs">{JSON.stringify(balancedParsedData.slice(0, 5), null, 2)}</pre>
                             {balancedParsedData.length > 5 && (
                               <div className="text-xs text-center mt-2 text-muted-foreground">
                                 ... and {balancedParsedData.length - 5} more records
                               </div>
                             )}
                           </div>
                         </div>
                       )}
 
                       <div className="flex justify-end space-x-2">
                         <Button variant="outline" size="sm" onClick={() => handleDownloadBalanced('csv')}>
                           <FileText className="h-4 w-4 mr-2" />
                           Export CSV
                         </Button>
                         <Button variant="outline" size="sm" onClick={() => handleDownloadBalanced('json')}>
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
 
           <AIDatasetAnalysis
             datasetAnalysis={datasetAnalysis}
             preferences={datasetPreferences}
             apiKeyAvailable={!!apiKey}
             onRequestAnalysis={getAIRecommendations}
             isLoading={isLoadingRecommendations}
             aiRecommendations={aiRecommendations}
             originalDataset={originalDataset}
           />
         </div>
       </div>
 
       <UserGuideImbalancedData />
     </motion.div>
   );
 };
 
 const { user } = useAuth();

   if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Imbalanced Data Handling</h1>
        <AuthRequirement showUserGuide={<UserGuideImbalancedData />} />
      </div>
    );
   }

   return <ImbalancedDataContent />;
};
export default ImbalancedData;