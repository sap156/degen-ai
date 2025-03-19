
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Plus, Sparkles, ArrowRightLeft, FileSearch, Wand2 } from 'lucide-react';

const UserGuideDataAugmentation = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Data Augmentation User Guide
        </CardTitle>
        <CardDescription>
          Learn how to enhance, transform, and expand your datasets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is Data Augmentation?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Data Augmentation is a technique for increasing the amount and diversity of data available for training 
                  machine learning models, without actually collecting new data. This service helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Enhance existing datasets with additional synthetic samples</li>
                  <li>Apply transformations to create variations of existing data</li>
                  <li>Balance imbalanced datasets for better model performance</li>
                  <li>Generate edge cases and rare scenarios for robust testing</li>
                  <li>Use AI to intelligently augment data based on existing patterns</li>
                </ul>
                <p>
                  This is especially valuable when you have limited data but need more samples to train effective machine learning models.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="key-features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Plus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Synthetic Sample Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Create new data samples that maintain the statistical properties of your original dataset.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Data Transformations</h4>
                    <p className="text-sm text-muted-foreground">
                      Apply various transformations to create modified versions of existing data points.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <FileSearch className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Schema Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect data types and structure to apply appropriate augmentation techniques.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">AI-Powered Augmentation</h4>
                    <p className="text-sm text-muted-foreground">
                      Use OpenAI to intelligently generate new data samples based on existing patterns and relationships.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Wand2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Custom Rules</h4>
                    <p className="text-sm text-muted-foreground">
                      Define specific rules and constraints for the augmentation process to maintain data validity.
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
                  <h4 className="font-medium mb-1">Basic Data Augmentation</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your dataset in CSV or JSON format</li>
                    <li>Review the detected schema and adjust if necessary</li>
                    <li>Configure augmentation parameters:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Number of new samples to generate</li>
                        <li>Fields to include in augmentation</li>
                        <li>Transformation types for each field</li>
                        <li>Constraints to maintain data validity</li>
                      </ul>
                    </li>
                    <li>Click <strong>Generate</strong> to create augmented data</li>
                    <li>Review the results and download the enhanced dataset</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">AI-Powered Augmentation</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your dataset as above</li>
                    <li>Enable the <strong>AI Augmentation</strong> option</li>
                    <li>Provide a description of how you want the data augmented</li>
                    <li>Set any constraints for the AI to follow</li>
                    <li>Generate the augmented dataset</li>
                    <li>Review and refine as needed</li>
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
                    <strong>Preserve Relationships:</strong> When augmenting structured data, ensure that relationships between 
                    fields are maintained (e.g., if age and income are correlated, they should remain so in augmented data).
                  </li>
                  <li>
                    <strong>Field-Specific Settings:</strong> Use different augmentation strategies for different field types 
                    (categorical, numerical, text, etc.) for more realistic results.
                  </li>
                  <li>
                    <strong>Start Small:</strong> Begin with a small augmentation ratio (e.g., 20% new data) and gradually 
                    increase as needed, evaluating quality at each step.
                  </li>
                  <li>
                    <strong>Validation:</strong> Always validate augmented data to ensure it maintains the statistical 
                    properties of the original dataset and doesn't introduce bias.
                  </li>
                  <li>
                    <strong>AI Guidance:</strong> When using AI augmentation, provide detailed context about the domain 
                    and constraints to get more accurate results.
                  </li>
                  <li>
                    <strong>Domain Knowledge:</strong> Incorporate domain knowledge when setting constraints to ensure 
                    generated data remains realistic and valid.
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
                  <h4 className="font-medium">Enhancing Small Datasets</h4>
                  <p className="text-sm text-muted-foreground">
                    Increase the size of limited datasets to improve machine learning model training and reduce overfitting.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Balancing Class Distribution</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate additional samples for underrepresented classes to create balanced datasets for classification tasks.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Creating Test Scenarios</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate variations of existing data to test system behavior under different conditions.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Privacy Preservation</h4>
                  <p className="text-sm text-muted-foreground">
                    Create synthetic data that maintains the statistical properties of sensitive data without exposing actual records.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Edge Case Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Create rare but important scenarios to improve model robustness and system testing.
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

export default UserGuideDataAugmentation;
