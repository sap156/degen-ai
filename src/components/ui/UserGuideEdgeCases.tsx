
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bug, FileSearch, Wand2, BarChart3, Layers, FileText } from 'lucide-react';

const UserGuideEdgeCases = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Edge Cases User Guide
        </CardTitle>
        <CardDescription>
          Learn how to identify, generate, and test against edge cases in your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What are Edge Cases?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Edge cases are unusual or extreme scenarios that occur at the boundaries of normal operation. 
                  This service helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Identify potential edge cases in your existing datasets</li>
                  <li>Generate synthetic edge cases for thorough testing</li>
                  <li>Assess how your models and systems handle these unusual scenarios</li>
                  <li>Create detailed reports on edge case impact</li>
                  <li>Get recommendations for improving system robustness</li>
                </ul>
                <p>
                  Understanding and handling edge cases is crucial for building reliable, robust systems that can handle 
                  unexpected inputs and situations.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="key-features">
            <AccordionTrigger>Key Features</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <FileSearch className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Edge Case Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically identify outliers, anomalies, and boundary conditions in your existing data.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Wand2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Synthetic Edge Case Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Create realistic but extreme data points to test system behaviors in unusual conditions.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Model Testing</h4>
                    <p className="text-sm text-muted-foreground">
                      Evaluate how your ML models and systems perform when faced with edge cases.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Detailed Reporting</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate comprehensive reports on edge case analysis and potential system vulnerabilities.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Layers className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Implementation Guidance</h4>
                    <p className="text-sm text-muted-foreground">
                      Get practical recommendations for handling detected edge cases in your systems.
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
                  <h4 className="font-medium mb-1">Detecting Edge Cases</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your dataset in CSV or JSON format</li>
                    <li>Select the target column to analyze for edge cases</li>
                    <li>Configure detection settings:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Choose edge case type (outliers, boundary values, etc.)</li>
                        <li>Set complexity level</li>
                        <li>Define additional constraints if needed</li>
                      </ul>
                    </li>
                    <li>Click <strong>Detect Edge Cases</strong> to analyze your data</li>
                    <li>Review the identified edge cases and their details</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Generating Synthetic Edge Cases</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload a reference dataset</li>
                    <li>Select the target column and features to include</li>
                    <li>Choose generation method (AI-based or rule-based)</li>
                    <li>Set complexity and diversity parameters</li>
                    <li>Generate synthetic edge cases</li>
                    <li>Review and export the created cases</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Testing and Reporting</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Select both regular data and edge cases</li>
                    <li>Configure testing parameters</li>
                    <li>Run the simulated model test</li>
                    <li>Review performance metrics and analysis</li>
                    <li>Generate a detailed report</li>
                    <li>Get implementation recommendations</li>
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
                    <strong>Domain Knowledge:</strong> Incorporate domain expertise when defining what constitutes 
                    an edge case in your specific context.
                  </li>
                  <li>
                    <strong>Balanced Complexity:</strong> Start with lower complexity settings and gradually increase 
                    to avoid generating unrealistic edge cases.
                  </li>
                  <li>
                    <strong>Comprehensive Testing:</strong> Test with both detected edge cases from real data and 
                    synthetic edge cases for the most thorough evaluation.
                  </li>
                  <li>
                    <strong>Prioritize Impact:</strong> Focus on edge cases with the highest potential impact on 
                    your system or business outcomes.
                  </li>
                  <li>
                    <strong>Regular Updates:</strong> As your data and systems evolve, regularly re-run edge case 
                    detection to identify new potential issues.
                  </li>
                  <li>
                    <strong>Documentation:</strong> Keep detailed records of identified edge cases and how they 
                    were addressed for future reference and knowledge sharing.
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
                  <h4 className="font-medium">Machine Learning Robustness</h4>
                  <p className="text-sm text-muted-foreground">
                    Test ML models against unusual inputs to ensure they perform correctly across all possible scenarios.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Software Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate boundary condition tests to verify application behavior at the limits of expected operation.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Data Validation</h4>
                  <p className="text-sm text-muted-foreground">
                    Identify data points that should trigger special handling in data processing pipelines.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Security Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Create edge cases that might expose security vulnerabilities in applications or systems.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Risk Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    Identify rare but high-impact scenarios for business risk planning and mitigation strategies.
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

export default UserGuideEdgeCases;
