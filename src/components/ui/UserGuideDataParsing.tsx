
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileJson, FileText, FileType2, Wand2, Download, Settings, Info } from 'lucide-react';

const UserGuideDataParsing = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileJson className="mr-2 h-5 w-5" />
          Data Parsing Guide
        </CardTitle>
        <CardDescription>
          Learn how to use the Data Parsing service effectively
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="parsing">Parsing</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What is Data Parsing?</h3>
              <p className="text-sm text-muted-foreground">
                Data parsing is the process of converting data from one format to another, making it usable for different purposes.
                This service helps you transform data between popular formats like CSV, JSON, and plain text.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Features</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Parse CSV files with customizable delimiters and quote characters</li>
                <li>Convert JSON data with support for complex nested structures</li>
                <li>Transform plain text using regular expressions or patterns</li>
                <li>Export parsed data to your preferred format</li>
                <li>Preview and validate transformations before downloading</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">When to Use This Service</h3>
              <p className="text-sm text-muted-foreground">
                Use this service when:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>You need to convert data between different formats</li>
                <li>You're preparing data for import into another system</li>
                <li>You want to extract specific information from structured data</li>
                <li>You need to standardize data formats across multiple sources</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Supported File Formats</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li><strong>CSV</strong> - Comma-separated values files</li>
                <li><strong>JSON</strong> - JavaScript Object Notation files</li>
                <li><strong>Text</strong> - Plain text files that can be parsed with patterns</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">File Upload Process</h3>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Click the upload area or drag and drop your file</li>
                <li>The system will automatically detect the file type based on extension</li>
                <li>File size is limited to 10MB for optimal performance</li>
                <li>After upload, you'll be able to configure parsing options</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">File Preparation Tips</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Ensure your CSV files have consistent delimiters throughout</li>
                <li>Verify your JSON is valid before uploading (use a JSON validator)</li>
                <li>For text files, identify patterns or delimiters for effective parsing</li>
                <li>Remove any sensitive data before uploading</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="parsing" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">CSV Parsing Options</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li><strong>Delimiter</strong> - Character used to separate values (default: comma)</li>
                <li><strong>Quote Character</strong> - Character used to quote fields (default: double quote)</li>
                <li><strong>Has Header</strong> - Toggle whether the first row contains column names</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">JSON Parsing Options</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li><strong>JSON Path</strong> - Optional path to extract specific data from JSON structure</li>
                <li>Examples of JSON path: <code>$.items</code>, <code>$[0].users</code>, <code>$.data.records</code></li>
                <li>Leave empty to parse the entire JSON structure</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Text Parsing Options</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li><strong>Pattern</strong> - Regular expression or delimiter to split the text</li>
                <li>Simple delimiter example: use <code>,</code> to split by commas</li>
                <li>Regex example: <code>\d{3}-\d{2}-\d{4}</code> to extract SSN patterns</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="conversion" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Output Format Options</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li><strong>CSV</strong> - Converts data to comma-separated values</li>
                <li><strong>JSON</strong> - Converts data to a JSON array or object</li>
                <li><strong>Text</strong> - Outputs data as formatted plain text</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Conversion Process</h3>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>After parsing, preview your data to verify correct transformation</li>
                <li>Select your desired output format from the dropdown</li>
                <li>Click "Convert & Download" to generate and download the file</li>
                <li>Downloaded files will be named "converted.[format]"</li>
              </ol>
            </div>
            
            <div className="bg-muted p-3 rounded-md text-sm">
              <h4 className="font-medium flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Data Preservation Notes
              </h4>
              <p className="text-muted-foreground mt-1">
                When converting between formats:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground mt-1 space-y-1">
                <li>CSV to JSON: Column names become JSON property names</li>
                <li>JSON to CSV: Object properties become column names</li>
                <li>Complex nested objects may be flattened or stringified</li>
                <li>Data types are preserved when possible</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Best Practices</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Use consistent naming conventions across formats</li>
                <li>Validate your input data before parsing to avoid errors</li>
                <li>For large files, consider splitting them into smaller chunks</li>
                <li>Use preview functionality to verify transformation before downloading</li>
                <li>Keep a copy of your original data before transformation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Common Issues and Solutions</h3>
              <div className="space-y-2">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">CSV Parsing Errors</h4>
                  <p className="text-sm text-muted-foreground">
                    If your CSV isn't parsing correctly, check for inconsistent delimiters, 
                    mismatched quotes, or special characters. Try adjusting the delimiter 
                    and quote character settings.
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">JSON Structure Issues</h4>
                  <p className="text-sm text-muted-foreground">
                    Invalid JSON will fail to parse. Verify your JSON with a validator, 
                    check for missing commas, unmatched brackets, or quotes. For complex 
                    structures, use JSON Path to extract specific sections.
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Character Encoding Problems</h4>
                  <p className="text-sm text-muted-foreground">
                    If you see garbled text or strange characters, your file might use a 
                    non-standard encoding. Try saving your file as UTF-8 before uploading.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Advanced Tips</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>For complex data structures, convert to JSON first, then to other formats</li>
                <li>Use text parsing with regex for extracting specific patterns from logs or unstructured text</li>
                <li>When converting to CSV, consider how nested data will be represented in a flat structure</li>
                <li>For repeated transformations, document your parsing settings for consistency</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserGuideDataParsing;
