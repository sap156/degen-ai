
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Download, Copy, Database } from 'lucide-react';
import { generatePiiData } from '@/utils/dataParsingUtils';
import { SchemaFieldType } from '@/utils/fileUploadUtils';
import FileUploader from '@/components/FileUploader';

interface SampleField {
  name: string;
  type: SchemaFieldType;
  sampleValue: string;
}

const PiiDataGenerator: React.FC = () => {
  const [fields, setFields] = useState<SampleField[]>([
    { name: 'full_name', type: 'name', sampleValue: 'John Doe' },
    { name: 'email', type: 'email', sampleValue: 'john.doe@example.com' },
    { name: 'phone', type: 'phone', sampleValue: '(555) 123-4567' }
  ]);
  
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState<number>(10);
  const [dataFormat, setDataFormat] = useState<'json' | 'csv'>('json');
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [uploadedSchema, setUploadedSchema] = useState<Record<string, SchemaFieldType>>({});
  const [displayedData, setDisplayedData] = useState<string>('');

  const handleAddField = () => {
    setFields([...fields, { name: '', type: 'string', sampleValue: '' }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: Partial<SampleField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };

  const handleGenerateData = () => {
    try {
      // Validate fields
      const invalidFields = fields.filter(field => !field.name || !field.type);
      if (invalidFields.length > 0) {
        toast.error('Please fill in all field names and types');
        return;
      }
      
      // Convert fields to schema
      const schema: Record<string, SchemaFieldType> = {};
      fields.forEach(field => {
        schema[field.name] = field.type;
      });
      
      // Create sample data array with one item
      const sampleData = [
        fields.reduce((acc, field) => {
          acc[field.name] = field.sampleValue;
          return acc;
        }, {} as Record<string, any>)
      ];
      
      // Generate data
      const data = generatePiiData(sampleData, schema, rowCount);
      setGeneratedData(data);
      
      // Format for display
      formatDataForDisplay(data);
      
      toast.success(`Generated ${rowCount} records of PII data`);
    } catch (error) {
      console.error('Error generating PII data:', error);
      toast.error('Failed to generate PII data');
    }
  };

  const handleGenerateFromUploaded = () => {
    try {
      if (uploadedData.length === 0) {
        toast.error('Please upload data first');
        return;
      }
      
      // Generate data
      const data = generatePiiData(uploadedData, uploadedSchema, rowCount);
      setGeneratedData(data);
      
      // Format for display
      formatDataForDisplay(data);
      
      toast.success(`Generated ${rowCount} records of PII data`);
    } catch (error) {
      console.error('Error generating PII data from uploaded data:', error);
      toast.error('Failed to generate PII data');
    }
  };

  const formatDataForDisplay = (data: any[]) => {
    if (dataFormat === 'json') {
      setDisplayedData(JSON.stringify(data, null, 2));
    } else {
      // CSV format
      if (data.length === 0) {
        setDisplayedData('');
        return;
      }
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      
      setDisplayedData([headers, ...rows].join('\n'));
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: any[];
        
        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
          if (!Array.isArray(data)) {
            data = [data]; // Convert to array if it's a single object
          }
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing (could be improved with a CSV library)
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
          
          data = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
            return headers.reduce((obj, header, index) => {
              obj[header] = values[index] || '';
              return obj;
            }, {} as Record<string, any>);
          });
        } else {
          toast.error('Unsupported file format');
          return;
        }
        
        if (data.length === 0) {
          toast.error('No data found in file');
          return;
        }
        
        // Detect schema from the data
        const schema: Record<string, SchemaFieldType> = {};
        const sampleItem = data[0];
        
        Object.entries(sampleItem).forEach(([key, value]) => {
          if (typeof value === 'string') {
            if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
              schema[key] = 'email';
            } else if (/^\(\d{3}\) \d{3}-\d{4}$/.test(value) || /^\d{3}-\d{3}-\d{4}$/.test(value)) {
              schema[key] = 'phone';
            } else if (/^\d{3}-\d{2}-\d{4}$/.test(value)) {
              schema[key] = 'ssn';
            } else if (/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(value)) {
              schema[key] = 'creditcard';
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
              schema[key] = 'date';
            } else if (value.split(' ').length === 2 && /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(value)) {
              schema[key] = 'name';
            } else if (value.includes(',') && /\d{5}/.test(value)) {
              schema[key] = 'address';
            } else {
              schema[key] = 'string';
            }
          } else if (typeof value === 'number') {
            schema[key] = Number.isInteger(value) ? 'integer' : 'float';
          } else if (typeof value === 'boolean') {
            schema[key] = 'boolean';
          } else if (value === null) {
            schema[key] = 'string'; // Default
          } else {
            schema[key] = 'object';
          }
        });
        
        setUploadedData(data);
        setUploadedSchema(schema);
        
        // Create fields from the uploaded data
        const newFields = Object.entries(schema).map(([name, type]) => ({
          name,
          type,
          sampleValue: String(sampleItem[name] ?? '')
        }));
        
        setFields(newFields);
        setActiveTab('manual'); // Switch to manual tab to show the fields
        
        toast.success('File successfully processed');
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Failed to process file');
      }
    };
    
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      toast.error('Please upload a JSON or CSV file');
    }
  };

  const handleDownload = () => {
    if (generatedData.length === 0) {
      toast.error('No data to download');
      return;
    }
    
    try {
      const fileContent = dataFormat === 'json' 
        ? JSON.stringify(generatedData, null, 2)
        : displayedData;
        
      const blob = new Blob([fileContent], { 
        type: dataFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pii_data.${dataFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data downloaded successfully');
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data');
    }
  };

  const handleCopyToClipboard = () => {
    if (!displayedData) {
      toast.error('No data to copy');
      return;
    }
    
    navigator.clipboard.writeText(displayedData)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  useEffect(() => {
    if (generatedData.length > 0) {
      formatDataForDisplay(generatedData);
    }
  }, [dataFormat]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>PII Data Generator</CardTitle>
            <CardDescription>
              Generate synthetic personally identifiable information (PII) for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload Schema</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Fields</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddField}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">Field Name</TableHead>
                            <TableHead className="w-[25%]">Type</TableHead>
                            <TableHead className="w-[35%]">Sample Value</TableHead>
                            <TableHead className="w-[10%]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Input
                                  value={field.name}
                                  onChange={(e) => handleFieldChange(index, { name: e.target.value })}
                                  placeholder="Field name"
                                  className="w-full"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={field.type}
                                  onValueChange={(value) => handleFieldChange(index, { type: value as SchemaFieldType })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="string">String</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="phone">Phone</SelectItem>
                                    <SelectItem value="address">Address</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="ssn">SSN</SelectItem>
                                    <SelectItem value="creditcard">Credit Card</SelectItem>
                                    <SelectItem value="integer">Integer</SelectItem>
                                    <SelectItem value="float">Float</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={field.sampleValue}
                                  onChange={(e) => handleFieldChange(index, { sampleValue: e.target.value })}
                                  placeholder="Sample value"
                                  className="w-full"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveField(index)}
                                  disabled={fields.length <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div>
                  <Label className="mb-2 block">Upload JSON or CSV file</Label>
                  <FileUploader
                    onFileUpload={handleFileUpload}
                    accept=".json,.csv"
                    maxSize={5}
                    title="Upload Schema"
                    description="Upload a JSON or CSV file with sample data"
                  />
                </div>
                
                {uploadedData.length > 0 && (
                  <div className="p-4 border rounded-md bg-muted/30">
                    <p className="font-medium mb-2">Detected Schema:</p>
                    <ul className="text-sm space-y-1">
                      {Object.entries(uploadedSchema).map(([field, type]) => (
                        <li key={field}>
                          <span className="font-medium">{field}:</span> {type}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="rowCount" className="whitespace-nowrap">Records:</Label>
              <Input
                id="rowCount"
                type="number"
                value={rowCount}
                onChange={(e) => setRowCount(parseInt(e.target.value) || 10)}
                min={1}
                max={1000}
                className="w-24"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="dataFormat" className="whitespace-nowrap">Format:</Label>
              <Select
                value={dataFormat}
                onValueChange={(value) => setDataFormat(value as 'json' | 'csv')}
              >
                <SelectTrigger id="dataFormat" className="w-24">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="ml-auto"
              onClick={activeTab === 'manual' ? handleGenerateData : handleGenerateFromUploaded}
            >
              Generate Data
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Generated Data</span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyToClipboard}
                  disabled={!displayedData}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  disabled={!displayedData}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Preview of generated PII data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {displayedData ? (
              <pre className="bg-muted/30 p-4 rounded-md overflow-auto h-[500px] text-xs font-mono">
                {displayedData}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <Database className="h-12 w-12 mb-4 text-muted" />
                <p>Generate data to see preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PiiDataGenerator;
