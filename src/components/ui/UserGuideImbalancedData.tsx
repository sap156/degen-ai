
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BarChart3, RefreshCw, Database, ChartPie, HelpCircle } from 'lucide-react';

const UserGuideImbalancedData = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Imbalanced Data Handling Guide
        </CardTitle>
        <CardDescription>
          Learn how to balance and optimize skewed datasets for better model performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="about">
            <AccordionTrigger>What is Imbalanced Data Handling?</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Imbalanced data occurs when class distributions in your dataset are significantly skewed. 
                This service helps you identify, analyze, and fix imbalanced datasets using various techniques 
                such as undersampling, oversampling, and synthetic data generation to create more balanced data 
                for improved model training and evaluation.
              </p>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Imbalance Detection:</span> Automatically identify and quantify imbalances in your dataset</li>
                <li><span className="font-medium">AI Recommendations:</span> Get intelligent suggestions for the best balancing strategy</li>
                <li><span className="font-medium">Multiple Balancing Methods:</span> Choose from undersampling, oversampling, SMOTE, and more</li>
                <li><span className="font-medium">Visual Analysis:</span> See distribution changes before and after balancing</li>
                <li><span className="font-medium">Custom Ratio Control:</span> Set specific target ratios for class distributions</li>
                <li><span className="font-medium">Performance Impact:</span> Evaluate how balancing affects potential model performance</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="howto">
            <AccordionTrigger>How to Use</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Upload Dataset:</span> Start by uploading your labeled dataset (CSV, JSON, etc.)</li>
                <li><span className="font-medium">Analyze Imbalance:</span> Run analysis to detect class distributions and imbalance ratio</li>
                <li><span className="font-medium">Get AI Recommendations:</span> Get suggestions for the best balancing strategy</li>
                <li><span className="font-medium">Select Method:</span> Choose from undersampling, oversampling, SMOTE or other techniques</li>
                <li><span className="font-medium">Adjust Target Ratio:</span> Set your desired balance ratio between classes</li>
                <li><span className="font-medium">Apply Balancing:</span> Generate a new balanced dataset based on your settings</li>
                <li><span className="font-medium">Download:</span> Save the balanced dataset for use in your models</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="methods">
            <AccordionTrigger>Balancing Methods Explained</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Undersampling:</span> Reduces instances from majority classes to match minority classes. Simple but may lose valuable information.</li>
                <li><span className="font-medium">Oversampling:</span> Duplicates instances from minority classes to increase their representation. Preserves all data but may lead to overfitting.</li>
                <li><span className="font-medium">SMOTE (Synthetic Minority Over-sampling Technique):</span> Creates synthetic samples for minority classes instead of duplicating. Helps avoid overfitting while maintaining information.</li>
                <li><span className="font-medium">Hybrid Methods:</span> Combines undersampling and oversampling for optimal balance.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger>Tips & Best Practices</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Consider whether balancing is actually needed - sometimes imbalanced data reflects the real-world distribution</li>
                <li>Use stratified sampling in your train-test splits to maintain class proportions</li>
                <li>Compare model performance before and after balancing to ensure improvement</li>
                <li>For extreme imbalances (100:1 or more), consider using SMOTE rather than simple oversampling</li>
                <li>Be cautious with undersampling when working with small datasets</li>
                <li>Consider using balanced evaluation metrics (F1-score, AUC) rather than accuracy</li>
                <li>Apply balancing only to training data, not to validation or test sets</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="usecases">
            <AccordionTrigger>Common Use Cases</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li><span className="font-medium">Fraud Detection:</span> Balance highly skewed fraud datasets for better detection accuracy</li>
                <li><span className="font-medium">Medical Diagnostics:</span> Improve rare disease classification with balanced training data</li>
                <li><span className="font-medium">Customer Churn:</span> Enhance prediction of the minority churn class</li>
                <li><span className="font-medium">Predictive Maintenance:</span> Better identify rare failure events in equipment data</li>
                <li><span className="font-medium">Anomaly Detection:</span> Improve training for identifying unusual patterns or outliers</li>
                <li><span className="font-medium">Credit Risk Assessment:</span> Better identify high-risk applicants in predominantly low-risk data</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default UserGuideImbalancedData;
