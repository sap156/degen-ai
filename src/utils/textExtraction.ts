
/**
 * Utilities for extracting text from various file types
 */
import { getFileType } from './fileOperations';
import { readFileContent } from './fileOperations';
import { FileProcessingResult, SupportedFileType } from './fileTypes';
import { autoDetectAndParse } from './dataParsing';

/**
 * Extract text content from a file using appropriate method based on file type
 * @param file The file to process
 * @param apiKey OpenAI API key for processing complex file types
 * @returns Promise resolving to the extracted text content
 */
export const extractTextFromFile = async (
  file: File, 
  apiKey: string | null
): Promise<FileProcessingResult> => {
  const fileType = getFileType(file);
  const fileName = file.name;
  const fileSize = file.size;
  const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
  
  // Basic metadata that's available for all files
  const metadata: Record<string, any> = {
    fileName,
    fileType,
    fileSize: `${fileSizeInMB} MB`,
    dateProcessed: new Date().toISOString()
  };
  
  try {
    switch (fileType) {
      case 'csv':
      case 'json':
      case 'txt':
      case 'xml':
        // For text-based formats, just read the content directly
        const content = await readFileContent(file);
        return { text: content, metadata };
        
      case 'pdf':
        // For PDF files, use vision AI to extract text
        if (!apiKey) {
          throw new Error("API key is required to process PDF files");
        }
        return await extractWithVisionAI(file, apiKey, metadata);
      
      case 'docx':
      case 'doc' as SupportedFileType:
      case 'xlsx':
      case 'xls' as SupportedFileType:
      case 'pptx':
      case 'ppt' as SupportedFileType:
        // For other document types, also use vision AI
        if (!apiKey) {
          throw new Error("API key is required to process this file type");
        }
        return await extractWithVisionAI(file, apiKey, metadata);
        
      default:
        // Try to extract with AI for unknown file types
        if (apiKey) {
          // Determine the best extraction method based on file type
          const mimeType = file.type;
          if (mimeType.startsWith('image/')) {
            return await extractWithVisionAI(file, apiKey, metadata);
          } else {
            return await extractWithVisionAI(file, apiKey, metadata);
          }
        }
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
};

/**
 * Extract text from any file using OpenAI's Vision capabilities
 */
const extractWithVisionAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    
    // Convert the file to base64
    const fileContent = await readFileAsBase64(file);
    
    // Create a detailed prompt for document text extraction
    const systemPrompt = `You are a document text extraction specialist. Your ONLY task is to extract all text content from this document.
    
    CRITICAL INSTRUCTIONS:
    - Return ONLY the actual text content from the document in a clean, readable format
    - Preserve the document's structure (paragraphs, sections, lists, etc.) when possible
    - Include all meaningful text, but ignore watermarks, headers/footers, and page numbers
    - If there are tables, format them in a readable way
    - DO NOT analyze or summarize the content
    - DO NOT include any explanations about what you're seeing or doing
    - DO NOT include phrases like "The document contains..."
    - DO NOT describe images - only extract text
    - If the document appears to be encrypted, corrupted, or contains no readable text, simply state "No readable text content found in this document."
    
    Just extract and return the text as if someone had copied and pasted it from the document.`;
    
    const userPrompt = `Extract all text content from this document. Return ONLY the extracted text, formatted clearly.`;
    
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { 
        role: 'user' as const, 
        content: [
          { type: 'text', text: userPrompt },
          { 
            type: 'image_url', 
            image_url: {
              url: fileContent,
              detail: 'high'
            }
          }
        ]
      }
    ];
    
    console.log(`Extracting text from ${baseMetadata.fileType} file using AI vision...`);
    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o'  // Using vision capable model
    });
    
    return {
      text: response,
      metadata: {
        ...baseMetadata,
        processingMethod: 'AI-vision extraction',
        aiModel: 'gpt-4o',
        contentLength: response.length
      }
    };
    
  } catch (error) {
    console.error('Error extracting with Vision AI:', error);
    throw error;
  }
};

/**
 * Read file as text
 */
const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result.toString());
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Convert a file to base64 data URL
 */
const readFileAsBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result.toString());
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract structured data from text content using AI
 * @param text The text content to process
 * @param apiKey OpenAI API key for processing
 * @param format The desired output format
 * @returns Promise resolving to structured data
 */
export const extractStructuredDataWithAI = async (
  text: string,
  apiKey: string,
  format: 'json' | 'csv' = 'json'
): Promise<any> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    
    // First, try to auto-detect and parse the content
    try {
      const parsedData = autoDetectAndParse(text);
      if (parsedData && (Array.isArray(parsedData) || typeof parsedData === 'object')) {
        return parsedData;
      }
    } catch (e) {
      // If auto-detection fails, continue with AI processing
      console.log('Auto-detection failed, proceeding with AI processing');
    }
    
    // Use AI to extract structured data
    const messages = [
      { 
        role: 'system' as const, 
        content: `You are a data extraction expert. Extract structured data from the provided text and return it in ${format === 'json' ? 'JSON format' : 'CSV format with comma-separated values'}.`
      },
      { 
        role: 'user' as const, 
        content: `Extract structured data from the following text and return it in ${format} format:\n\n${text}`
      }
    ];
    
    const response = await getCompletion(apiKey, messages, { 
      model: 'gpt-4o-mini'
    });
    
    if (format === 'json') {
      // Try to extract JSON from the response
      try {
        const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```|(\{[\s\S]*\}|\[[\s\S]*\])/;
        const match = response.match(jsonRegex);
        
        if (match) {
          const jsonString = (match[1] || match[2]).trim();
          return JSON.parse(jsonString);
        } else {
          // If no JSON block found, try parsing the entire response
          return JSON.parse(response);
        }
      } catch (e) {
        console.error('Failed to parse JSON from AI response:', e);
        return { raw: response };
      }
    } else {
      // Return CSV as is, client can parse it if needed
      return response;
    }
  } catch (error) {
    console.error('Error extracting structured data with AI:', error);
    throw error;
  }
};
