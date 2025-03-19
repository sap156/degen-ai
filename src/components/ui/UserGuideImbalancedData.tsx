
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, BarChart3, TrendingUp, Plus, Minus, Sparkles } from 'lucide-react';

const UserGuideImbalancedData = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Imbalanced Data Handling User Guide
        </CardTitle>
        <CardDescription>
          Learn how to detect and address class imbalances in your datasets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is Imbalanced Data Handling?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Imbalanced data occurs when the classes or categories in your dataset are not represented equally. 
                  This service helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Identify and visualize class imbalances in your datasets</li>
                  <li>Apply various techniques to balance your data</li>
                  <li>Generate synthetic samples for underrepresented classes</li>
                  <li>Evaluate the effectiveness of balancing techniques</li>
                  <li>Implement specialized algorithms for handling imbalanced data</li>
                </ul>
                <p>
                  Properly handling imbalanced data is crucial for building accurate and fair machine learning models, 
                  especially in fields like fraud detection, medical diagnosis, or rare event prediction.
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
                    <h4 className="font-medium">Imbalance Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically analyze class distributions and identify significant imbalances in your data.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Plus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Oversampling Techniques</h4>
                    <p className="text-sm text-muted-foreground">
                      Apply various methods to increase samples in minority classes, including SMOTE and ADASYN.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Minus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Undersampling Techniques</h4>
                    <p className="text-sm text-muted-foreground">
                      Reduce samples from majority classes using methods like random undersampling and cluster centroids.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">AI-Powered Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Create high-quality synthetic samples for minority classes using advanced AI techniques.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Performance Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Evaluate model performance before and after balancing to measure the impact of your adjustments.
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
                  <h4 className="font-medium mb-1">Analyzing Class Imbalance</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your dataset in CSV or JSON format</li>
                    <li>Select the target column (class label)</li>
                    <li>Click <strong>Analyze Imbalance</strong> to visualize class distribution</li>
                    <li>Review the imbalance metrics and visualization</li>
                    <li>Identify which classes are underrepresented</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Balancing Your Dataset</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>After analysis, select balancing approach:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Oversampling (increase minority class samples)</li>
                        <li>Undersampling (reduce majority class samples)</li>
                        <li>Hybrid approach (combination of both)</li>
                        <li>AI-powered synthetic generation</li>
                      </ul>
                    </li>
                    <li>Configure specific techniques and parameters</li>
                    <li>Apply the selected balancing method</li>
                    <li>Review the updated class distribution</li>
                    <li>Export the balanced dataset</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Evaluating Results</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Use the comparison tool to evaluate original vs. balanced data</li>
                    <li>Review performance metrics for different balancing techniques</li>
                    <li>Adjust parameters as needed based on results</li>
                    <li>Select the best approach for your specific use case</li>
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
                    <strong>Understand Your Metrics:</strong> Different evaluation metrics respond differently to class imbalance. 
                    Prioritize metrics like precision, recall, F1-score, and AUC over simple accuracy.
                  </li>
                  <li>
                    <strong>Try Multiple Approaches:</strong> No single balancing technique works best for all datasets. 
                    Experiment with different methods and compare their performance.
                  </li>
                  <li>
                    <strong>Consider Data Quality:</strong> When generating synthetic samples, ensure they maintain the 
                    statistical properties and relationships present in the original data.
                  </li>
                  <li>
                    <strong>Domain Relevance:</strong> Some domains naturally have imbalanced data (e.g., fraud detection). 
                    Consider whether balancing is appropriate or if specialized algorithms might be better.
                  </li>
                  <li>
                    <strong>Validation Strategy:</strong> Use stratified sampling in your cross-validation to maintain 
                    class proportions across training and validation sets.
                  </li>
                  <li>
                    <strong>Processing Order:</strong> Apply class balancing after feature engineering but before model training 
                    to avoid data leakage.
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
                  <h4 className="font-medium">Fraud Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Balance highly skewed fraud datasets to improve detection of rare fraudulent transactions.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Medical Diagnosis</h4>
                  <p className="text-sm text-muted-foreground">
                    Enhance rare disease detection by balancing patient datasets with low prevalence conditions.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Customer Churn Prediction</h4>
                  <p className="text-sm text-muted-foreground">
                    Improve identification of customers likely to leave when churn events are relatively rare.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Predictive Maintenance</h4>
                  <p className="text-sm text-muted-foreground">
                    Enhance failure prediction models when equipment failure data is significantly less common than normal operation data.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Network Intrusion Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Improve security systems by balancing datasets where malicious network activities are underrepresented.
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

export default UserGuideImbalancedData;
