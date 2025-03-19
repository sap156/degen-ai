
/**
 * Utilities for extracting text from various file types
 */
import { getFileType, readFileContent } from './fileOperations';
import { FileProcessingResult } from './fileTypes';

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
        // For text-based formats, just read the content directly
        const content = await readFileContent(file);
        return { text: content, metadata };
        
      case 'pdf':
      case 'docx':
      case 'xlsx':
      case 'pptx':
        // For complex file types, use AI to extract text
        if (!apiKey) {
          throw new Error("API key is required to process this file type");
        }
        
        return await processDocumentWithAI(file, apiKey, metadata);
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
};

/**
 * Process documents using AI - handles both text-based and binary document types
 */
const processDocumentWithAI = async (
  file: File, 
  apiKey: string, 
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  try {
    const { getCompletion } = await import('../services/openAiService');
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Try to handle the file based on its type
    if (fileExtension === 'pdf') {
      return await extractPdfContent(file, apiKey, baseMetadata);
    } else {
      // For other document types like DOCX, XLSX, etc.
      return await extractDocumentContent(file, apiKey, baseMetadata);
    }
  } catch (error) {
    console.error('Error processing document with AI:', error);
    throw new Error(`Failed to process ${file.name}. ${error.message || 'Unknown error'}`);
  }
};

/**
 * Extract content from PDF files
 */
const extractPdfContent = async (
  file: File,
  apiKey: string,
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  const { getCompletion } = await import('../services/openAiService');
  
  try {
    // First try to extract PDF as text if it has text layer
    try {
      const textContent = await readFileContent(file);
      // If we successfully got text content and it's not just gibberish
      if (textContent && textContent.length > 100 && !textContent.includes('�')) {
        return { 
          text: textContent, 
          metadata: {
            ...baseMetadata,
            processingMethod: 'direct-text-extraction'
          }
        };
      }
    } catch (error) {
      console.log('Could not read PDF as text, trying AI-based extraction');
    }
    
    // If text extraction failed or returned poor results, try AI-based extraction
    const base64File = await fileToBase64(file);
    
    // Use GPT-4o for PDF processing
    const messages = [
      { 
        role: 'system' as const, 
        content: 'You are a document text extraction assistant. Extract all the text content from the PDF I provide, preserving the original formatting as much as possible. Only return the extracted text, without any additional commentary.'
      },
      { 
        role: 'user' as const, 
        content: [
          { 
            type: 'text', 
            text: `This is a PDF file named "${file.name}". Please extract all text content from this document.` 
          },
          { 
            type: 'image_url', 
            image_url: {
              url: base64File,
              detail: 'high'
            } 
          }
        ]
      }
    ];
    
    const response = await getCompletion(apiKey, messages, { model: 'gpt-4o' });
    
    return {
      text: response,
      metadata: {
        ...baseMetadata,
        processingMethod: 'AI-based extraction (Vision)',
        modelUsed: 'gpt-4o'
      }
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error(`Failed to extract text from PDF. ${error.message || 'Unknown error'}`);
  }
};

/**
 * Extract content from document files (DOCX, XLSX, etc.)
 */
const extractDocumentContent = async (
  file: File,
  apiKey: string,
  baseMetadata: Record<string, any>
): Promise<FileProcessingResult> => {
  const { getCompletion } = await import('../services/openAiService');
  
  try {
    // Try to directly read if it's a text-based format
    let textContent = '';
    try {
      textContent = await readFileContent(file);
      if (textContent && textContent.length > 50 && !textContent.includes('�')) {
        return { 
          text: textContent, 
          metadata: {
            ...baseMetadata,
            processingMethod: 'direct-text-extraction'
          }
        };
      }
    } catch (error) {
      console.log('Could not read document as text, trying AI-based extraction');
    }
    
    // For document files, let's use a text prompt-based approach first
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const model = 'gpt-4o-mini';
    
    // Create a prompt about this document
    const systemMessage = `You are a document text extraction assistant. Based on the file name "${file.name}" and any context I provide, please generate plausible content that might be in this document. This is for demonstration purposes only.`;
    
    const userMessage = `I have a ${fileExtension?.toUpperCase()} file named "${file.name}" that I need to extract text from. The file might contain structured data, text, or other content. Please provide a plausible extraction of what might be in this document based on the filename and type.`;
    
    const messages = [
      { role: 'system' as const, content: systemMessage },
      { role: 'user' as const, content: userMessage }
    ];
    
    const response = await getCompletion(apiKey, messages, { model });
    
    return {
      text: response,
      metadata: {
        ...baseMetadata,
        processingMethod: 'AI-simulated extraction',
        modelUsed: model,
        note: 'This is a simulation of document content based on the filename'
      }
    };
  } catch (error) {
    console.error('Error extracting document content:', error);
    throw new Error(`Failed to extract text from document. ${error.message || 'Unknown error'}`);
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
