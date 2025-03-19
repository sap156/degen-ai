
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, FilePlus, FileSearch, Table, FileText, Scan } from 'lucide-react';

const UserGuideDataExtraction = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Data Extraction User Guide
        </CardTitle>
        <CardDescription>
          Learn how to extract structured data from unstructured sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is Data Extraction?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Data Extraction is the process of retrieving structured information from unstructured or semi-structured sources.
                  This service helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Extract data from websites, PDFs, documents, and images</li>
                  <li>Convert unstructured text into structured, analyzable data</li>
                  <li>Identify and extract specific patterns and entities</li>
                  <li>Organize extracted information into usable formats</li>
                  <li>Automate repetitive information gathering tasks</li>
                </ul>
                <p>
                  Data extraction is essential for digitizing information, building datasets from diverse sources, and transforming 
                  raw content into valuable, structured data for analysis.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="key-features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Document Extraction</h4>
                    <p className="text-sm text-muted-foreground">
                      Extract structured data from PDFs, Word documents, spreadsheets, and other file formats.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Web Extraction</h4>
                    <p className="text-sm text-muted-foreground">
                      Retrieve data from websites, HTML pages, and web content with targeted extraction.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Scan className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">OCR Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Convert text in images and scanned documents into machine-readable content.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <FileSearch className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">AI-Powered Extraction</h4>
                    <p className="text-sm text-muted-foreground">
                      Use machine learning to identify and extract relevant information even from complex sources.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Table className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Table Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically identify and extract tabular data from documents and web pages.
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
                  <h4 className="font-medium mb-1">Document Data Extraction</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your document (PDF, DOCX, XLS, etc.)</li>
                    <li>Select the extraction mode:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Full extraction (all content)</li>
                        <li>Pattern-based (specific formats like invoices, forms)</li>
                        <li>Target fields (extract only certain information)</li>
                      </ul>
                    </li>
                    <li>Configure extraction settings if needed</li>
                    <li>Click <strong>Extract Data</strong></li>
                    <li>Review the extracted content</li>
                    <li>Edit and refine if necessary</li>
                    <li>Export to your preferred format (CSV, JSON, Excel)</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Web Content Extraction</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Enter the URL of the webpage</li>
                    <li>Choose what to extract:
                      <ul className="list-disc pl-6 mt-1">
                        <li>All text content</li>
                        <li>Tables only</li>
                        <li>Specific elements (by CSS selector)</li>
                        <li>Custom pattern matching</li>
                      </ul>
                    </li>
                    <li>Configure any additional settings (pagination, authentication)</li>
                    <li>Click <strong>Extract From Web</strong></li>
                    <li>Review and organize the extracted data</li>
                    <li>Save or export the results</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">AI-Powered Extraction</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your source document or enter URL</li>
                    <li>Describe in natural language what information you need</li>
                    <li>Optionally provide examples of the data format you want</li>
                    <li>Click <strong>AI Extract</strong></li>
                    <li>Review the AI-extracted data</li>
                    <li>Refine your request if needed</li>
                    <li>Export the structured results</li>
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
                    <strong>Sample Testing:</strong> Start with a small subset of your documents to test and refine 
                    extraction settings before processing your entire collection.
                  </li>
                  <li>
                    <strong>Pre-processing:</strong> For better results with scanned documents, ensure they're properly 
                    aligned and have sufficient resolution before extraction.
                  </li>
                  <li>
                    <strong>Templates:</strong> For recurring document formats (like invoices or forms), create extraction 
                    templates to improve accuracy and consistency.
                  </li>
                  <li>
                    <strong>Validation Rules:</strong> Set up validation rules to automatically flag potentially incorrect 
                    extracted data (unusual values, wrong formats, etc.).
                  </li>
                  <li>
                    <strong>AI Guidance:</strong> When using AI extraction, provide clear and specific instructions about 
                    what data you need and its expected format.
                  </li>
                  <li>
                    <strong>Post-Processing:</strong> Consider applying data cleaning and normalization after extraction 
                    to standardize formats and values.
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
                  <h4 className="font-medium">Invoice Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Extract vendor details, line items, amounts, and dates from invoices for accounting systems.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Research Data Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    Gather structured data from academic papers, reports, and web sources for analysis.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Contract Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Extract key terms, dates, obligations, and parties from legal contracts and agreements.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Competitive Intelligence</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor competitor websites and extract pricing, product features, and other market information.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Form Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Convert paper or PDF forms into structured digital data for database entry and analysis.
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

export default UserGuideDataExtraction;
