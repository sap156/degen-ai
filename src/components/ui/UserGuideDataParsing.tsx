
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileJson, FileText, FileType2, FileCode, Settings } from 'lucide-react';

const UserGuideDataParsing = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileType2 className="mr-2 h-5 w-5" />
          Data Parsing Guide
        </CardTitle>
        <CardDescription>
          Learn how to effectively use the Data Parsing service
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="formats">File Formats</TabsTrigger>
            <TabsTrigger value="parsing">Parsing Options</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What is Data Parsing?</h3>
              <p className="text-sm text-muted-foreground">
                Data parsing is the process of converting data from one format to another, extracting meaningful information,
                and transforming it into a structure that's easier to work with. This service helps you parse various file 
                formats and convert between them with powerful customization options.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Features</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Upload and parse data from multiple formats (CSV, JSON, XML, Text)</li>
                <li>Preview parsed data structure</li>
                <li>Convert between different formats</li>
                <li>Customize parsing options for each format</li>
                <li>Clean and transform data during parsing</li>
                <li>Export the parsed data in your desired format</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">When to Use This Service</h3>
              <p className="text-sm text-muted-foreground">
                Use this service when:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>You need to convert data between different formats</li>
                <li>You're working with complex or nested data structures</li>
                <li>You need to clean or standardize data formatting</li>
                <li>You're preparing data for analysis or import into another system</li>
                <li>You need to extract specific information from larger datasets</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="formats" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Supported File Formats</h3>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    CSV (Comma-Separated Values)
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tabular data where each row is a record and columns are separated by commas.
                    Best for: Simple tabular data, spreadsheet exports, database exports.
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium flex items-center">
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON (JavaScript Object Notation)
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Structured data in a key-value format that can handle nested values and arrays.
                    Best for: Complex data structures, API responses, configuration files.
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium flex items-center">
                    <FileCode className="h-4 w-4 mr-2" />
                    XML (eXtensible Markup Language)
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tag-based markup language for structured data with attributes and nested elements.
                    Best for: Document-oriented data, SOAP APIs, configuration files, data with metadata.
                  </p>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium flex items-center">
                    <FileType2 className="h-4 w-4 mr-2" />
                    Plain Text
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unformatted text data that can be parsed using delimiters or regular expressions.
                    Best for: Logs, simple data records, custom formatted data.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">File Format Guidelines</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li><strong>CSV:</strong> Include header row, escape quotes properly, consistent column count</li>
                <li><strong>JSON:</strong> Valid JSON syntax, consistent object structure for arrays</li>
                <li><strong>XML:</strong> Well-formed with proper opening/closing tags, valid namespace declarations</li>
                <li><strong>Text:</strong> Consistent delimiters or patterns for effective parsing</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="parsing" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Parsing Options</h3>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">CSV Parsing Options</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Delimiter:</strong> Choose between comma, tab, semicolon, or custom</li>
                    <li><strong>Header Row:</strong> Toggle whether first row contains column names</li>
                    <li><strong>Quote Character:</strong> Specify character used for quoting text fields</li>
                    <li><strong>Type Detection:</strong> Automatically convert to appropriate data types</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">JSON Parsing Options</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Path Selection:</strong> Select specific paths within JSON structure</li>
                    <li><strong>Array Handling:</strong> Choose how to process arrays (flatten, keep as-is)</li>
                    <li><strong>Flattening:</strong> Convert nested objects to flat structure with dot notation</li>
                    <li><strong>Date Formatting:</strong> Parse date strings to standardized formats</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">XML Parsing Options</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>XPath:</strong> Extract specific nodes using XPath queries</li>
                    <li><strong>Attribute Handling:</strong> Include attributes as properties or separate</li>
                    <li><strong>Namespace Handling:</strong> Preserve namespaces or strip them</li>
                    <li><strong>Text Nodes:</strong> Configure handling of mixed content</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Text Parsing Options</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li><strong>Pattern Matching:</strong> Use regular expressions or fixed positions</li>
                    <li><strong>Line Separator:</strong> Configure how to identify record boundaries</li>
                    <li><strong>Field Extraction:</strong> Define rules for extracting fields</li>
                    <li><strong>Preprocessing:</strong> Strip whitespace, normalize case, etc.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-md text-sm">
              <h4 className="font-medium flex items-center">
                <Settings className="h-4 w-4 mr-1" />
                Advanced Parsing Tips
              </h4>
              <ul className="list-disc pl-5 text-muted-foreground mt-1 space-y-1">
                <li>For large files, use streaming options to reduce memory usage</li>
                <li>Set explicit data types when automatic detection is unreliable</li>
                <li>Use sample datasets to verify parsing configuration before processing the full dataset</li>
                <li>Consider breaking very complex files into multiple parsing steps</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="conversion" className="space-y-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Format Conversion Process</h3>
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Upload your source file in any supported format</li>
                <li>Configure parsing options specific to your source format</li>
                <li>Preview the parsed data structure</li>
                <li>Select your desired output format</li>
                <li>Configure format-specific output options</li>
                <li>Apply any transformations or filters</li>
                <li>Generate and download the converted file</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Conversion Challenges</h3>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Handling Structural Differences</h4>
                  <p className="text-sm text-muted-foreground">
                    Converting between different format types may require structural transformation:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1">
                    <li>Flat data to nested (CSV → JSON/XML) requires grouping configuration</li>
                    <li>Nested data to flat (JSON/XML → CSV) requires flattening strategy</li>
                    <li>Converting text to structured formats needs explicit field mapping</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-3">
                  <h4 className="font-medium">Data Type Preservation</h4>
                  <p className="text-sm text-muted-foreground">
                    Different formats have different type systems:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1">
                    <li>JSON distinguishes between numbers, strings, booleans, etc.</li>
                    <li>CSV stores everything as text, requiring explicit conversion</li>
                    <li>XML attributes are always strings, element content can be mixed</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Conversion Best Practices</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Validate your input data before conversion</li>
                <li>Handle special characters and encoding issues appropriately</li>
                <li>Consider data size limits and performance implications</li>
                <li>Preserve metadata where possible or document lost information</li>
                <li>Test converted data in its intended environment</li>
                <li>Use data cleaning options to standardize format during conversion</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserGuideDataParsing;
