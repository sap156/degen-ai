
import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";
import { FileProcessingResult, extractTextFromFile } from "../utils/fileUploadUtils";

/**
 * Types of data that can be extracted
 */
export type ExtractionType = 'tables' | 'lists' | 'text' | 'json' | 'key-value';

/**
 * Source of data for extraction
 */
export type ExtractionSource = 'web' | 'documents';

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
 * Extract data from a URL using OpenAI
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

  // Get current date and time in ISO format
  const currentTimestamp = new Date().toISOString();

  // Create system message based on extraction type with enhanced instructions
  const systemMessage = `You are an expert data extraction AI assistant specialized in extracting structured data from web content.
  Your task is to extract ${extractionType} from the provided URL content.
  ${extractionType === 'tables' ? 'Focus on finding and properly formatting all tables, including those that might be dynamically generated. Look for table-like structures even if not in traditional HTML table format.' : ''}
  ${extractionType === 'lists' ? 'Focus on finding and properly formatting all lists, including those with multiple levels.' : ''}
  ${extractionType === 'key-value' ? 'Focus on finding and properly formatting all key-value pairs, such as specifications, properties, or attributes.' : ''}
  ${extractionType === 'text' ? 'Extract the main textual content, preserving important information and structure.' : ''}
  ${extractionType === 'json' ? 'Create a comprehensive JSON representation of the page content with proper nesting and relationships.' : ''}
  ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
  
  Important notes:
  1. If you cannot access the content directly, describe what you're able to see and what might be missing.
  2. For dynamic content, try to extract whatever is visible in the current state.
  3. Always use the current timestamp in your metadata.
  4. If you find no content matching the extraction type, try to provide alternative useful data from the page.
  
  Return your response in valid JSON format with the following structure:
  {
    "extracted_data": [...], // The main extracted content
    "metadata": {
      "source_url": "${url}",
      "extraction_type": "${extractionType}",
      "timestamp": "${currentTimestamp}",
      "query": "${userQuery || 'none'}"
    },
    "summary": "A brief summary of what was extracted"
  }
  
  Do NOT include any explanatory text outside the JSON structure.`;

  // Create user message with the URL
  const userMessage = userQuery 
    ? `Extract data from ${url}. Specifically, I need information about: ${userQuery}`
    : `Extract ${extractionType} from ${url}`;

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ];

  try {
    const model = localStorage.getItem('openai-model') || 'gpt-4o-mini';
    const response = await getCompletion(apiKey, messages, { model });
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(response);
      return {
        raw: response,
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
 * Extract data from a document file using OpenAI
 */
export const extractDataFromDocument = async (
  apiKey: string | null,
  file: File,
  extractionType: ExtractionType,
  userQuery?: string
): Promise<ExtractedData> => {
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  try {
    // First extract text from the document
    const fileResult: FileProcessingResult = await extractTextFromFile(file, apiKey);
    
    if (!fileResult.text || fileResult.text.trim() === '') {
      throw new Error("No text could be extracted from the document");
    }

    // Get current date and time in ISO format
    const currentTimestamp = new Date().toISOString();
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase() || 'unknown';
    
    // Create system message based on extraction type
    const systemMessage = `You are an expert document analysis AI assistant specialized in extracting structured data from various document formats.
    Your task is to extract ${extractionType} from the provided document text (from a ${fileType} file).
    ${extractionType === 'tables' ? 'Focus on finding and properly formatting all tables, preserving their structure and relationships.' : ''}
    ${extractionType === 'key-value' ? 'Focus on identifying key-value pairs, especially for forms, receipts, or invoices.' : ''}
    ${extractionType === 'lists' ? 'Focus on finding and properly formatting all lists, including those with multiple levels.' : ''}
    ${extractionType === 'text' ? 'Organize extracted text in a coherent and readable manner, preserving the document structure.' : ''}
    ${extractionType === 'json' ? 'Create a comprehensive JSON representation of the document content with proper nesting and relationships.' : ''}
    ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
    
    Return your response in valid JSON format with the following structure:
    {
      "extracted_data": [...], // The main extracted content
      "metadata": {
        "source_type": "document",
        "file_type": "${fileType}",
        "filename": "${file.name}",
        "extraction_type": "${extractionType}",
        "timestamp": "${currentTimestamp}",
        "query": "${userQuery || 'none'}"
      },
      "summary": "A brief summary of what was extracted"
    }
    
    If you cannot extract certain parts of the document, indicate this in your response.
    Do NOT include any explanatory text outside the JSON structure.`;

    // Create user message 
    const userMessage = userQuery 
      ? `Extract data from this ${fileType} document. Specifically, I need information about: ${userQuery}\n\nDocument content:\n${fileResult.text}`
      : `Extract ${extractionType} from this ${fileType} document.\n\nDocument content:\n${fileResult.text}`;

    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ];

    const model = 'gpt-4o-mini';
    const response = await getCompletion(apiKey, messages, { model });
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(response);
      return {
        raw: response,
        format: 'json',
        structured: jsonData,
        summary: jsonData.summary || 'Data extracted successfully'
      };
    } catch (error) {
      // If parsing fails, return as text
      console.warn('Failed to parse response as JSON:', error);
      
      // Try to clean the response in case it has markdown code blocks
      const cleanedResponse = cleanJsonResponse(response);
      try {
        const jsonData = JSON.parse(cleanedResponse);
        return {
          raw: cleanedResponse,
          format: 'json',
          structured: jsonData,
          summary: jsonData.summary || 'Data extracted successfully'
        };
      } catch (nestedError) {
        // If still fails, return as text
        return {
          raw: response,
          format: 'text'
        };
      }
    }
  } catch (error) {
    console.error('Error extracting data from document:', error);
    throw error;
  }
};

/**
 * Extract data from an image using OpenAI
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

  // Check if file is a document type instead of an image
  const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
  const isDocument = ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(fileExt || '');
  
  if (isDocument) {
    return extractDataFromDocument(apiKey, imageFile, extractionType, userQuery);
  }

  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Create system message based on extraction type
    const systemMessage = `You are an expert OCR and data extraction AI assistant specialized in extracting structured data from images.
    Your task is to extract ${extractionType} from the provided image.
    ${extractionType === 'tables' ? 'Focus on finding and properly formatting all tables, including those that might be dynamically generated. Look for table-like structures even if not in traditional HTML table format.' : ''}
    ${extractionType === 'key-value' ? 'Focus on identifying key-value pairs, especially for forms, receipts, or invoices.' : ''}
    ${extractionType === 'text' ? 'Extract all readable text, preserving layout when possible.' : ''}
    ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
    
    Return your response in valid JSON format with the following structure:
    {
      "extracted_data": [...], // The main extracted content
      "metadata": {
        "source_type": "image",
        "filename": "${imageFile.name}",
        "extraction_type": "${extractionType}",
        "timestamp": "${new Date().toISOString()}",
        "query": "${userQuery || 'none'}"
      },
      "summary": "A brief summary of what was extracted"
    }
    
    If you cannot read or extract certain parts of the image, indicate this in your response.
    Do NOT include any explanatory text outside the JSON structure.`;

    // Create user message with the image query
    const userMessage = userQuery 
      ? `Extract data from this image. Specifically, I need information about: ${userQuery}`
      : `Extract ${extractionType} from this image`;

    // For OpenAI we need to send the image in a specific format
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemMessage },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: userMessage },
          { 
            type: 'image_url', 
            image_url: {
              url: base64Image,
              detail: 'high'
            } 
          }
        ]
      }
    ];

    // Use the model that supports image processing
    const model = 'gpt-4o';
    
    const response = await getCompletion(apiKey, messages, { model });
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(response);
      return {
        raw: response,
        format: 'json',
        structured: jsonData,
        summary: jsonData.summary || 'Data extracted successfully'
      };
    } catch (error) {
      // If parsing fails, try to clean the response
      console.warn('Failed to parse response as JSON:', error);
      
      // Try to clean the response in case it has markdown code blocks
      const cleanedResponse = cleanJsonResponse(response);
      try {
        const jsonData = JSON.parse(cleanedResponse);
        return {
          raw: cleanedResponse,
          format: 'json',
          structured: jsonData,
          summary: jsonData.summary || 'Data extracted successfully'
        };
      } catch (nestedError) {
        // If still fails, return as text
        return {
          raw: response,
          format: 'text'
        };
      }
    }
  } catch (error) {
    console.error('Error extracting data from image:', error);
    throw error;
  }
};

/**
 * Clean a JSON response that might contain markdown code blocks
 */
const cleanJsonResponse = (response: string): string => {
  // Remove markdown code blocks if present
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  
  // Remove any text before the first { and after the last }
  const firstBrace = response.indexOf('{');
  const lastBrace = response.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return response.substring(firstBrace, lastBrace + 1);
  }
  
  return response;
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
  
  Return your response in valid JSON format with the following structure:
  {
    "answer": "Your detailed answer to the query",
    "relevant_data": [...], // Any specific data points relevant to the query
    "confidence": "high/medium/low" // How confident you are in your answer
  }
  
  Do NOT include any explanatory text outside the JSON structure.`;

  const messages: OpenAiMessage[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: `Here is the extracted data:\n\n${extractedData}\n\nMy question is: ${userQuery}` }
  ];

  try {
    const model = localStorage.getItem('openai-model') || 'gpt-3.5-turbo';
    const response = await getCompletion(apiKey, messages, { model });
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(response);
      return {
        raw: response,
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
