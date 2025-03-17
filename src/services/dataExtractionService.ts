
import { toast } from "sonner";
import { getCompletion, OpenAiMessage } from "./openAiService";

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

  // Create system message based on extraction type
  const systemMessage = `You are an expert data extraction AI assistant specialized in extracting structured data from web content.
  Your task is to extract ${extractionType} from the provided URL content.
  ${extractionType === 'tables' ? 'Focus on finding and properly formatting all tables.' : ''}
  ${extractionType === 'lists' ? 'Focus on finding and properly formatting all lists.' : ''}
  ${extractionType === 'key-value' ? 'Focus on finding and properly formatting all key-value pairs.' : ''}
  ${extractionType === 'text' ? 'Extract the main textual content, preserving important information.' : ''}
  ${extractionType === 'json' ? 'Create a comprehensive JSON representation of the page content.' : ''}
  ${userQuery ? `Pay special attention to information related to: ${userQuery}` : ''}
  
  Return your response in valid JSON format with the following structure:
  {
    "extracted_data": [...], // The main extracted content
    "metadata": {
      "source_url": "${url}",
      "extraction_type": "${extractionType}",
      "timestamp": "current_time",
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
    const model = localStorage.getItem('openai-model') || 'gpt-3.5-turbo';
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
    ${extractionType === 'tables' ? 'Focus on finding and properly formatting all tables.' : ''}
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
