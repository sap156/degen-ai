
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Scale, RefreshCw, FileText, Brain, BarChart, Info, AlertTriangle, CheckCircle } from 'lucide-react';

const UserGuideImbalancedData = () => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Scale className="mr-2 h-5 w-5" />
          Imbalanced Data Handling Guide
        </CardTitle>
        <CardDescription>
          Learn how to use the Imbalanced Data Handling service effectively
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="overview">
            <AccordionTrigger className="text-md font-medium">Overview</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">What is Imbalanced Data?</h3>
                <p className="text-sm text-muted-foreground">
                  Imbalanced datasets occur when one class significantly outnumbers others, which can lead to biased models.
                  This tool helps you identify and fix imbalanced datasets for better machine learning performance.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Upload and visualize class distributions</li>
                  <li>Get AI-powered analysis and recommendations</li>
                  <li>Apply different balancing techniques (undersampling, oversampling, SMOTE)</li>
                  <li>Export balanced datasets for training</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">When to Use This Service</h3>
                <p className="text-sm text-muted-foreground">
                  Use this service when:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Your model performs poorly on minority classes</li>
                  <li>You have classification datasets with skewed class distributions</li>
                  <li>You need synthetic data generation for rare classes</li>
                  <li>You want to improve overall model performance on imbalanced data</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="upload">
            <AccordionTrigger className="text-md font-medium">Data Upload</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Upload Process</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Prepare your dataset in CSV or JSON format</li>
                  <li>Make sure your dataset has a column that contains the class/target variable</li>
                  <li>Click on "Upload Dataset" and select your file</li>
                  <li>The system will attempt to automatically identify class fields</li>
                  <li>After upload, you'll see a visualization of your class distribution</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Supported File Formats</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li><strong>CSV</strong>: Comma-separated values with header row</li>
                  <li><strong>JSON</strong>: Array of objects with consistent properties</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Tips for Better Results</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Clean your data before uploading (remove duplicates, handle missing values)</li>
                  <li>Use clear, descriptive column names</li>
                  <li>Include a column with class/category labels that's easy to identify</li>
                  <li>Keep file size under 10MB for better performance</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="analysis">
            <AccordionTrigger className="text-md font-medium">Analysis</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  After uploading your dataset, the system can analyze it using AI to:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Identify the target/class column</li>
                  <li>Detect majority and minority classes</li>
                  <li>Calculate imbalance ratios</li>
                  <li>Provide customized recommendations for handling your specific imbalance</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Dataset Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  You can manually configure or confirm the AI's detection of:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Target column selection</li>
                  <li>Dataset context (fraud detection, medical diagnosis, etc.)</li>
                  <li>Special handling instructions for your domain</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Note:</strong> Providing accurate configuration improves the quality of AI recommendations.
                </p>
              </div>
              
              <div className="bg-muted p-3 rounded-md text-sm">
                <h4 className="font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-1" />
                  Getting AI Recommendations
                </h4>
                <p className="text-muted-foreground mt-1">
                  After configuring your dataset, click "Get AI Recommendations" to receive tailored advice on:
                </p>
                <ul className="list-disc pl-5 text-muted-foreground mt-1 space-y-1">
                  <li>Best balancing techniques for your specific data</li>
                  <li>Appropriate evaluation metrics</li>
                  <li>Model selection guidance</li>
                  <li>Feature engineering opportunities</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="balancing">
            <AccordionTrigger className="text-md font-medium">Balancing</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Balancing Techniques</h3>
                <div className="space-y-3">
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium">Undersampling</h4>
                    <p className="text-sm text-muted-foreground">
                      Reduces the size of majority classes to match or approach minority classes.
                      <strong> Use when:</strong> You have plenty of majority class data and reducing it won't lose important information.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium">Oversampling</h4>
                    <p className="text-sm text-muted-foreground">
                      Duplicates or slightly modifies minority class samples to increase their representation.
                      <strong> Use when:</strong> You have very limited minority class samples and can't afford to lose any information.
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium">SMOTE (Synthetic Minority Over-sampling Technique)</h4>
                    <p className="text-sm text-muted-foreground">
                      Creates synthetic samples by interpolating between existing minority class samples.
                      <strong> Use when:</strong> Simple oversampling might cause overfitting, and you need more diverse minority samples.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Balancing Process</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Select a balancing method based on your needs or AI recommendations</li>
                  <li>Adjust the target imbalance ratio (lower values = more balanced)</li>
                  <li>Click "Apply Balancing" to generate the balanced dataset</li>
                  <li>Review the new class distribution visualization</li>
                  <li>Export the balanced dataset in your preferred format</li>
                </ol>
              </div>
              
              <div className="bg-muted p-3 rounded-md text-sm">
                <h4 className="font-medium flex items-center">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Tips for Balanced Datasets
                </h4>
                <ul className="list-disc pl-5 text-muted-foreground mt-1 space-y-1">
                  <li>Don't always aim for perfect balance (1:1 ratio)</li>
                  <li>Consider the nature of your problem—some imbalance may be natural</li>
                  <li>Validate performance on both balanced and imbalanced test sets</li>
                  <li>For critical applications, try multiple balancing approaches and compare results</li>
                  <li>Use appropriate evaluation metrics (F1-score, precision-recall AUC) with imbalanced data</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger className="text-md font-medium">Tips</AccordionTrigger>
            <AccordionContent className="space-y-4 mt-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Preparation Tips</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Handle missing values before addressing class imbalance</li>
                  <li>Remove outliers that might skew your balancing efforts</li>
                  <li>Normalize or standardize features for better synthetic data generation</li>
                  <li>Consider domain-specific constraints when balancing (e.g., medical data safety)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Model Evaluation with Imbalanced Data</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Don't rely solely on accuracy—use precision, recall, F1-score, or AUC</li>
                  <li>Consider class-specific metrics (especially for minority classes)</li>
                  <li>Use stratified cross-validation to maintain class proportions</li>
                  <li>Set appropriate classification thresholds based on your specific needs</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Alternative Approaches</h3>
                <p className="text-sm text-muted-foreground">
                  Beyond data balancing, consider these complementary techniques:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Cost-sensitive learning (assign higher misclassification cost to minority classes)</li>
                  <li>Ensemble methods (combine multiple models for better performance)</li>
                  <li>Anomaly detection approaches (for extreme imbalance)</li>
                  <li>Custom loss functions that penalize minority class errors more heavily</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default UserGuideImbalancedData;
