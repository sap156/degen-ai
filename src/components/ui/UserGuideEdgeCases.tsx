
import React from "react";
import { AlertTriangle, GitBranch, FileText } from "lucide-react";
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
            <p className="text-muted-foreground">
              Edge cases are unusual or rare data points that may cause your model to 
              behave unexpectedly. Identifying and addressing these can improve model robustness.
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
    </div>
  );
};

export default UserGuideEdgeCases;
