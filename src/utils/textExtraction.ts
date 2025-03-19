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
      case 'docx':
      case 'doc' as SupportedFileType:
      case 'xlsx':
      case 'xls' as SupportedFileType:
      case 'pptx':
      case 'ppt' as SupportedFileType:
        // For complex file types, use alternative extraction methods
        if (!apiKey) {
          throw new Error("API key is required to process this file type");
        }
        
        // For PDF files, we'll handle differently than other document types
        if (fileType === 'pdf') {
          return await extractPdfWithAI(file, apiKey, metadata);
        }
        
        return await extractDocumentWithAI(file, apiKey, metadata);
        
      default:
        // Try to extract with AI for unknown file types
        if (apiKey) {
          // Determine the best extraction method based on file type
          const mimeType = file.type;
          if (mimeType.startsWith('image/')) {
            return await extractImageWithAI(file, apiKey, metadata);
          } else {
            return await extractDocumentWithAI(file, apiKey, metadata);
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
 * Extract text from PDF files using AI
 */
const extractPdfWithAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    
    // For PDFs, we'll use a text-based approach first
    const fileContent = await readFileAsText(file);
    
    // If we got readable text content, we can just return it
    if (fileContent && fileContent.length > 100) {
      return {
        text: fileContent,
        metadata: {
          ...baseMetadata,
          processingMethod: 'text-based extraction',
          contentLength: fileContent.length
        }
      };
    }
    
    // If text extraction failed, try using the document AI approach
    console.log("Text-based PDF extraction yielded insufficient results, trying with document AI...");
    return await extractDocumentWithAI(file, apiKey, baseMetadata);
  } catch (error) {
    console.error('Error extracting PDF with AI:', error);
    throw error;
  }
};

/**
 * Extract text from images using AI vision capabilities
 */
const extractImageWithAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    
    // Read the file content to base64 for sending to OpenAI
    const fileContent = await readFileAsBase64(file);
    
    // Create a detailed prompt for image text extraction
    const systemPrompt = `You are a document text extraction specialist. Your task is to extract all text content from this image.
    
    IMPORTANT: DO NOT provide any explanations, code samples, or instructions. 
    Return ONLY the extracted text content from the image.`;
    
    const userPrompt = `Extract all text content from this image.`;
    
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
    
    console.log(`Extracting text from image using AI vision...`);
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
    console.error('Error extracting image with AI:', error);
    throw error;
  }
};

/**
 * Extract text from document files using document AI approach
 */
const extractDocumentWithAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    // Try to extract text using specialized document APIs or services
    // For now, we'll use a simple approach to handle document files
    
    // First try to read directly as text for some formats
    try {
      const textContent = await readFileAsText(file);
      if (textContent && textContent.length > 100) {
        return {
          text: textContent,
          metadata: {
            ...baseMetadata,
            processingMethod: 'text-based extraction',
            contentLength: textContent.length
          }
        };
      }
    } catch (e) {
      console.log('Direct text extraction failed, falling back to alternative methods');
    }
    
    // If we cannot get the content directly, inform the user
    const fileType = baseMetadata.fileType;
    return {
      text: `This ${fileType.toUpperCase()} file requires specialized document processing capabilities. 
      
The current implementation doesn't fully support this file type.

Please try converting the file to a supported format like PDF, TXT, or CSV.`,
      metadata: {
        ...baseMetadata,
        processingMethod: 'limited extraction',
        status: 'partial_support'
      }
    };
    
  } catch (error) {
    console.error('Error extracting document with AI:', error);
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
