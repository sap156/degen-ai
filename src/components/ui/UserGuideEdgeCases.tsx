
import React from "react";
import { AlertTriangle, GitBranch, FileText, Settings, BarChart3, BrainCircuit, FileDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const UserGuideEdgeCases = () => {
  return (
    <div className="w-full space-y-4 py-4">
      <h2 className="text-2xl font-bold tracking-tight">Edge Cases Guide</h2>
      <p className="text-muted-foreground">
        Identify, generate, and test edge cases to improve model robustness.
      </p>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="what-are-edge-cases">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              What are Edge Cases?
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <p className="text-muted-foreground mb-2">
              Edge cases are unusual or rare data points that may cause your model to 
              behave unexpectedly. Identifying and addressing these can improve model robustness.
            </p>
            <p className="text-muted-foreground">
              Edge cases often represent data that falls outside the normal distribution or common patterns. 
              These outliers can reveal weaknesses in your model and highlight areas for improvement.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="types-of-edge-cases">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-500" />
              Types of Edge Cases
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Anomalies:</strong> Unusual data points that deviate significantly from the norm</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Rare Classes:</strong> Underrepresented categories in your dataset</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Adversarial:</strong> Samples designed to trick your model</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span><strong>Boundary Cases:</strong> Samples near decision boundaries</span>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="edge-case-detection">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Edge Case Detection
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <p className="text-muted-foreground mb-2">
              The detection feature uses advanced AI to identify potential edge cases in your dataset:
            </p>
            <ul className="space-y-1 text-muted-foreground mb-3">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Analyzes your data to find outliers and unusual patterns</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Provides confidence scores for each detected edge case</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Explains why each data point was flagged as an edge case</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Assigns an edge case score to prioritize your focus</span>
              </li>
            </ul>
            <p className="text-muted-foreground text-xs">
              <strong>Tip:</strong> Start with the highest-scoring edge cases when addressing model improvements.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="synthetic-case-generation">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-purple-500" />
              Synthetic Case Generation
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <p className="text-muted-foreground mb-2">
              Generate AI-powered synthetic edge cases to test and improve your model:
            </p>
            <ul className="space-y-1 text-muted-foreground mb-3">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>AI-based Generation:</strong> Uses neural networks to create variations that push model boundaries</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span><strong>Domain-specific Rules:</strong> Applies business rules focused on known edge conditions</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Modifies feature values intelligently to create challenging test cases</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <span>Includes confidence scores and detailed modification explanations</span>
              </li>
            </ul>
            <p className="text-muted-foreground text-xs">
              <strong>Use case:</strong> Augment training data with synthetic examples to build more robust models.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="complexity-level">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              Complexity Level
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <p className="text-muted-foreground mb-2">
              Adjust the complexity level to control the intensity of edge case detection and generation:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span><strong>Low (10-30%):</strong> Subtle variations and minor statistical outliers</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span><strong>Medium (40-60%):</strong> Moderate deviations that challenge model assumptions</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-500 mr-2">•</span>
                <span><strong>High (70-90%):</strong> Extreme cases that push the boundaries of your model</span>
              </li>
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">
              <strong>Best practice:</strong> Start with medium complexity and adjust based on your model's performance.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="model-testing">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Model Testing
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <p className="text-muted-foreground mb-2">
              Evaluate your model's performance on both regular data and edge cases:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Compares overall accuracy vs. edge case accuracy</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Identifies false positives and false negatives</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Calculates a robustness score (1-10 scale)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Highlights features most impacted by edge cases</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Provides specific recommendations to improve robustness</span>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="comprehensive-reporting">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-blue-600" />
              Comprehensive Reporting
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <p className="text-muted-foreground mb-2">
              Generate detailed reports on edge case analysis with professional insights:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Executive Summary:</strong> Key findings and recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Detection Findings:</strong> Analysis of identified edge cases</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Generation Results:</strong> Overview of synthetic case creation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Model Performance:</strong> Detailed performance metrics</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Impact Analysis:</strong> Business implications of edge case handling</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Implementation Code:</strong> Pseudocode for implementing recommendations</span>
              </li>
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">
              <strong>Export formats:</strong> Download as JSON for further analysis or integration with other tools.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="getting-started">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              Getting Started
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm">
            <ol className="space-y-1 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">1.</span>
                <span>Upload your dataset (CSV or JSON format)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">2.</span>
                <span>Select your target variable and edge case type</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">3.</span>
                <span>Choose your preferred generation method</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">4.</span>
                <span>Run detection, generation, or model testing</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">5.</span>
                <span>Export your findings and generated data</span>
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator className="my-4" />
      
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>Powered by OpenAI API</strong> - The edge case detection, generation, and testing 
          capabilities are enhanced by advanced AI models to provide the most accurate analysis.
        </p>
        <p>
          For optimal results, ensure your dataset is clean, properly formatted, and contains 
          a sufficient number of samples to enable meaningful edge case analysis.
        </p>
      </div>
    </div>
  );
};

export default UserGuideEdgeCases;
