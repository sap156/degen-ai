import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";

/**
 * Types of text processing operations
 */
export type ProcessingType = 
  | 'structuring' 
  | 'cleaning' 
  | 'ner' 
  | 'topics' 
  | 'summarization' 
  | 'sentiment' 
  | 'tagging';

/**
 * Response format for processed text
 */
export interface ProcessedText {
  raw: string;
  format: 'json' | 'text' | 'html';
  structured?: any;
  summary?: string;
}

/**
 * Strip markdown code blocks from a string
 */
export const stripMarkdownCodeBlocks = (text: string): string => {
  // Check if the text starts with ```json or other markdown code indicators
  const codeBlockRegex = /^```(?:json|javascript|js)?\n([\s\S]*?)```$/m;
  const match = text.match(codeBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no code block found or if the regex didn't match properly,
  // do a more aggressive cleanup to handle partial markdown
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
};

/**
 * Process text with AI to extract structured information
 */
export const processTextWithAI = async (
  apiKey: string | null,
  text: string,
  processingType: ProcessingType,
  options?: {
    detailLevel?: 'brief' | 'standard' | 'detailed';
    outputFormat?: 'json' | 'text';
    userContext?: string;
  }
): Promise<ProcessedText> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  // If text is too long, truncate it for processing
  // Most LLMs have context limits around 100K characters
  const maxTextLength = 50000; // Characters
  const truncatedText = text.length > maxTextLength 
    ? text.substring(0, maxTextLength) + "\n\n[Note: Text was truncated due to length limitations. Analysis is based on the first 50,000 characters.]" 
    : text;

  const detailLevel = options?.detailLevel || 'standard';
  const outputFormat = options?.outputFormat || 'json';
  const userContext = options?.userContext || '';

  // Create system message based on processing type
  let systemMessage = `You are an expert data analysis AI assistant specialized in processing and analyzing textual data.
  Your task is to ${getProcessingInstructions(processingType, detailLevel)}.
  
  ${userContext ? `Additional context: ${userContext}` : ''}
  
  IMPORTANT: Do NOT hallucinate or make up information. Only analyze the provided text.
  
  ${outputFormat === 'json' ? 'Return your response as clean JSON without markdown formatting or code blocks.' : 'Return your response as structured text with clear sections and highlights.'}`;

  // Create user message with the text to process
  const userMessage = `Process the following text using ${processingType} analysis:\n\n${truncatedText}`;

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    if (outputFormat === 'json') {
      try {
        // Remove markdown code blocks if present
        const cleanedResponse = stripMarkdownCodeBlocks(response);
        
        // Try to parse as JSON
        const jsonData = JSON.parse(cleanedResponse);
        return {
          raw: response,
          format: 'json',
          structured: jsonData,
          summary: jsonData.summary || 'Text processed successfully'
        };
      } catch (error) {
        // If parsing fails, return as text
        console.warn('Failed to parse response as JSON:', error);
        return {
          raw: response,
          format: 'text'
        };
      }
    } else {
      return {
        raw: response,
        format: 'text'
      };
    }
  } catch (error) {
    console.error('Error processing text with AI:', error);
    throw error;
  }
};

/**
 * Get detailed processing instructions based on the processing type
 */
const getProcessingInstructions = (processingType: ProcessingType, detailLevel: 'brief' | 'standard' | 'detailed'): string => {
  switch (processingType) {
    case 'structuring':
      return `convert the unstructured text into well-structured JSON format. 
      Identify key sections, paragraphs, lists, and tabular data within the text.
      Extract and organize the information in a hierarchical structure that preserves relationships.
      Process the ENTIRE dataset, including all records presented to you.
      ${detailLevel === 'detailed' ? 'Include as much detail as possible, preserving all information from the original text.' : 
        detailLevel === 'brief' ? 'Focus only on the most important information, creating a concise structure.' : 
        'Create a balanced structure that captures the main information without excessive detail.'}`;
    
    case 'cleaning':
      return `clean and normalize the provided text data.
      This includes:
      - Fixing spelling and grammar errors
      - Standardizing date and number formats
      - Removing duplicate information
      - Correcting common typos
      - Normalizing inconsistent formatting
      - Standardizing abbreviations and terms
      Process the ENTIRE dataset, including all records presented to you.
      ${detailLevel === 'detailed' ? 'Provide exhaustive cleaning with explanations of all changes made.' : 
        detailLevel === 'brief' ? 'Focus on major issues only with minimal changes.' : 
        'Apply reasonable cleaning while preserving the original meaning.'}`;
    
    case 'ner':
      return `perform Named Entity Recognition (NER) on the provided text.
      Identify and extract:
      - People's names
      - Organizations
      - Locations/Places
      - Dates and times
      - Monetary values
      - Percentages
      - Product names
      Process the ENTIRE dataset, including all records presented to you.
      ${detailLevel === 'detailed' ? 'Extract all entities with their context and relationships to other entities.' : 
        detailLevel === 'brief' ? 'Extract only the main entities without additional context.' : 
        'Extract entities with basic contextual information.'}`;
    
    case 'topics':
      return `extract the main topics and themes from the provided text.
      Identify key discussion points, concepts, and subject matters.
      Analyze relationships between topics and how they connect.
      Process the ENTIRE dataset, including all records presented to you.
      ${detailLevel === 'detailed' ? 'Provide an in-depth analysis of all topics with subtopics, hierarchical relationships, and comprehensive coverage.' : 
        detailLevel === 'brief' ? 'Extract only the 3-5 most significant topics or themes.' : 
        'Extract the main topics with brief descriptions and basic relationships.'}`;
    
    case 'summarization':
      return `generate a concise summary of the provided text.
      Capture the key points, main arguments, and important details.
      Present the information in a well-structured, logical flow.
      Process the ENTIRE dataset, including all records presented to you.
      ${detailLevel === 'detailed' ? 'Create a comprehensive summary that covers all significant points while reducing length by 40-50%.' : 
        detailLevel === 'brief' ? 'Create a very brief summary (1-2 paragraphs) capturing only the most essential information.' : 
        'Create a balanced summary reducing the original text by approximately 70% while preserving key information.'}`;
    
    case 'sentiment':
      return `analyze the sentiment and intent expressed in the provided text.
      Determine the overall tone (positive, negative, neutral, or mixed).
      Identify the likely intent behind the text (e.g., complaint, inquiry, praise, request, information).
      Process the ENTIRE dataset, including all records presented to you.
      ${detailLevel === 'detailed' ? 'Provide a comprehensive sentiment analysis with evidence for each classification, emotional undertones, and intensity levels.' : 
        detailLevel === 'brief' ? 'Provide only the primary sentiment and intent without detailed explanation.' : 
        'Provide the main sentiment classifications with basic supporting evidence.'}`;
    
    case 'tagging':
      return `automatically generate relevant tags and categories for the provided text.
      Assign appropriate subject tags based on content.
      Categorize the text into relevant domains or fields.
      Process the ENTIRE dataset, including all records presented to you.
      ${detailLevel === 'detailed' ? 'Generate an extensive set of hierarchical tags and categories with confidence scores and reasoning.' : 
        detailLevel === 'brief' ? 'Generate only 3-5 of the most relevant tags or categories.' : 
        'Generate a reasonable set of tags and categories (5-10) that accurately represent the content.'}`;
    
    default:
      return 'analyze the provided text and extract relevant information';
  }
};

/**
 * Process document with multiple AI analyses
 */
export const processDocumentWithAI = async (
  apiKey: string | null,
  text: string,
  processingTypes: ProcessingType[],
  options?: {
    detailLevel?: 'brief' | 'standard' | 'detailed';
    outputFormat?: 'json' | 'text';
    userContext?: string;
  }
): Promise<Record<ProcessingType, ProcessedText>> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  const results: Partial<Record<ProcessingType, ProcessedText>> = {};
  
  // Process each requested analysis type
  for (const processingType of processingTypes) {
    try {
      const result = await processTextWithAI(apiKey, text, processingType, options);
      results[processingType] = result;
    } catch (error) {
      console.error(`Error processing ${processingType}:`, error);
      toast.error(`Failed to complete ${processingType} analysis`);
    }
  }
  
  return results as Record<ProcessingType, ProcessedText>;
};
