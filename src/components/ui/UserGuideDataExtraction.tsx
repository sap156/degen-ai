
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Globe, Image, FileJson, FileText, Wand2, Download, MessageSquare, Search } from 'lucide-react';

const UserGuideDataExtraction = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Data Extraction Guide
        </CardTitle>
        <CardDescription>
          Learn how to use the Data Extraction service effectively
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger className="text-md font-medium">Overview</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">What is Data Extraction?</h3>
                <p className="text-sm text-muted-foreground">
                  Data extraction is the process of retrieving structured information from websites, documents, or images.
                  This service helps you extract data using AI to identify and structure the content.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Extract tables, lists, and text from web pages</li>
                  <li>Extract text and data from images using OCR</li>
                  <li>Structured JSON output for easy integration</li>
                  <li>Ask follow-up questions about extracted data</li>
                  <li>Download extracted data in various formats</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">When to Use This Service</h3>
                <p className="text-sm text-muted-foreground">
                  Use this service when:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>You need to scrape data from websites without writing code</li>
                  <li>You want to extract text from images or scanned documents</li>
                  <li>You need to convert semi-structured data into structured formats</li>
                  <li>You need to analyze data from multiple sources quickly</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="web-extraction">
            <AccordionTrigger className="text-md font-medium">Web Extraction</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Extraction Types</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li><strong>Tables</strong> - Extract structured tabular data from web pages</li>
                  <li><strong>Lists</strong> - Extract bulleted or numbered lists from web content</li>
                  <li><strong>Main Text Content</strong> - Extract the primary text content, ignoring navigation and ads</li>
                  <li><strong>Full Page (JSON)</strong> - Convert the entire page into a structured JSON representation</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Web Extraction Process</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Enter the URL of the website you want to extract data from</li>
                  <li>Select the type of data you want to extract</li>
                  <li>Optionally, enter a specific question to focus the extraction</li>
                  <li>Click "Extract" to begin the process</li>
                  <li>Review the extracted data in the results panel</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">URL Preparation Tips</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Use specific URLs that lead directly to the data you want to extract</li>
                  <li>For better results, use pages with well-structured content</li>
                  <li>Some websites may block extraction attempts or require authentication</li>
                  <li>Dynamic content loaded by JavaScript may not be fully captured</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="image-extraction">
            <AccordionTrigger className="text-md font-medium">Image Extraction</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Supported Image Types</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>JPG/JPEG - Standard image format</li>
                  <li>PNG - Lossless image format, good for screenshots</li>
                  <li>WebP - Modern image format with good compression</li>
                  <li>TIFF - High-quality image format often used for scans</li>
                  <li>PDF - Document format that can contain text and images</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Extraction Types for Images</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li><strong>Key-Value Pairs</strong> - Extract structured data like forms, receipts, or invoices</li>
                  <li><strong>Full Text (OCR)</strong> - Extract all text visible in the image</li>
                  <li><strong>Structured Content</strong> - Convert image content into a structured JSON format</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Image Extraction Process</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Upload one or more images by dragging and dropping or using the file selector</li>
                  <li>Select the type of data you want to extract</li>
                  <li>Optionally, enter a specific question to focus the extraction</li>
                  <li>Click "Analyze Images" to begin the process</li>
                  <li>Review the extracted data in the results panel</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Image Quality Tips</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Use clear, high-resolution images for best results</li>
                  <li>Ensure text in images is not distorted or at extreme angles</li>
                  <li>Good lighting and contrast improve text recognition accuracy</li>
                  <li>Remove unnecessary elements from images to improve focus</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="follow-up">
            <AccordionTrigger className="text-md font-medium">Follow-up Analysis</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">What is Follow-up Analysis?</h3>
                <p className="text-sm text-muted-foreground">
                  After extracting data, you can ask follow-up questions to further analyze or filter the information.
                  This is useful for finding specific insights within large datasets or exploring relationships between data points.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Example Questions</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>"What are the most expensive items in this product list?"</li>
                  <li>"Summarize the key points from this extracted article."</li>
                  <li>"Compare the specifications of these two products."</li>
                  <li>"Extract all email addresses and phone numbers from this data."</li>
                  <li>"What trends can you identify in this price data?"</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">How to Use Follow-up Analysis</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>First extract data from a web page or image</li>
                  <li>Review the initial extracted data</li>
                  <li>Type your follow-up question in the analysis box</li>
                  <li>Click "Analyze" to process your question</li>
                  <li>View the AI's response, which will replace the previous results</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger className="text-md font-medium">Tips</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Best Practices</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Be specific in your extraction queries for more accurate results</li>
                  <li>Use follow-up questions to refine and filter large extractions</li>
                  <li>Download results in your preferred format for further processing</li>
                  <li>For complex data, extract as JSON then post-process as needed</li>
                  <li>Use the Copy button to quickly use extracted data in other applications</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Common Issues and Solutions</h3>
                <div className="space-y-2">
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium">Website Access Issues</h4>
                    <p className="text-sm text-muted-foreground">
                      If a website blocks extraction, try using a publicly accessible page or a page that doesn't 
                      require authentication. Some websites use anti-scraping measures that can prevent extraction.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium">OCR Accuracy Problems</h4>
                    <p className="text-sm text-muted-foreground">
                      If text from images is not being recognized accurately, try using higher resolution images, 
                      ensuring good contrast between text and background, and avoiding skewed or rotated text.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium">Dynamic Content Not Captured</h4>
                    <p className="text-sm text-muted-foreground">
                      Content that loads dynamically with JavaScript may not be fully captured. For such cases, 
                      you may need to use a browser to load the page fully before attempting extraction.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Handling Tips</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Respect website terms of service when extracting data</li>
                  <li>Be cautious with personally identifiable information (PII)</li>
                  <li>Verify extracted data for accuracy before using it critically</li>
                  <li>For recurring extractions, document your process for consistency</li>
                  <li>Consider data privacy laws when storing or sharing extracted information</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default UserGuideDataExtraction;
