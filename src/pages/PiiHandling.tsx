import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/FileUploader';
import { formatData, downloadData } from '@/utils/fileUploadUtils';
import { toast } from 'sonner';
import { ShieldAlert, Database, User, FileKey, Download } from 'lucide-react';
import ApiKeyRequirement from '@/components/ApiKeyRequirement';
import ProcessingTypesGuide from '@/components/ProcessingTypesGuide';
import MaskingFieldControl from '@/components/MaskingFieldControl';
import PiiDataGenerator from '@/components/PiiDataGenerator';
import SchemaEditor from '@/components/SchemaEditor';
import UserGuidePiiHandling from '@/components/ui/UserGuidePiiHandling';
import { detectPiiInData, processDataWithPiiHandling, generateSyntheticPiiData } from '@/services/piiHandlingService';
import { PiiField, PiiMaskingRule, PiiFieldType } from '@/types/piiHandling';

const PiiHandling = () => {
  // State for file upload
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  
  // State for PII detection
  const [piiFields, setPiiFields] = useState<PiiField[]>([]);
  const [detectionLoading, setDetectionLoading] = useState(false);
  
  // State for masking
  const [maskingRules, setMaskingRules] = useState<PiiMaskingRule[]>([]);
  const [maskingLoading, setMaskingLoading] = useState(false);
  
  // State for synthetic data generation
  const [syntheticData, setSyntheticData] = useState<any[]>([]);
  const [generationLoading, setGenerationLoading] = useState(false);
  
  // State for schema editor
  const [schema, setSchema] = useState<any>({});
  
  // Handle file upload
  const handleFileUpload = (data: any[]) => {
    setDataset(data);
    if (data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      setSelectedColumn(cols[0]);
      
      // Generate initial schema
      const initialSchema = generateSchema(data[0]);
      setSchema(initialSchema);
      
      toast.success(`Uploaded dataset with ${data.length} rows and ${cols.length} columns`);
    }
  };
  
  // Generate schema from sample data
  const generateSchema = (sample: any) => {
    const newSchema: any = {};
    for (const key in sample) {
      if (sample.hasOwnProperty(key)) {
        const value = sample[key];
        let type: PiiFieldType = 'string';
        
        if (typeof value === 'number') {
          type = 'number';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (value instanceof Date) {
          type = 'date';
        }
        
        newSchema[key] = {
          type: type,
          pii: false,
          masking: 'none'
        };
      }
    }
    return newSchema;
  };
  
  // Handle PII detection
  const handleDetectPii = async () => {
    if (dataset.length === 0) {
      toast.error('Please upload a dataset first');
      return;
    }
    
    setDetectionLoading(true);
    try {
      const results = await detectPiiInData(dataset);
      setPiiFields(results);
      toast.success(`Detected ${results.length} potential PII fields`);
    } catch (error) {
      console.error('Error detecting PII:', error);
      toast.error('Failed to detect PII');
    } finally {
      setDetectionLoading(false);
    }
  };
  
  // Handle data masking
  const handleMaskData = async () => {
    if (dataset.length === 0) {
      toast.error('Please upload a dataset first');
      return;
    }
    
    setMaskingLoading(true);
    try {
      const maskedData = await processDataWithPiiHandling(dataset, maskingRules);
      setDataset(maskedData);
      toast.success('Data masking completed');
    } catch (error) {
      console.error('Error masking data:', error);
      toast.error('Failed to mask data');
    } finally {
      setMaskingLoading(false);
    }
  };
  
  // Handle synthetic data generation
  const handleGenerateSyntheticData = async (count: number) => {
    if (!schema || Object.keys(schema).length === 0) {
      toast.error('Please upload a dataset first');
      return;
    }
    
    setGenerationLoading(true);
    try {
      const generatedData = await generateSyntheticPiiData(schema, count);
      setSyntheticData(generatedData);
      toast.success(`Generated ${count} synthetic data records`);
    } catch (error) {
      console.error('Error generating synthetic data:', error);
      toast.error('Failed to generate synthetic data');
    } finally {
      setGenerationLoading(false);
    }
  };
  
  // Handle schema update
  const handleSchemaUpdate = (newSchema: any) => {
    setSchema(newSchema);
  };
  
  // Handle masking rule update
  const handleMaskingRuleUpdate = (newRules: PiiMaskingRule[]) => {
    setMaskingRules(newRules);
  };

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">PII Data Handling</h1>
          <p className="text-muted-foreground">
            Identify, mask, or synthesize personally identifiable information (PII) in your datasets.
          </p>
        </div>

        <ApiKeyRequirement showUserGuide={<UserGuidePiiHandling />}>
          <Tabs defaultValue="mask" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="mask" className="flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" />
                <span>Mask</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span>Generate</span>
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-1">
                <FileKey className="h-4 w-4" />
                <span>Schema</span>
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Guide</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mask" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShieldAlert className="mr-2 h-5 w-5 text-blue-500" />
                      Masking Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure PII masking settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <FileUploader onFileLoaded={handleFileUpload} accept=".csv,.json" />
                    </div>

                    {columns.length > 0 && (
                      <div className="space-y-4">
                        <Button onClick={handleDetectPii} className="w-full" disabled={detectionLoading}>
                          {detectionLoading ? 'Detecting...' : 'Detect PII'}
                        </Button>

                        <MaskingFieldControl
                          columns={columns}
                          piiFields={piiFields}
                          onMaskingRuleUpdate={handleMaskingRuleUpdate}
                        />

                        <Button onClick={handleMaskData} className="w-full" disabled={maskingLoading}>
                          {maskingLoading ? 'Masking...' : 'Mask Data'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {dataset.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const formattedData = formatData(dataset, 'json');
                          downloadData(formattedData, 'masked_data', 'json');
                          toast.success('Masked data exported successfully');
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Masked Data
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                <div className="md:col-span-2">
                  <ProcessingTypesGuide />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5 text-blue-500" />
                    Synthetic Data Generation
                  </CardTitle>
                  <CardDescription>
                    Generate synthetic PII data based on a schema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PiiDataGenerator
                    schema={schema}
                    onGenerate={handleGenerateSyntheticData}
                    loading={generationLoading}
                    syntheticData={syntheticData}
                  />
                </CardContent>
                <CardFooter>
                  {syntheticData.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const formattedData = formatData(syntheticData, 'json');
                        downloadData(formattedData, 'synthetic_data', 'json');
                        toast.success('Synthetic data exported successfully');
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Synthetic Data
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="schema" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileKey className="mr-2 h-5 w-5 text-blue-500" />
                    Schema Editor
                  </CardTitle>
                  <CardDescription>
                    Edit the schema for PII data handling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SchemaEditor schema={schema} onSchemaUpdate={handleSchemaUpdate} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guide" className="space-y-6">
              <UserGuidePiiHandling />
            </TabsContent>
          </Tabs>
        </ApiKeyRequirement>
      </div>
    </div>
  );
};

export default PiiHandling;
