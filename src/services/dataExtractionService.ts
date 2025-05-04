
import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";
import { readFileAsArrayBuffer } from "@/utils/fileOperations";
import { extractTextFromUrl, extractTextFromImageUrl, extractTextFromFile } from "@/utils/textExtraction";

/**
 * Types of data that can be extracted
 */
export type ExtractionType = 'tables' | 'lists' | 'text' | 'json' | 'key-value';

/**
 * Source of data for extraction
 */
export type ExtractionSource = 'web' | 'images';

/**
 * Response format for extracted data
 */
export interface ExtractedData {
  raw: string;
  format: 'json' | 'text' | 'html';
  structured?: any;
  summary?: string;
}

/**
 * Strip markdown code blocks from a string
 */
const stripMarkdownCodeBlocks = (text: string): string => {
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
 * Extract data from a URL using CrewAI's ScrapeElementFromWebsiteTool
 */
export const extractDataFromUrl = async (
  apiKey: string | null,
  url: string,
  extractionType: ExtractionType,
  userQuery?: string
): Promise<ExtractedData> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  try {
    // Get CSS selector based on extraction type
    let cssSelector = 'body'; // Default to entire body
    if (extractionType === 'tables') {
      cssSelector = 'table';
    } else if (extractionType === 'lists') {
      cssSelector = 'ul, ol';
    }
    
    // Use the CrewAI web scraping tool to extract content
    const result = await extractTextFromUrl(url, cssSelector);
    const extractedText = result.text;
    
    // Now analyze and structure the extracted content using OpenAI
    // Get current date and time in ISO format
    const currentTimestamp = new Date().toISOString();

    // Create system message based on extraction type with enhanced instructions
    const systemMessage = `You are an expert data extraction AI assistant specialized in extracting structured data from web content.
    I've already scraped content from ${url} using CSS selector '${cssSelector}' and will provide you with the raw extracted text.
    Your task is to analyze and structure this content as ${extractionType}.
    ${extractionType === 'tables' ? 'Focus on properly formatting all tables, preserving their structure.' : ''}
    ${extractionType === 'lists' ? 'Focus on properly formatting all lists, including those with multiple levels.' : ''}
    ${extractionType === 'key-value' ? 'Focus on finding and properly formatting all key-value pairs, such as specifications, properties, or attributes.' : ''}
    ${extractionType === 'text' ? 'Structure the main textual content, preserving important information.' : ''}
    ${extractionType === 'json' ? 'Create a comprehensive JSON representation of the content with proper nesting and relationships.' : ''}
    ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
    
    IMPORTANT: Only use the data I provide. Do NOT hallucinate or make up information.
    If there is no content matching the extraction type, state this explicitly rather than inventing data.
    
    Return your response as clean JSON WITHOUT markdown formatting or code blocks. The response should be DIRECTLY parseable by JSON.parse() without any cleanup.
    Use this structure:
    {
      "extracted_data": [...], // The main extracted content
      "text_content": "The main textual content of the page", 
      "images": [], // Array of image URLs found (if any)
      "metadata": {
        "source_url": "${url}",
        "extraction_type": "${extractionType}",
        "timestamp": "${currentTimestamp}",
        "query": "${userQuery || 'none'}"
      },
      "summary": "A brief summary of what was extracted"
    }`;

    // Create user message with the extracted content
    const userMessage = `Here is the content extracted from ${url} using CSS selector '${cssSelector}':\n\n${extractedText}\n\n${
      userQuery ? `Please analyze this content with focus on: ${userQuery}` : 'Please analyze this content'
    }`;

    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];

    const model = localStorage.getItem('openai-model') || 'gpt-4o';
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model
    });
    
    try {
      // Clean the response if it contains markdown code blocks
      const cleanedResponse = stripMarkdownCodeBlocks(response);
      
      // Try to parse as JSON
      const jsonData = JSON.parse(cleanedResponse);
      return {
        raw: cleanedResponse,
        format: 'json',
        structured: jsonData,
        summary: jsonData.summary || 'Data extracted successfully'
      };
    } catch (error) {
      // If parsing fails, return as text
      console.warn('Failed to parse response as JSON:', error);
      return {
        raw: response,
        format: 'text'
      };
    }
  } catch (error) {
    console.error('Error extracting data from URL:', error);
    throw error;
  }
};

/**
 * Extract data from an image using CrewAI's VisionTool
 */
export const extractDataFromImage = async (
  apiKey: string | null,
  imageFile: File,
  extractionType: ExtractionType,
  userQuery?: string
): Promise<ExtractedData> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  try {
    // Convert image to base64 for the VisionTool
    const base64Image = await fileToBase64(imageFile);
    
    // Extract text from the image using CrewAI VisionTool
    const { text: extractedText, metadata } = await extractTextFromFile(imageFile, apiKey);
    
    // Now process the extracted text with OpenAI to structure it according to the extraction type
    
    // Create system message based on extraction type
    const systemMessage = `You are an expert OCR and data extraction AI assistant specialized in extracting structured data from images.
    I've already processed an image using OCR and will provide you with the extracted text.
    Your task is to analyze and structure this content as ${extractionType}.
    ${extractionType === 'tables' ? 'Focus on properly formatting all tables, preserving their structure.' : ''}
    ${extractionType === 'key-value' ? 'Focus on identifying key-value pairs, especially for forms, receipts, or invoices.' : ''}
    ${extractionType === 'text' ? 'Structure all readable text, preserving layout when possible.' : ''}
    ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
    
    IMPORTANT: Only use the data I provide. Do NOT hallucinate or make up information.
    If there is no content matching the extraction type, state this explicitly rather than inventing data.
    
    Return your response as clean JSON WITHOUT markdown formatting or code blocks. The response should be DIRECTLY parseable by JSON.parse() without any cleanup.
    Use this structure:
    {
      "extracted_data": [...], // The main extracted content
      "text_content": "All the readable text from the image",
      "images": [], // This would be empty for images but keep the field for consistency
      "metadata": {
        "source_type": "image",
        "filename": "${imageFile.name}",
        "extraction_type": "${extractionType}",
        "timestamp": "${new Date().toISOString()}",
        "query": "${userQuery || 'none'}"
      },
      "summary": "A brief summary of what was extracted"
    }`;

    // Create user message with the extracted text
    const userMessage = `Here is the text extracted from an image using OCR:\n\n${extractedText}\n\n${
      userQuery ? `Please analyze this text with focus on: ${userQuery}` : 'Please analyze this text'
    }`;

    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];

    // Use the model that supports text processing
    const model = localStorage.getItem('openai-model') || 'gpt-4o';
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model
    });
    
    try {
      // Clean the response if it contains markdown code blocks
      const cleanedResponse = stripMarkdownCodeBlocks(response);
      
      // Try to parse as JSON
      const jsonData = JSON.parse(cleanedResponse);
      return {
        raw: cleanedResponse,
        format: 'json',
        structured: jsonData,
        summary: jsonData.summary || 'Data extracted successfully'
      };
    } catch (error) {
      // If parsing fails, return as text
      console.warn('Failed to parse response as JSON:', error);
      return {
        raw: response,
        format: 'text'
      };
    }
  } catch (error) {
    console.error('Error extracting data from image:', error);
    throw error;
  }
};

/**
 * Convert file to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Process extracted data with a follow-up query using OpenAI
 */
export const processExtractedData = async (
  apiKey: string | null,
  extractedData: string,
  userQuery: string
): Promise<ExtractedData> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  const systemMessage = `You are an expert data analyst AI assistant. 
  Your task is to analyze the provided extracted data and answer the user's specific query about it.
  Be precise and focus only on the information requested.
  IMPORTANT: Do NOT hallucinate or make up information. Only use the data provided to you.
  If you cannot answer the question based on the extracted data, clearly state this.
  
  Return your response as clean JSON WITHOUT markdown formatting or code blocks. The response should be DIRECTLY parseable by JSON.parse() without any cleanup.
  Use this structure:
  {
    "answer": "Your detailed answer to the query",
    "relevant_data": [...], // Any specific data points relevant to the query
    "confidence": "high/medium/low", // How confident you are in your answer
    "images": [], // Keep any relevant image URLs from the original extraction
    "text_content": "Your detailed answer in a narrative format",
    "summary": "A brief summary of your findings"
  }`;

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: `Here is the extracted data:\n\n${extractedData}\n\nMy question is: ${userQuery}` }
  ];

  try {
    const model = localStorage.getItem('openai-model') || 'gpt-4o';
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model
    });
    
    try {
      // Clean the response if it contains markdown code blocks
      const cleanedResponse = stripMarkdownCodeBlocks(response);
      
      // Try to parse as JSON
      const jsonData = JSON.parse(cleanedResponse);
      return {
        raw: cleanedResponse,
        format: 'json',
        structured: jsonData,
        summary: jsonData.answer || 'Analysis completed'
      };
    } catch (error) {
      // If parsing fails, return as text
      console.warn('Failed to parse response as JSON:', error);
      return {
        raw: response,
        format: 'text'
      };
    }
  } catch (error) {
    console.error('Error processing extracted data:', error);
    throw error;
  }
};
