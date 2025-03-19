
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, EyeOff, Database, Key, UserX } from 'lucide-react';

const UserGuidePiiHandling = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          PII Data Handling User Guide
        </CardTitle>
        <CardDescription>
          Learn how to safely process, mask, and generate PII data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is PII Data Handling?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Personally Identifiable Information (PII) is any data that could potentially identify a specific individual. 
                  This service helps you:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Detect PII in existing datasets</li>
                  <li>Anonymize or mask sensitive information</li>
                  <li>Generate realistic but synthetic PII data for testing</li>
                  <li>Apply different masking rules depending on data type and sensitivity</li>
                  <li>Ensure compliance with data protection regulations</li>
                </ul>
                <p>
                  Proper PII handling is essential for maintaining user privacy and complying with regulations like GDPR, CCPA, and HIPAA.
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
                    <h4 className="font-medium">PII Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically identify various types of PII in your datasets, including names, addresses, phone numbers, and more.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <EyeOff className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Data Masking</h4>
                    <p className="text-sm text-muted-foreground">
                      Apply various masking techniques to hide or transform sensitive information while preserving data utility.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <UserX className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Anonymization</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove identifying information while maintaining statistical properties of the dataset.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Key className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Synthetic PII Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Create realistic but fake personal data for testing and development environments.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Compliance Tools</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure your data handling practices align with privacy regulations and best practices.
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
                  <h4 className="font-medium mb-1">Detecting and Masking PII</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Upload your dataset in CSV or JSON format</li>
                    <li>Run PII detection to identify sensitive information</li>
                    <li>Configure masking settings:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Select fields to mask</li>
                        <li>Choose masking methods for each field type</li>
                        <li>Set preservation level (e.g., preserve first 2 digits of phone numbers)</li>
                      </ul>
                    </li>
                    <li>Apply masking to transform your data</li>
                    <li>Review the masked dataset and download</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Generating Synthetic PII</h4>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>Navigate to the Synthetic PII Generator tab</li>
                    <li>Configure your dataset:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Number of records to generate</li>
                        <li>Types of PII to include (names, addresses, SSNs, etc.)</li>
                        <li>Regional settings (country, language)</li>
                        <li>Patterns and constraints</li>
                      </ul>
                    </li>
                    <li>Generate the synthetic dataset</li>
                    <li>Review and download in your preferred format</li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="masking-methods">
            <AccordionTrigger>Masking Methods Explained</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Different types of PII require different masking approaches. Here are the common methods available:
                </p>
                <ul className="space-y-2">
                  <li className="pt-1">
                    <span className="font-medium">Redaction</span>: 
                    <span className="text-sm text-muted-foreground block ml-4">
                      Replaces characters with a single symbol (e.g., "John Smith" → "XXX XXXXX").
                      Best for completely hiding information when data utility isn't needed.
                    </span>
                  </li>
                  <li className="pt-1">
                    <span className="font-medium">Masking</span>: 
                    <span className="text-sm text-muted-foreground block ml-4">
                      Partially replaces characters while keeping some visible (e.g., "555-123-4567" → "555-XXX-XXXX").
                      Useful when some context is needed while still protecting identity.
                    </span>
                  </li>
                  <li className="pt-1">
                    <span className="font-medium">Tokenization</span>: 
                    <span className="text-sm text-muted-foreground block ml-4">
                      Substitutes sensitive data with non-sensitive equivalents (tokens).
                      Good for preserving uniqueness and relationships without exposing actual values.
                    </span>
                  </li>
                  <li className="pt-1">
                    <span className="font-medium">Pseudonymization</span>: 
                    <span className="text-sm text-muted-foreground block ml-4">
                      Replaces real values with fictitious but realistic alternatives (e.g., "John Smith" → "Michael Johnson").
                      Ideal for maintaining data realism while protecting identities.
                    </span>
                  </li>
                  <li className="pt-1">
                    <span className="font-medium">Generalization</span>: 
                    <span className="text-sm text-muted-foreground block ml-4">
                      Reduces precision of the data (e.g., exact age → age range).
                      Helpful for statistical analysis while reducing identification risk.
                    </span>
                  </li>
                  <li className="pt-1">
                    <span className="font-medium">Encryption</span>: 
                    <span className="text-sm text-muted-foreground block ml-4">
                      Transforms data using a cipher that can be reversed with the right key.
                      Best when original values need to be recovered by authorized users.
                    </span>
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="tips">
            <AccordionTrigger>Tips and Best Practices</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Identify All PII:</strong> Be thorough in identifying all possible forms of PII, including 
                    combinations of fields that could identify an individual.
                  </li>
                  <li>
                    <strong>Consistent Masking:</strong> Use consistent masking across related datasets to maintain referential 
                    integrity when the same person appears in multiple places.
                  </li>
                  <li>
                    <strong>Data Minimization:</strong> Only collect and retain PII that is absolutely necessary for your purpose, 
                    and delete it when no longer needed.
                  </li>
                  <li>
                    <strong>Consider Re-identification Risks:</strong> Even masked data can sometimes be re-identified when 
                    combined with other datasets, so assess these risks.
                  </li>
                  <li>
                    <strong>Test With Synthetic Data:</strong> Use synthetic PII for development and testing environments to 
                    eliminate risk entirely.
                  </li>
                  <li>
                    <strong>Document Your Process:</strong> Maintain records of how PII is handled to demonstrate compliance 
                    with regulations.
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
                  <h4 className="font-medium">Development and Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Create realistic but non-sensitive data for developing and testing applications without exposing real customer information.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Data Sharing</h4>
                  <p className="text-sm text-muted-foreground">
                    Prepare datasets for sharing with partners, researchers, or third parties while protecting individual privacy.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Regulatory Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    Meet requirements of privacy regulations like GDPR, CCPA, and HIPAA when processing personal data.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Analytics and Research</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable data analysis while preserving privacy by using anonymized or pseudonymized data.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Data Breach Mitigation</h4>
                  <p className="text-sm text-muted-foreground">
                    Reduce the impact of potential data breaches by storing masked or tokenized data instead of raw PII.
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

export default UserGuidePiiHandling;
