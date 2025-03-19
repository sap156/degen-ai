
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileJson, Settings, RefreshCw, FileCheck, ArrowRightLeft, Database } from 'lucide-react';

const UserGuideDataParsing = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Data Parsing User Guide
        </CardTitle>
        <CardDescription>
          Learn how to parse, transform, and normalize data from various formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is Data Parsing?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Data Parsing is the process of converting data from one format to another, often extracting structured information 
                  from semi-structured or unstructured sources. This service helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Parse data from various file formats (CSV, JSON, XML, etc.)</li>
                  <li>Clean and normalize inconsistent data</li>
                  <li>Transform data structures to match your requirements</li>
                  <li>Extract specific fields and values from complex formats</li>
                  <li>Validate data against schemas and fix common errors</li>
                </ul>
                <p>
                  Effective data parsing is essential for data integration, migration, and preparing raw data for analysis or machine learning.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="key-features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Multi-format Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Parse data from CSV, JSON, XML, YAML, and other common formats with automatic format detection.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Settings className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Schema Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically analyze and infer data types, structure, and relationships in your datasets.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Data Transformation</h4>
                    <p className="text-sm text-muted-foreground">
                      Convert between formats, restructure hierarchies, and reshape data to meet your needs.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Validation & Cleaning</h4>
                    <p className="text-sm text-muted-foreground">
                      Check data against schemas, clean inconsistencies, and fix common parsing errors.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Custom Mapping</h4>
                    <p className="text-sm text-muted-foreground">
                      Define field mappings and transformations to convert from source to target formats.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="how-to-use">
            <AccordionTrigger>How to Use</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Basic Data Parsing</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your data file or paste content directly</li>
                    <li>The system will automatically detect the format</li>
                    <li>Review the detected schema and structure</li>
                    <li>Configure parsing options if needed</li>
                    <li>Click <strong>Parse Data</strong> to process the input</li>
                    <li>Explore the parsed results in tabular or hierarchical view</li>
                    <li>Export the processed data in your desired format</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Advanced Transformations</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>After basic parsing, navigate to the <strong>Transform</strong> tab</li>
                    <li>Define field mappings between source and target formats</li>
                    <li>Configure transformations for specific fields:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Type conversions (string to date, number formatting, etc.)</li>
                        <li>Value normalization (case standardization, unit conversion)</li>
                        <li>Field splitting or combining</li>
                        <li>Hierarchical restructuring</li>
                      </ul>
                    </li>
                    <li>Apply transformations to preview results</li>
                    <li>Iterate and refine as needed</li>
                    <li>Export the transformed data</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Schema Validation</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to the <strong>Validate</strong> tab</li>
                    <li>Define a target schema or import an existing one</li>
                    <li>Run validation against your parsed data</li>
                    <li>Review validation errors and warnings</li>
                    <li>Apply automatic fixes where available</li>
                    <li>Export validated and compliant data</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger>Tips and Best Practices</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Sample First:</strong> When working with large datasets, parse a small sample first to 
                    verify settings and transformations before processing the entire file.
                  </li>
                  <li>
                    <strong>Handle Missing Values:</strong> Decide on a consistent strategy for handling missing values 
                    (null, empty string, default value) before parsing.
                  </li>
                  <li>
                    <strong>Preserve Raw Data:</strong> Keep a copy of your original data before parsing and transforming, 
                    especially when working with irreplaceable sources.
                  </li>
                  <li>
                    <strong>Encoding Matters:</strong> Pay attention to character encoding, especially when parsing 
                    international text or data from legacy systems.
                  </li>
                  <li>
                    <strong>Validate Early:</strong> Define validation rules early in the process to catch issues 
                    before they propagate through your data pipeline.
                  </li>
                  <li>
                    <strong>Document Transformations:</strong> Keep track of all parsing rules and transformations 
                    applied to maintain data lineage and reproducibility.
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="use-cases">
            <AccordionTrigger>Common Use Cases</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">Data Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Combine data from different sources and formats into a unified structure for analysis or storage.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Legacy System Migration</h4>
                  <p className="text-sm text-muted-foreground">
                    Convert data from outdated formats to modern structures when upgrading systems or applications.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">API Response Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Parse and transform JSON or XML responses from external APIs into formats suitable for your application.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Data Cleaning</h4>
                  <p className="text-sm text-muted-foreground">
                    Standardize inconsistent data by parsing and applying normalization rules before analysis.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Report Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Extract specific fields and metrics from complex data structures to create standardized reports.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default UserGuideDataParsing;
