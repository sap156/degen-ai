
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileUp, FileDown, FileCog, Table, ListFilter, HelpCircle } from 'lucide-react';

const UserGuideDataParsing = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Data Parsing Guide
        </CardTitle>
        <CardDescription>
          Learn how to use the Data Parsing Service to convert and structure data formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="about">
            <AccordionTrigger>What is Data Parsing?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Data Parsing is the process of transforming unstructured or semi-structured data into structured formats 
                that are easier to work with. This service helps you convert between various data formats (JSON, CSV, XML, YAML) 
                and apply transformations to clean and organize your data.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Format Conversion:</span> Convert between JSON, CSV, XML, YAML, and other formats</li>
                <li><span className="font-medium">Schema Detection:</span> Automatically detect data structure and types</li>
                <li><span className="font-medium">Data Cleaning:</span> Apply transformations to normalize and clean data</li>
                <li><span className="font-medium">Sample Generation:</span> Create sample data based on detected schema</li>
                <li><span className="font-medium">AI-Powered:</span> Use AI to help structure and enhance your data</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="howto">
            <AccordionTrigger>How to Use</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Upload or Paste Data:</span> Start by uploading a file or pasting data from your clipboard</li>
                <li><span className="font-medium">Set Source Format:</span> Specify the current format of your data</li>
                <li><span className="font-medium">Choose Target Format:</span> Select the format you want to convert to</li>
                <li><span className="font-medium">Apply Transformations:</span> Add any cleaning or transformation rules</li>
                <li><span className="font-medium">Generate Output:</span> Process your data and view the structured result</li>
                <li><span className="font-medium">Download:</span> Save the processed data in your preferred format</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger>Tips & Best Practices</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Preview your data before running full transformations to ensure the expected results</li>
                <li>For large datasets, consider processing a sample first to validate transformations</li>
                <li>Use schema detection to understand data structure before converting formats</li>
                <li>When working with CSV data, check delimiter settings and header options</li>
                <li>For nested data structures, JSON or YAML often preserves relationships better than flat formats</li>
                <li>Use AI suggestions to help with complex transformations or data restructuring</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="usecases">
            <AccordionTrigger>Common Use Cases</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Data Migration:</span> Convert data between different systems or platforms</li>
                <li><span className="font-medium">API Integration:</span> Transform API responses into formats needed by your application</li>
                <li><span className="font-medium">Data Analysis:</span> Convert unstructured data into formats suitable for analytics tools</li>
                <li><span className="font-medium">Report Generation:</span> Structure data for reports and dashboards</li>
                <li><span className="font-medium">Legacy System Integration:</span> Convert data from older systems into modern formats</li>
                <li><span className="font-medium">Database Import/Export:</span> Prepare data for database operations</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default UserGuideDataParsing;
