
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BarChart3, TrendingUp, Sparkles, FileJson, Download, Upload } from 'lucide-react';

const UserGuideTimeSeriesGenerator = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Series Generator User Guide
        </CardTitle>
        <CardDescription>
          Learn how to generate, manipulate, and visualize time series data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is the Time Series Generator?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  The Time Series Generator is a powerful tool for creating, visualizing, and manipulating time series data for testing, 
                  prototyping, and data science projects. It allows you to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Generate synthetic time series data with different patterns and properties</li>
                  <li>Upload existing time series datasets and enhance them</li>
                  <li>Apply AI-powered modifications to create realistic data patterns</li>
                  <li>Visualize data through interactive charts</li>
                  <li>Export processed data in various formats</li>
                </ul>
                <p>
                  Perfect for data scientists, analysts, and developers who need realistic time series data for testing and development.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="key-features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Interactive Visualization</h4>
                    <p className="text-sm text-muted-foreground">
                      Real-time visualization of your time series data with support for multiple series.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Pattern Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate data with various patterns: random, upward/downward trends, seasonal, and cyclical patterns.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Upload className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Data Import</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload existing CSV or JSON time series data to visualize and enhance.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">AI-Powered Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Use natural language to describe the time series patterns you want, powered by OpenAI.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <FileJson className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Multiple Export Formats</h4>
                    <p className="text-sm text-muted-foreground">
                      Export your generated data in JSON or CSV formats for easy integration with other tools.
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
                  <h4 className="font-medium mb-1">Generating New Time Series Data</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Switch to the <strong>Generate</strong> tab</li>
                    <li>Configure your time series parameters:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Set start and end dates</li>
                        <li>Select time interval (hourly, daily, weekly, monthly)</li>
                        <li>Choose the number of data points</li>
                        <li>Select a trend pattern and noise level</li>
                      </ul>
                    </li>
                    <li>Optionally, enable <strong>Use AI Generation</strong> and provide a prompt</li>
                    <li>Click <strong>Generate</strong> to create your time series data</li>
                    <li>View the visualization and raw data output</li>
                    <li>Download or copy the data as needed</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Working with Existing Data</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Switch to the <strong>Upload</strong> tab</li>
                    <li>Upload a CSV or JSON file containing time series data</li>
                    <li>The system will automatically detect the schema and timestamp field</li>
                    <li>Choose between generating new data or enhancing existing data</li>
                    <li>For AI enhancements, provide instructions for modifying the data</li>
                    <li>Use the form controls to modify or extend your data</li>
                    <li>Download the enhanced dataset when finished</li>
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
                    <strong>AI Prompts:</strong> When using AI generation, be specific about patterns, seasonality, and domain. 
                    For example: "Generate e-commerce sales data with weekly patterns, higher on weekends, and seasonal peaks in December."
                  </li>
                  <li>
                    <strong>Schema Detection:</strong> When uploading data, ensure your CSV or JSON has properly formatted timestamp fields for best results.
                  </li>
                  <li>
                    <strong>Reproducible Results:</strong> Use the same seed value to generate consistent results across multiple generations.
                  </li>
                  <li>
                    <strong>Custom Fields:</strong> Define additional fields to create multi-dimensional time series data, like splitting by region or product category.
                  </li>
                  <li>
                    <strong>Dataset Size:</strong> For complex patterns, generate more data points to make trends clearer in visualization.
                  </li>
                  <li>
                    <strong>API Key:</strong> For AI-powered generation, ensure you've configured your OpenAI API key in the settings.
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
                  <h4 className="font-medium">Machine Learning Model Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate synthetic time series data to train and evaluate forecasting models without requiring sensitive production data.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Dashboard Prototyping</h4>
                  <p className="text-sm text-muted-foreground">
                    Create realistic data to build and test data visualization dashboards and reporting tools.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Anomaly Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Add controlled anomalies to time series data to test anomaly detection algorithms.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Data Augmentation</h4>
                  <p className="text-sm text-muted-foreground">
                    Enhance small datasets by extending them with synthetically generated points that follow similar patterns.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Education and Training</h4>
                  <p className="text-sm text-muted-foreground">
                    Create example datasets for teaching time series analysis concepts and techniques.
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

export default UserGuideTimeSeriesGenerator;
