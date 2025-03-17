
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Layers, 
  PenTool, 
  FileSearch, 
  Database, 
  FileText, 
  SmilePlus, 
  Tag, 
  HelpCircle 
} from 'lucide-react';

interface ProcessingTypeInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  example: string;
}

const processingTypes: ProcessingTypeInfo[] = [
  {
    id: 'structuring',
    title: 'Auto-Structuring',
    description: 'Converts free-text and unstructured data into structured formats like JSON or tabular data. This helps organize information into a machine-readable format.',
    icon: <Layers className="h-5 w-5 text-blue-500" />,
    example: 'Free text: "John Smith purchased 3 items on April 5th for $42.99" → Structured data: {"name": "John Smith", "items": 3, "date": "2023-04-05", "amount": 42.99}'
  },
  {
    id: 'cleaning',
    title: 'Data Cleaning',
    description: 'Identifies and fixes errors, inconsistencies, and formatting issues in your data. This includes standardizing formats, correcting typos, and removing duplicates.',
    icon: <PenTool className="h-5 w-5 text-green-500" />,
    example: 'Standardizing phone numbers like (123) 456-7890, 123-456-7890, and 123.456.7890 to a consistent format +1-123-456-7890'
  },
  {
    id: 'ner',
    title: 'Named Entity Recognition (NER)',
    description: 'Identifies and extracts entities such as names, organizations, locations, dates, monetary values, and more from text documents.',
    icon: <FileSearch className="h-5 w-5 text-amber-500" />,
    example: 'Text: "Apple Inc. is planning to open a new store in New York City next Thursday" → Entities: "Apple Inc." (Organization), "New York City" (Location), "next Thursday" (Date)'
  },
  {
    id: 'topics',
    title: 'Topic Extraction',
    description: 'Identifies the main subjects or themes discussed in a document. This helps categorize content and understand what a document is about.',
    icon: <Database className="h-5 w-5 text-purple-500" />,
    example: 'From a news article about climate change, extract topics: "global warming", "carbon emissions", "renewable energy", "environmental policy"'
  },
  {
    id: 'summarization',
    title: 'Summarization',
    description: 'Creates concise summaries of longer documents while preserving the key information and main points.',
    icon: <FileText className="h-5 w-5 text-indigo-500" />,
    example: 'A 10-page research paper → A 200-word abstract highlighting the methodology, findings, and conclusions'
  },
  {
    id: 'sentiment',
    title: 'Sentiment Analysis',
    description: 'Analyzes text to determine the emotional tone or attitude expressed, classifying it as positive, negative, or neutral.',
    icon: <SmilePlus className="h-5 w-5 text-pink-500" />,
    example: 'Text: "I absolutely love this product! Best purchase ever!" → Sentiment: Positive (0.92)'
  },
  {
    id: 'tagging',
    title: 'Auto-Tagging',
    description: 'Automatically assigns relevant tags, labels, or categories to documents based on their content, making them easier to search and organize.',
    icon: <Tag className="h-5 w-5 text-orange-500" />,
    example: 'A customer support email → Tags: "technical issue", "billing", "high priority", "enterprise customer"'
  }
];

const ProcessingTypesGuide: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          AI Processing Types Guide
        </CardTitle>
        <CardDescription>
          Learn what each processing type does and how it can help analyze your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {processingTypes.map((type) => (
            <AccordionItem key={type.id} value={type.id}>
              <AccordionTrigger className="flex items-center">
                <div className="flex items-center gap-2">
                  {type.icon}
                  <span>{type.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                  <div className="mt-2 rounded-md bg-muted p-3">
                    <p className="text-xs font-medium">Example:</p>
                    <p className="text-xs">{type.example}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ProcessingTypesGuide;
