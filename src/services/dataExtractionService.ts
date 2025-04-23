
import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";
import { readFileAsArrayBuffer } from "@/utils/fileOperations";

/**
 * Types of data that can be extracted
 */
export type ExtractionType = 'tables' | 'lists' | 'text' | 'json' | 'key-value';

/**
 * Source of data for extraction
 */
export type ExtractionSource = 'web' | 'images' | 'documents';

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
  ${extractionType === 'text' ? 'Extract the main textual content, preserving important information and structure. Also identify and extract URLs of images found on the page.' : ''}
  ${extractionType === 'json' ? 'Create a comprehensive JSON representation of the page content with proper nesting and relationships. Separate textual content from image URLs.' : ''}
  ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
  
  Important notes:
  1. If you cannot access the content directly, describe what you're able to see and what might be missing.
  2. For dynamic content, try to extract whatever is visible in the current state.
  3. Always use the current timestamp in your metadata.
  4. If you find no content matching the extraction type, try to provide alternative useful data from the page.
  5. For text and JSON extraction, identify and extract image URLs separately from textual content.
  
  Return your response in valid JSON format with the following structure:
  {
    "extracted_data": [...], // The main extracted content
    "text_content": "The main textual content of the page", 
    "images": ["url1", "url2", ...], // Array of image URLs found on the page
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
    const model = 'gpt-4o';
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
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

  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Create system message based on extraction type
    const systemMessage = `You are an expert OCR and data extraction AI assistant specialized in extracting structured data from images.
    Your task is to extract ${extractionType} from the provided image.
    ${extractionType === 'tables' ? 'Focus on finding and properly formatting all tables, including those that might be dynamically generated. Look for table-like structures even if not in traditional HTML table format.' : ''}
    ${extractionType === 'key-value' ? 'Focus on identifying key-value pairs, especially for forms, receipts, or invoices.' : ''}
    ${extractionType === 'text' ? 'Extract all readable text, preserving layout when possible. Also identify any embedded images and describe them briefly.' : ''}
    ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
    
    Return your response in valid JSON format with the following structure:
    {
      "extracted_data": [...], // The main extracted content
      "text_content": "All the readable text from the image",
      "images": [], // This would be empty for images but keep the field for consistency
      "metadata": {
        "source_type": "image",
        "filename": "${imageFile.name}",
        "extraction_type": "${extractionType}",
        "timestamp": "current_time",
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
    const model = 'gpt-4o'; // Using gpt-4o as it supports vision
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
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
    console.error('Error extracting data from image:', error);
    throw error;
  }
};

/**
 * Extract data from documents like PDFs, DOC, PPT, etc.
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
    // For PDF files, we could use a library like pdf.js to extract text
    // For this implementation, we'll simulate by asking the AI to process based on file description
    
    // Create system message based on document type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const fileType = getDocumentType(fileExt);
    
    const systemMessage = `You are an expert document analysis AI assistant specialized in extracting structured data from ${fileType} files.
    Your task is to extract ${extractionType} from the provided ${fileType} file.
    ${extractionType === 'tables' ? 'Focus on finding and properly formatting all tables in the document.' : ''}
    ${extractionType === 'key-value' ? 'Focus on identifying key-value pairs and important document metadata.' : ''}
    ${extractionType === 'text' ? 'Extract all readable text content from the document. Also identify and describe any embedded images.' : ''}
    ${extractionType === 'json' ? 'Create a comprehensive JSON representation of the document content.' : ''}
    ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
    
    Return your response in valid JSON format with the following structure:
    {
      "extracted_data": [...], // The main extracted content
      "text_content": "The main textual content of the document",
      "images": ["description1", "description2"], // Descriptions or URLs of images found in the document
      "metadata": {
        "source_type": "${fileType}",
        "filename": "${file.name}",
        "extraction_type": "${extractionType}",
        "timestamp": "${new Date().toISOString()}",
        "query": "${userQuery || 'none'}"
      },
      "summary": "A brief summary of what was extracted"
    }
    
    If you cannot read or extract certain parts of the document, indicate this in your response.
    Do NOT include any explanatory text outside the JSON structure.`;

    // For this demo, we'll simulate document extraction with a limited approach
    // Using the file information to prompt the AI
    const fileInfo = `Filename: ${file.name}
    File type: ${fileType}
    File size: ${(file.size / 1024).toFixed(2)} KB
    Last modified: ${new Date(file.lastModified).toISOString()}`;

    // Create messages array
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Extract data from this ${fileType} file: ${fileInfo}. ${userQuery || ''}` }
    ];

    // In a real implementation, we would extract the content from the file
    // and provide it to the AI for analysis
    
    const response = await getCompletion(apiKey, messages, {
      temperature: 0.3,
      max_tokens: 16384,
      model: localStorage.getItem('openai-model') || 'gpt-4o'
    });
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(response);
      return {
        raw: response,
        format: 'json',
        structured: jsonData,
        summary: jsonData.summary || `Data extracted from ${fileType} file`
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
    console.error('Error extracting data from document:', error);
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
 * Determine document type from file extension
 */
const getDocumentType = (extension: string): string => {
  switch (extension) {
    case 'pdf':
      return 'PDF document';
    case 'doc':
    case 'docx':
      return 'Word document';
    case 'ppt':
    case 'pptx':
      return 'PowerPoint presentation';
    case 'xls':
    case 'xlsx':
      return 'Excel spreadsheet';
    default:
      return 'document';
  }
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
    "confidence": "high/medium/low", // How confident you are in your answer
    "images": [], // Keep any relevant image URLs from the original extraction
    "text_content": "Your detailed answer in a narrative format",
    "summary": "A brief summary of your findings"
  }
  
  Do NOT include any explanatory text outside the JSON structure.`;

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
